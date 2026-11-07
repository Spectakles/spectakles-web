import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const runtime = dirname(require.resolve('onnxruntime-web/wasm'));
const destination = resolve(root, 'public/gd-audio/ort');
await mkdir(destination, { recursive: true });
for (const name of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await copyFile(resolve(runtime, name), resolve(destination, name));
}
console.log('Local GD speech runtime prepared.');
