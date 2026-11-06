# GD browser product — Stage 6

Stages 1–5 are accepted. Current manual instructions are **Stage 6** in
`/Users/jay/sources/the-last-knight/v2/BROWSER_PRODUCT.md`. The room connects
one real Arjun Live participant; the full three-bot engine/timing is later.

Restart the backend with updated dependencies and the existing CLI credentials:

```sh
cd /Users/jay/sources/the-last-knight/v2
browser_backend/.venv/bin/python -m pip install -r browser_backend/requirements.txt
GOOGLE_APPLICATION_CREDENTIALS=/Users/jay/sources/spectakles/trial/shared/gen-lang-client-0235469955-ce7aaf51a392.json \
  browser_backend/.venv/bin/python -m uvicorn browser_backend.main:app \
  --host 127.0.0.1 --port 8000 --ws websockets-sansio --ws-max-size 8192 --ws-max-queue 64
```

Restart `npm run dev` on 5173. In `/gd/dev`, start the microphone, pause and
click **Start Live test**. Once Arjun is listening, speak about AI: boon or bane.
He replies natively; VAD cuts output when you speak again. No per-turn button.
The explicit Live Start makes a real provider connection and incurs normal API
cost. Recording alone does not call Gemini. Use headphones.

Stop Live leaves the microphone recorder running; Stop microphone ends both.
Each new Live Start is a fresh conversation. WAV/manifest files and the new
`live-<session id>.json` sidecar stay in the recording folder. The session record
links generated text, native input and confirmed playback/cuts without exposing
credentials. Optional screen captions, routing/panel and GD clocks remain later.

Bot introductions must finish by discussion second 30; human opening has no
separate cap. This replaces the old 60–90-second bot target and is scheduled
for Stages 8/9, including playback and intro/outro watchdog coordination.

`npm run test:gd-audio`, typecheck and build include Stage 6 checks. The optional
`tests/gd-stage6-dev.config.ts`/`gd-live-browser.html` workflow and production QA
are documented in `src/gd-audio/README.md`; it uses isolated 8001/5174. A real
provider backend makes calls even from that synthetic QA page.

**Stage 6 awaits Jay's manual acceptance. Do not start Stage 7.**

The following older Stage 4/5 notes are retained for their regression workflows.

Stages 1–4 were manually accepted. Stage 5 adds streamed PCM playback, direct
VAD cuts, stale-turn rejection and device-output acknowledgements. Existing
per-utterance WAV recording and saved-file review remain available.
The app remains React/TypeScript/Vite. No Next.js migration or deployment.

```sh
cd /Users/jay/sources/spectakles-web/spectackle-product
npm run dev
```

The pinned `onnxruntime-web` dependency is installed. On a fresh checkout, use
`npm ci`. `predev`/`prebuild` copy matching local WASM assets automatically;
the Silero model, source/version/hash and license are in `public/gd-audio/`.
This stage does not need Google credentials or a CDN.

Restart Vite once for the new WebSocket proxy configuration. Python is now
required for microphone tests and saving, including direct room navigation.
Restart an older backend using the following command:

```sh
cd /Users/jay/sources/the-last-knight/v2
browser_backend/.venv/bin/python -m pip install -r browser_backend/requirements.txt
browser_backend/.venv/bin/python -m uvicorn browser_backend.main:app \
  --host 127.0.0.1 --port 8000 --ws websockets-sansio \
  --ws-max-size 8192 --ws-max-queue 64
```

Open http://127.0.0.1:5173/gd and **Start GD**, or directly open
http://127.0.0.1:5173/gd/dev in desktop Chrome. Opening the room leaves the
microphone off. Scroll below the table to **Try your microphone** and expand
**Audio test details**. **Start microphone test** requests access once. Capture
stays active through speech and pauses; VAD detects each utterance automatically.
Choose **Microphone** before starting; **System default** follows the browser/OS
default. Device names may appear only after access is allowed; start once, then
stop to choose a named device. **Refresh devices** updates the list without
opening a stream. Stop the test before changing devices; the selection is kept
for the next start in this room.

**Stop microphone test** ends the whole test and releases the device. Leaving,
refresh, a hidden tab or audio/device failure ends the test; start a new one.

Each clear pause finalizes a WAV. **Your test recordings** provides audio players,
WAV downloads and an ordered manifest. Stop releases the microphone immediately,
drains emitted full frames and waits for disk acknowledgement. Wait for **Test
saved** before starting again. Stopping during speech saves a Partial clip.

Default storage is the engine checkout's `browser_backend/recordings/<test id>/`,
ignored by Git. Each test has `manifest.json` and ordered `utterance-0001.wav`
etc. WAVs are 16 kHz mono PCM16 with canonical pre-roll/end silence; short
accepted speech has no duration filter. Files remain until manually removed.
The UI shows five recent tests/twenty clips each; all remain in the folder.

Only received PCM is recoverable on disconnect/termination; sub-32 ms unfinished
frames or unsent tails can be lost. Python finalizes partial files and startup
repairs orphan `.wav.part` files. New Start never resumes an old test. Backend
loss now stops capture visibly and releases the microphone. No camera,
captions, provider calls, GD clocks, evaluation, Next.js migration or deployment.

Validation:

```sh
npm run test:gd-audio
npm run typecheck
npm run build
```

The Node audio checks use Node 22.18+ (Node 26 verified). The development-only
page `/tests/gd-audio-browser.html` also checks actual WASM/worker/worklet code
with a synthetic speech fixture; it requests no microphone access and plays no
sound. `/tests/gd-recording-browser.html` additionally checks actual local WAV
storage with synthetic audio; use a temporary backend `GD_RECORDINGS_DIR` for
QA. Both are absent from the normal application build. Resource contracts,
provenance and build-mode QA are documented in `src/gd-audio/README.md`.

After starting the microphone, scroll to **Try automatic interruption**. Click
**Start playback test**, then **Play test voice**. Speak naturally to cut it.
Expand details for received/rendered/played offsets, floor and stale counts.
The ten-second synthetic voice deliberately streams ahead and sends old packets
after a cut; they must stay silent. Fresh test turns have new ids. Stopping the
microphone also stops output; stopping output leaves capture running. No real
Live participant is connected yet. Use headphones for interruption trials.

The full real-device acceptance checklist and later stages are in
`/Users/jay/sources/the-last-knight/v2/BROWSER_PRODUCT.md`.
**Stage 5 was accepted on 2026-10-19. Stage 6 is awaiting manual acceptance.**
