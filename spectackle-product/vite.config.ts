import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/health': { target: 'http://127.0.0.1:8000' },
      '/api/recordings': { target: 'http://127.0.0.1:8000', ws: true },
      '/api/playback': { target: 'http://127.0.0.1:8000', ws: true },
      '/api/discussions': { target: 'http://127.0.0.1:8000', ws: true },
      '/api/live': { target: 'http://127.0.0.1:8000', ws: true },
      // Auth, workspace, institution, report and media endpoints all share
      // this prefix. Keep the catch-all after the more specific WS routes.
      '/api': { target: 'http://127.0.0.1:8000', ws: true },
    },
  },
  optimizeDeps: {
    include: ['lucide-react', 'gsap', 'react', 'react-dom', 'react-router-dom', 'onnxruntime-web/wasm'],
  },
});
