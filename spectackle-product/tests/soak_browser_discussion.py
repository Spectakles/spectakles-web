"""Optional 12-minute backend soak, controlled providers and paced device ACKs."""
import asyncio
from dataclasses import replace
import json
from pathlib import Path
import time

from browser_backend.discussion import DiscussionRun
from browser_backend.live import INPUT_PACKET
from browser_backend.playback import PACKET
from browser_backend.recordings import RecordingStore
from gd_engine.config import SessionConfig
from .discussion_fakes import PanelFactory


async def main():
    store=RecordingStore(Path('/private/tmp/spectakles-final/soak-recordings'))
    recording=store.create('Synthetic twelve-minute soak')
    factory=PanelFactory(reply_seconds=2)
    output=asyncio.Queue(maxsize=96);run=None;turns=0;last_turn=time.monotonic();begun=time.monotonic()
    seq=0;utterance=0
    async def send(value):
        nonlocal turns,last_turn
        if isinstance(value,bytes):
            await output.put(value)
        elif value['type']=='begin':
            turns+=1;last_turn=time.monotonic()
        elif value['type']=='server_cut':
            run.speaker.acknowledge({'type':'cut','connection':run.id,'turn':value['turn'],'played':run.speaker.ledger.played})
    run=DiscussionRun(store,recording.directory.name,send,clients_factory=factory,prep_seconds=0,
                      config=replace(SessionConfig(),discussion_minutes=12))
    async def device():
        while not run.stop.is_set():
            packet=await output.get()
            _,turn,_,offset,count=PACKET.unpack_from(packet)
            if turn!=run.speaker.ledger.turn or run.speaker.ledger.revoked:continue
            await asyncio.sleep(count/24000)
            if turn==run.speaker.ledger.turn and not run.speaker.ledger.revoked:
                run.speaker.acknowledge({'type':'progress','connection':run.id,'turn':turn,'played':offset+count})
    async def contribution():
        nonlocal seq,utterance
        utterance+=1;start=int((time.monotonic()-begun)*16000)//512*512
        seq+=1
        boundary={'type':'input_start','seq':seq,'id':utterance,'sample':start,'startSample':start,'preRollSamples':512}
        run.input.accept(boundary)
        recording.accept({**boundary,'type':'start'})
        state=run.engine.state;state.user_speaking=True;state.start_t=time.monotonic();state.starts+=1
        run.engine.commit_user_speech(state,run.speaker)
        run.input.onsets[utterance]=(run.engine.sessions[state.current_bot],state.activity_seq)
        for i in range(20):
            seq+=1;pcm=b'\1\0'*512
            run.input.accept(INPUT_PACKET.pack(b'SGD6',seq,utterance,start+i*512,512)+pcm)
            recording.accept(INPUT_PACKET.pack(b'SGD4',seq,utterance,start+i*512,512)+pcm)
            await asyncio.sleep(.032)
        seq+=1;end={'type':'input_end','seq':seq,'id':utterance,'sample':start+20*512,'reason':'silence','incomplete':False,'voicedMs':128}
        run.input.accept(end);recording.accept({**end,'type':'end'})
    tasks=[asyncio.create_task(coro) for coro in (run.lifecycle(),run.monitor(),run.speaker.stream(),device())]
    try:
        while not run.ready:await asyncio.sleep(.01)
        await contribution();next_input=time.monotonic()+40;next_report=time.monotonic()+60
        while not run.stop.is_set():
            for task in tasks:
                if task.done():await task
            if time.monotonic()-last_turn>45:raise AssertionError('Panel stalled for more than yielded-floor budget')
            if time.monotonic()>=next_input and run.engine.remaining_seconds(run.engine.state)>130:
                await contribution();next_input=time.monotonic()+45
            if time.monotonic()>=next_report:
                print('soak',round(time.monotonic()-begun),'s; turns',turns,'phase',run.snapshot()['phase'],flush=True);next_report+=60
            await asyncio.sleep(.05)
        await asyncio.wait_for(tasks[0],7)
        assert not run.error,run.reason
        assert turns>200,turns
        assert run.input.sequence==run.input.delivered_sequence and run.input.lost_commands==0
        assert 'time limit' in run.reason
        assert factory.closed and all(provider.closed for provider in factory.instances)
        print('PASS full-length soak:',round(time.monotonic()-begun,2),'s;',turns,'turns;',utterance,'utterances;',run.reason,flush=True)
    finally:
        run.end('soak_cleanup',True)
        for task in tasks:task.cancel()
        await asyncio.gather(*tasks,return_exceptions=True)
        run.speaker.close();await run.save();recording.close('stopped',run.error)
        print('evidence',run.path,flush=True)

if __name__=='__main__':asyncio.run(main())
