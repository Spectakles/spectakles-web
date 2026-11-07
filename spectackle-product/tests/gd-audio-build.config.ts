// Optional production-mode audio QA. Run from this checkout:
// npx vite build --config tests/gd-audio-build.config.ts
// npx vite preview --outDir /private/tmp/spectakles-gd-audio-build --host 127.0.0.1 --port 5174 --strictPort
// Open http://127.0.0.1:5174/tests/gd-audio-browser.html and run the checks.
import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import base from '../vite.config';

const output = '/private/tmp/spectakles-gd-audio-build';
export default mergeConfig(base, defineConfig({
  build: {
    outDir: output,
    emptyOutDir: true,
    rollupOptions: {
      input: { app: fileURLToPath(new URL('../index.html', import.meta.url)), audioQA: fileURLToPath(new URL('./gd-audio-browser.html', import.meta.url)) },
    },
  },
  plugins: [{
    name: 'qa-fixtures-only',
    async closeBundle() {
      const folder = resolve(output, 'tests/fixtures');
      await mkdir(folder, { recursive: true });
      for (const file of ['speech.pcm', 'speech-reference.json']) {
        await copyFile(fileURLToPath(new URL(`./fixtures/${file}`, import.meta.url)), resolve(folder, file));
      }
    },
  }],
}));
