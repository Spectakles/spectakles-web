# Stage 3: local browser microphone test

The room at `/gd/dev` opens the microphone only after **Start microphone test**.
There is no provider call, socket, recording file, transcript, camera, or GD timer
in this stage. The Stage 1 `/api/health` service remains unchanged.

## Audio path and boundaries

- `MicrophoneTest` owns the MediaStream, AudioContext, graph, worker, deadlines,
  and lifecycle listeners. The stream requests mono with echo cancellation,
  noise suppression and automatic gain; actual capture constraints are browser
  decisions. No microphone monitoring is connected to speakers.
- `capture.worklet.ts` averages channels, converts the actual AudioContext rate
  to 16 kHz with a stateful windowed-sinc low-pass resampler, and emits 512-sample
  signed PCM16 frames over a transferred MessagePort directly to the VAD worker.
  Supported context rates are 16–192 kHz. Filter history and fractional phase
  survive render blocks; mute/resume resets both and discards partial frames.
- `vad.worker.ts` runs the pinned ONNX Runtime Web WASM provider on one thread.
  It uses the full Silero model from the installed `silero-vad==6.2.3` package,
  with the same 64-sample context and `[2, 1, 128]` recurrent state as its Python
  wrapper. This avoids depending on a CDN or cross-origin-isolation headers.
- `ReferenceVad` preserves the engine's threshold 0.9, negative threshold 0.75,
  immediate commit and sixteen low-probability frames for the 500 ms setting
  (rounded to 512 ms). It preserves the original middle-band behavior too.
- `Utterances` retains at most ten pre-roll frames (320 ms including the triggering
  frame), assigns ids and exposes start/end sample offsets. Silence padding is
  included. Muting or stopping active speech emits a partial end. These are
  diagnostic boundaries only; Stage 4 will consume audio incrementally and save
  files. Do not treat UI events or browser STT as an audio recording authority.

## Bounds and resource ownership

At most 64 frames may be unacknowledged by the worklet (2.048 seconds). The worker
also enforces a 64-frame queue and a two-second age limit. Overflow ends the test
with an error, rather than silently dropping/replaying speech. UI stats arrive
at most about ten times per second, plus boundary updates; only ten boundary
events are kept in React. Entire utterances are not accumulated in memory.

Mute disables the capture track, pauses the worklet, closes active speech, and
resets the recurrent/VAD/pre-roll state. Unmute waits for the new worker epoch
before enabling the track and worklet; obsolete frame results are ignored.

Stop is idempotent. It stops tracks/disconnects the graph immediately, closes
the context and allows up to 500 ms for a final worker boundary before terminating
the worker. Cancelling a permission prompt cannot dismiss browser UI, but a
stream granted afterward is immediately stopped. Setup has a 30-second deadline;
an active test with no processed frames for three seconds fails visibly.

Leaving the route, page hide, hidden-tab visibility, audio suspension, track end,
worker/message/processor failure all close the test. A hidden tab deliberately
ends this local test; a new Start is required on return. Same-session browser
recovery remains future work.

## Assets and checks

`onnxruntime-web` is pinned in package.json/lock. `predev` and `prebuild` run
`scripts/prepare-gd-audio.mjs`, copying its matching WASM/module pair into the
ignored `public/gd-audio/ort/` directory. Commit the model, provenance and Silero
license in `public/gd-audio/`; do not commit a separate runtime copy. Both dev
and the built site serve these assets from the same origin.

`npm run test:gd-audio` needs Node 22.18+ (Node 26 is verified) for native TypeScript
stripping. It checks sample rates, alias rejection, channel conversion, detector
boundaries, bounded capture, mute generations and lifecycle failures without
real hardware. `npm run typecheck` and `npm run build` verify application bundles.

With Vite running, `/tests/gd-audio-browser.html` is a development-only check
page, absent from the normal production build. It compares actual worker
probabilities against the Python JIT fixture, then exercises the actual worklet
with synthetic Web Audio speech, mute/unmute, repeated stop, fresh start and
missing assets. It requests no microphone permission and plays no sound. Its
fixture was generated locally with macOS Samantha; it contains no user audio.
For a production-mode regression build, see `tests/gd-audio-build.config.ts`.

Manual permission, real-device, language, natural speech and release checks
remain Jay's acceptance gate in `BROWSER_PRODUCT.md` in the engine checkout.

References: [Silero wrapper](https://github.com/snakers4/silero-vad/blob/master/src/silero_vad/utils_vad.py),
[ONNX web assets](https://onnxruntime.ai/docs/tutorials/web/deploy.html).
