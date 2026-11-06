import asyncio
from dataclasses import replace
import json
from pathlib import Path
import tempfile
import time
from types import SimpleNamespace as NS
import unittest

from fastapi.testclient import TestClient
from browser_backend.discussion import DiscussionRun, recover_discussions
from browser_backend.discussion_audio import BrowserSpeaker
from browser_backend.main import create_app
from browser_backend.playback import PACKET
from browser_backend.recordings import RecordingStore
from gd_engine.config import SessionConfig
from gd_engine.models import Floor
from .discussion_fakes import PanelFactory
from .test_stage6_live import onset, audio, ending


class SpeakerTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.messages = []
        async def send(value): self.messages.append(value)
        self.speaker = BrowserSpeaker(send, lambda *a, **kw: None)
        self.heard = []
        self.speaker.engine = NS(state=NS(current_bot='arjun',cue_kind='discussion',leader_id='user'),
                                 emit_heard=lambda state, player: self.heard.extend(player.pop_heard()))
        self.task = asyncio.create_task(self.speaker.stream())

    async def asyncTearDown(self):
        self.speaker.close(); self.task.cancel()
        await asyncio.gather(self.task, return_exceptions=True)

    async def test_received_is_not_heard_and_floor_waits_for_device(self):
        self.speaker.write(b'\0\0' * 960)
        self.speaker.caption('arjun', 'Only after playback.')
        self.speaker.generation_complete()
        await asyncio.sleep(.05)
        self.assertGreater(self.speaker.buffered_ms(), 0)
        self.assertEqual(self.speaker.pop_heard(), [])
        self.speaker.acknowledge({'type':'progress','connection':self.speaker.ledger.connection,'turn':1,'played':960})
        self.assertEqual(self.heard, [('arjun','Only after playback.')])
        self.assertEqual(self.speaker.buffered_ms(), 0)

    async def test_cut_retains_only_acknowledged_fragments_and_cutoff(self):
        self.speaker.write(b'\0\0'*480); self.speaker.caption('arjun','Heard prefix.')
        self.speaker.write(b'\0\0'*480); self.speaker.caption('arjun','Unheard suffix.')
        await asyncio.sleep(.03)
        self.speaker.clear()
        self.assertGreater(self.speaker.buffered_ms(),0)
        self.speaker.acknowledge({'type':'cut','connection':self.speaker.ledger.connection,'turn':1,'played':480})
        self.assertEqual(self.heard,[('arjun','Heard prefix.'),('arjun','[cut off]')])
        self.assertEqual(self.speaker.buffered_ms(),0)
        self.assertFalse(self.speaker.allow_output('arjun',NS(interrupted=False,turn_complete=False)))
        self.assertFalse(self.speaker.allow_output('arjun',NS(interrupted=True,turn_complete=False)))
        self.assertTrue(self.speaker.allow_output('arjun',NS(interrupted=False,turn_complete=False)))

    async def test_generated_output_bound_and_short_tail_padding(self):
        self.speaker.write(b'\0\0'*101);self.speaker.generation_complete()
        await asyncio.sleep(.03)
        packets=[m for m in self.messages if isinstance(m,bytes)]
        self.assertEqual(len(packets),1); self.assertEqual(len(packets[0]),980)
        self.speaker.current=None
        with self.assertRaises(ValueError): self.speaker.write(b'\0\0'*(24000*20+1))


class LifecycleTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=RecordingStore(Path(self.tmp.name))
        self.recording=self.store.create('Synthetic microphone')
        self.messages=[]
        async def send(value): self.messages.append(value)
        self.factory=PanelFactory()
        self.run=DiscussionRun(self.store,self.recording.directory.name,send,clients_factory=self.factory,prep_seconds=120)

    async def asyncTearDown(self):
        self.run.end();self.tmp.cleanup()

    async def test_prep_makes_no_provider_calls_and_end_is_idempotent(self):
        task=asyncio.create_task(self.run.lifecycle()); await asyncio.sleep(.03)
        self.assertEqual(self.factory.instances,[])
        self.assertEqual(self.run.snapshot()['phase'],'preparing')
        self.assertAlmostEqual(self.run.snapshot()['remaining_ms'],720000)
        self.run.end();self.run.end('must not replace first reason')
        await asyncio.wait_for(task,1)
        self.assertEqual(self.run.reason,'ended_by_user')

    async def test_twelve_minutes_phase_boundaries_and_human_has_no_intro_cap(self):
        state=self.run.engine.state;self.run.ready=True;state.leader_id='user'
        state.discussion_started_t=time.monotonic()-31
        self.assertEqual(self.run.snapshot()['phase'],'discussion')
        self.assertIsNone(self.run.snapshot()['intro_remaining_ms'])
        for elapsed,phase in [(601,'closing'),(661,'final_minute'),(721,'expired')]:
            state.discussion_started_t=time.monotonic()-elapsed
            self.assertEqual(self.run.snapshot()['phase'],phase)
        self.assertFalse(state.ended)

    async def test_restart_recovers_active_discussion_evidence(self):
        await self.run.save();recover_discussions(self.store)
        value=json.loads(self.run.path.read_text())
        self.assertEqual(value['status'],'incomplete');self.assertEqual(value['end_reason'],'backend_restart')

    async def test_stop_during_startup_closes_all_owned_provider_clients(self):
        self.run.prep_deadline=time.monotonic()
        task=asyncio.create_task(self.run.lifecycle())
        for _ in range(100):
            if self.run.ready:break
            await asyncio.sleep(.01)
        self.assertTrue(self.run.ready)
        self.assertEqual(len(self.factory.instances),3)
        self.run.end();await asyncio.wait_for(task,2)
        self.assertTrue(all(p.closed for p in self.factory.instances));self.assertTrue(self.factory.closed)


class SocketTests(unittest.TestCase):
    def test_full_panel_routes_and_artifact_is_readable_after_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            factory=PanelFactory()
            config=replace(SessionConfig(),discussion_minutes=12,opening_wait_s=.02)
            app=create_app(Path(tmp),discussion_clients=factory,discussion_prep=0,discussion_config=config)
            recording=app.state.recording_store.create('Synthetic')
            with TestClient(app) as client:
                with client.websocket_connect('/api/discussions/ws',headers={'origin':'http://127.0.0.1:5174'}) as socket:
                    socket.send_json({'type':'hello','version':1,'recording_id':recording.directory.name})
                    ready=socket.receive_json();connection=ready['connection']
                    speakers=set();received=0;turn=0
                    for _ in range(300):
                        event=socket.receive()
                        if event.get('bytes'):
                            _,turn,_,offset,count=PACKET.unpack_from(event['bytes'])
                            received+=count
                            socket.send_json({'type':'progress','connection':connection,'turn':turn,'played':offset+count})
                        elif event.get('text'):
                            body=json.loads(event['text'])
                            if body['type']=='begin':speakers.add(body['speaker'])
                            if len(speakers)==3:break
                    self.assertEqual(speakers,{'arjun','sahil','meera'})
                    socket.send_json({'type':'end','connection':connection})
                    while socket.receive()['type']!='websocket.close':pass
                evidence=client.get(ready['session_url']).json()
                self.assertEqual(evidence['status'],'complete')
                self.assertGreater(len(evidence['transcript']),0)
                self.assertTrue(factory.closed)
                self.assertEqual(client.post('/api/discussions/'+connection+'/end').status_code,200)
                self.assertEqual(client.get('/api/discussions/invalid/invalid').status_code,404)

    def test_prep_rejects_input_and_second_tab_is_bounded(self):
        with tempfile.TemporaryDirectory() as tmp:
            factory=PanelFactory();app=create_app(Path(tmp),discussion_clients=factory,discussion_prep=120)
            recording=app.state.recording_store.create('Synthetic')
            with TestClient(app) as client:
                with client.websocket_connect('/api/discussions/ws',headers={'origin':'http://127.0.0.1:5174'}) as socket:
                    socket.send_json({'type':'hello','version':1,'recording_id':recording.directory.name})
                    ready=socket.receive_json()
                    with self.assertRaises(Exception):
                        with client.websocket_connect('/api/discussions/ws',headers={'origin':'http://127.0.0.1:5174'}):pass
                    socket.send_json({**onset(),'connection':ready['connection']})
                    while socket.receive()['type']!='websocket.close':pass
                self.assertEqual(factory.instances,[])
                self.assertTrue(client.get(ready['session_url']).json()['incomplete'])
