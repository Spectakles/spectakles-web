import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  // Preserve the existing stylesheet cascade without production rule merging.
  experimental: { cssChunking: 'strict' },
};

export default nextConfig;
