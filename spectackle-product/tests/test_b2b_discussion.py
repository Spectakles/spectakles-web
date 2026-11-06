import asyncio
from pathlib import Path
import tempfile
from types import SimpleNamespace as NS
import unittest

from browser_backend.contracts import Participant, default_settings
from browser_backend.discussion import DiscussionRun
from browser_backend.recordings import RecordingStore
from tests.discussion_fakes import PanelFactory


class PreparationTests(unittest.IsolatedAsyncioTestCase):
    async def test_learner_ready_respects_policy_without_developer_tools(self):
        for allowed in (False, True):
            with self.subTest(allowed=allowed), tempfile.TemporaryDirectory() as folder:
                store = RecordingStore(Path(folder)); record = store.create('Fixture')
                settings = default_settings().model_copy(update={'allow_preparation_skip': allowed})
                messages = []
                async def send(value): messages.append(value)
                run = DiscussionRun(store, record.directory.name, send,
                    template={'settings': settings.model_dump(mode='json')}, dev_tools=False)
                commands = iter([{'type': 'preparation_ready', 'connection': run.id}, {'type': 'end', 'connection': run.id}])
                async def receive():
                    import json
                    return {'type': 'websocket.receive', 'text': json.dumps(next(commands))}
                await run.receive(NS(receive=receive))
                self.assertEqual(messages[0], {'type': 'preparation_result', 'accepted': allowed})
                self.assertEqual(run.prep_skipped, allowed)

    async def test_two_and_five_bot_lifecycles_connect_and_close_every_owned_session(self):
        for size in (2, 5):
            with self.subTest(size=size), tempfile.TemporaryDirectory() as folder:
                settings = default_settings()
                panel = settings.panel[:2] if size == 2 else settings.panel + (
                    Participant(id='nina', name='Nina', role='Researcher', voice='Kore'),
                    Participant(id='rohan', name='Rohan', role='Educator', voice='Puck'))
                settings = settings.model_copy(update={'panel': panel})
                store = RecordingStore(Path(folder)); record = store.create('Fixture')
                async def send(value): pass
                factory = PanelFactory()
                run = DiscussionRun(store, record.directory.name, send, clients_factory=factory,
                    config=settings.resolve('Human'), prep_seconds=0, template={'settings': settings.model_dump(mode='json')})
                task = asyncio.create_task(run.lifecycle())
                try:
                    for _ in range(100):
                        if run.ready: break
                        await asyncio.sleep(.01)
                    self.assertTrue(run.ready)
                    self.assertEqual(set(run.engine.sessions), {person.id for person in panel})
                    self.assertEqual(len(factory.instances), size)
                    self.assertEqual(len(run.snapshot()['panel']), size)
                finally:
                    run.end(); await asyncio.wait_for(task, 3)
                self.assertTrue(all(provider.closed for provider in factory.instances))
