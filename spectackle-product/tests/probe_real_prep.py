"""Optional real-time two-minute prep check; controlled providers, no devices."""
import asyncio
from pathlib import Path
import tempfile
import time
from browser_backend.recordings import RecordingStore
from browser_backend.discussion import DiscussionRun
from tests.discussion_fakes import PanelFactory
async def main():
 with tempfile.TemporaryDirectory() as tmp:
  store=RecordingStore(Path(tmp));recording=store.create('Synthetic');factory=PanelFactory()
  async def send(value):pass
  run=DiscussionRun(store,recording.directory.name,send,clients_factory=factory,prep_seconds=120)
  started=time.monotonic();task=asyncio.create_task(run.lifecycle())
  while not run.ready and not task.done():
   elapsed=time.monotonic()-started
   if elapsed<120: assert not factory.instances,'Provider opened during prep'
   if elapsed>125: raise AssertionError('Prep transition did not complete')
   await asyncio.sleep(.1)
  elapsed=time.monotonic()-started
  assert run.ready and elapsed>=120
  assert not run.input.sequence and not recording.info()['utterances']
  run.end();await asyncio.wait_for(task,3)
  assert factory.closed
  print('PASS real-time prep:',round(elapsed,2),'s; zero provider calls before deadline; no prep clips; cleanup complete',flush=True)
if __name__=='__main__':asyncio.run(main())
