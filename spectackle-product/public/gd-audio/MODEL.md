# Silero speech detector

- Source: `silero-vad==6.2.3`, `silero_vad/data/silero_vad.onnx`, copied from the
  existing local CLI environment. The reference CLI uses this package's JIT
  model; the browser uses its corresponding ONNX export, without a provider call.
- SHA-256: `1a153a22f4509e292a94e67d6f9b85e8deb25b4988682b7e174c65279d8788e3`.
- License: MIT; retained verbatim in `SILERO_LICENSE.txt`.
- Inference: 16 kHz mono, 512 new samples plus 64 context samples, float32 input,
  recurrent state `[2, 1, 128]`, `sr` int64 scalar, outputs `output` and `stateN`.
- Upstream: https://github.com/snakers4/silero-vad

`ort/` is generated from the exact npm lockfile runtime by the predev/prebuild
script. It is not a CDN dependency or a separately maintained runtime version.
