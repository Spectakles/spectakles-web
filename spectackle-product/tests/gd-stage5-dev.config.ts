import { defineConfig, mergeConfig } from 'vite';
import base from '../vite.config';
export default mergeConfig(base, defineConfig({ server: { port: 5174, proxy: {
  '/api/health': { target: 'http://127.0.0.1:8001' },
  '/api/recordings': { target: 'http://127.0.0.1:8001', ws: true },
  '/api/playback': { target: 'http://127.0.0.1:8001', ws: true },
} } }));
