import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import base from '../vite.config';
const output='/private/tmp/spectakles-final/browser-build';
export default mergeConfig(base,defineConfig({
  preview:{proxy:{'/api':{target:'http://127.0.0.1:8001',ws:true}}},
  build:{outDir:output,emptyOutDir:true,rollupOptions:{input:{
    app:fileURLToPath(new URL('../index.html',import.meta.url)),
    discussion:fileURLToPath(new URL('./gd-discussion-browser.html',import.meta.url)),
    playback:fileURLToPath(new URL('./gd-playback-browser.html',import.meta.url)),
  }}},
  plugins:[{name:'isolated-qa-fixture',async closeBundle(){
    const folder=resolve(output,'tests/fixtures');await mkdir(folder,{recursive:true});
    await copyFile(fileURLToPath(new URL('./fixtures/speech.pcm',import.meta.url)),resolve(folder,'speech.pcm'));
  }}],
}));
