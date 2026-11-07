"""Controlled full-panel providers. Imported explicitly by tests, never by URLs."""
import asyncio
from contextlib import asynccontextmanager, suppress
import json
from types import SimpleNamespace as NS

from browser_backend.playback import fixture
from gd_engine.providers import ProviderClients


def response(**values):
    content = dict(input_transcription=None, output_transcription=None, model_turn=None,
                   interrupted=False, turn_complete=False)
    content.update(values)
    return NS(session_resumption_update=None, go_away=None, server_content=NS(**content))


class PanelProvider:
    def __init__(self, name, factory):
        self.name, self.factory = name, factory
        self.queue = asyncio.Queue()
        self.calls = []
        self.producer = None
        self.closed = False

    async def _cancel_reply(self):
        if self.producer and not self.producer.done():
            self.producer.cancel()
            with suppress(asyncio.CancelledError):
                await self.producer
            await self.queue.put(response(interrupted=True))

    async def send_realtime_input(self, **kwargs):
        self.calls.append(kwargs)
        if 'activity_start' in kwargs:
            await self._cancel_reply()
        if 'activity_end' in kwargs:
            self.producer = asyncio.create_task(self.reply(human=True))

    async def send_client_content(self, **kwargs):
        self.calls.append(kwargs)
        if kwargs.get('turn_complete'):
            await self._cancel_reply()
            self.producer = asyncio.create_task(self.reply())

    async def reply(self, human=False):
        if human:
            await self.queue.put(response(input_transcription=NS(text='AI can improve education, but access must be fair.')))
        pcm, _ = fixture()
        pcm = pcm[:int(24000 * 2 * self.factory.reply_seconds)]
        for i, offset in enumerate(range(0, len(pcm), 4800)):
            await self.queue.put(response(model_turn=NS(parts=[NS(inline_data=NS(data=pcm[offset:offset + 4800]))]),
                output_transcription=NS(text=f'{self.name} fragment {i}.')))
            await asyncio.sleep(.01)
        await self.queue.put(response(turn_complete=True))

    async def receive(self):
        while True:
            item = await self.queue.get()
            yield item
            if item.server_content.turn_complete:
                break

    async def close(self):
        self.closed = True
        if self.producer:
            self.producer.cancel()
            with suppress(asyncio.CancelledError):
                await self.producer


class PanelFactory:
    def __init__(self, reply_seconds=.2, routing_delay=0):
        self.instances = []
        self.routing_calls = []
        self.reply_seconds = reply_seconds
        self.routing_delay = routing_delay
        self.closed = False
        self.roster = ('arjun', 'sahil', 'meera')

    @asynccontextmanager
    async def connect(self, **kwargs):
        voice = kwargs['config'].speech_config.voice_config.prebuilt_voice_config.voice_name
        name = {'Kore': 'arjun', 'Puck': 'sahil', 'Charon': 'meera'}[voice]
        provider = PanelProvider(name, self)
        self.instances.append(provider)
        try:
            yield provider
        finally:
            await provider.close()

    async def generate(self, **kwargs):
        self.routing_calls.append(kwargs)
        await asyncio.sleep(self.routing_delay)
        allowed = kwargs['config'].response_json_schema['properties']['speaker_id']['enum']
        bot = self.roster[len(self.routing_calls) % 3]
        if bot not in allowed:
            bot = allowed[0]
        text = '\n'.join(part.text or '' for content in kwargs['contents'] for part in content.parts)
        return NS(text=json.dumps({'speaker_id': bot, 'prompt': 'Develop the discussion.', 'reason': 'controlled test',
                     'opening_speaker': 'user' if 'AI can improve education' in text else 'none',
                     'conclusion_state': 'not_started', 'conclusion_speaker': 'none',
                     'discussion_summary': 'Fair access and AI in education.'}))

    def __call__(self, config):
        async def close():
            self.closed = True
        live = NS(aio=NS(live=NS(connect=self.connect), aclose=close), close=lambda: None)
        routing = NS(aio=NS(models=NS(generate_content=self.generate), aclose=close), close=lambda: None)
        return ProviderClients(live, routing)
