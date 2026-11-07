"""Optional paid provider smoke; synthetic input and simulated output ACKs only.

Run with the same server-side credentials as the accepted CLI. Never imports
microphone/speaker hardware. This is not a subjective listening acceptance.
"""
import asyncio
from dataclasses import replace
import json
import os
from pathlib import Path
import time

from browser_backend.discussion import DiscussionRun
from browser_backend.live import INPUT_PACKET
from browser_backend.playback import PACKET
from browser_backend.recordings import RecordingStore
from gd_engine.config import SessionConfig


async def main():
    root=Path('/private/tmp/spectakles-final/real-smoke')
    store=RecordingStore(root);recording=store.create('Synthetic provider smoke')
    speakers=set();run=None;packets=0
    async def send(value):
        nonlocal packets
        if isinstance(value,bytes):
            _,turn,_,offset,count=PACKET.unpack_from(value)
            packets+=1
            await asyncio.sleep(.02)
            run.speaker.acknowledge({'type':'progress','connection':run.id,'turn':turn,'played':offset+count})
        elif value['type']=='begin':
            speakers.add(value['speaker']);print('speaker',value['speaker'],flush=True)
        elif value['type']=='server_cut':
            run.speaker.acknowledge({'type':'cut','connection':run.id,'turn':value['turn'],'played':run.speaker.ledger.played})
    config=replace(SessionConfig.from_env(),discussion_minutes=12,opening_wait_s=3)
    run=DiscussionRun(store,recording.directory.name,send,prep_seconds=0,config=config)
    tasks=[asyncio.create_task(coro) for coro in (run.lifecycle(),run.speaker.stream(),run.monitor())]
    try:
        deadline=time.monotonic()+50
        while not run.ready and not run.stop.is_set() and time.monotonic()<deadline:
            for task in tasks:
                if task.done():await task
            await asyncio.sleep(.05)
        if not run.ready:raise RuntimeError('real provider startup failed')
        print('three providers ready',flush=True)
        deadline=time.monotonic()+120
        while len(speakers)<3 and time.monotonic()<deadline and not run.stop.is_set():
            for task in tasks:
                if task.done():await task
            await asyncio.sleep(.1)
        if len(speakers)<3:raise RuntimeError('three provider voices were not routed')
        # Inject the accepted speech fixture to the CURRENT owner, exercising native
        # interruption and response. No display STT is part of this path.
        pcm=Path('/Users/jay/sources/spectakles-web/spectackle-product/tests/fixtures/speech.pcm').read_bytes()
        seq=1
        run.input.accept({'type':'input_start','seq':seq,'id':1,'sample':0,'startSample':0,'preRollSamples':512})
        state=run.engine.state;state.user_speaking=True;state.start_t=time.monotonic();state.starts+=1
        run.engine.commit_user_speech(state,run.speaker)
        run.input.onsets[1]=(run.engine.sessions[state.current_bot],state.activity_seq)
        length=len(pcm)//1024*1024
        for offset in range(0,length,1024):
            seq+=1;run.input.accept(INPUT_PACKET.pack(b'SGD6',seq,1,offset//2,512)+pcm[offset:offset+1024]);await asyncio.sleep(.032)
        # Canonical accepted VAD end has sixteen quiet frames of padding.
        for i in range(16):
            seq+=1;run.input.accept(INPUT_PACKET.pack(b'SGD6',seq,1,length//2+i*512,512)+b'\0'*1024);await asyncio.sleep(.032)
        seq+=1;run.input.accept({'type':'input_end','seq':seq,'id':1,'sample':length//2+16*512,'reason':'silence','incomplete':False})
        deadline=time.monotonic()+35
        while time.monotonic()<deadline and not any(e.role=='user' for e in state.transcript):
            for task in tasks:
                if task.done():await task
            await asyncio.sleep(.1)
        if not any(e.role=='user' for e in state.transcript):raise RuntimeError('native human transcription missing')
        print('native input transcript received; delivered samples',run.input.delivered_samples,'output packets',packets,flush=True)
        run.end('synthetic_real_provider_smoke_complete')
    finally:
        run.end('smoke_cleanup',True)
        with __import__('contextlib').suppress(Exception):await asyncio.wait_for(tasks[0],7)
        for task in tasks:task.cancel()
        await asyncio.gather(*tasks,return_exceptions=True)
        run.speaker.close();await run.save();recording.close('smoke_cleanup',False)
        print('evidence',run.path,flush=True)
    assert run.reason=='synthetic_real_provider_smoke_complete',run.reason

if __name__=='__main__':asyncio.run(main())
