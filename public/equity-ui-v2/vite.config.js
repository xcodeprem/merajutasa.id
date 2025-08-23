import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Pre-compress assets for fast static serving
    viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 512, deleteOriginFile: false }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 512,
      deleteOriginFile: false,
    }),
  ],
  server: {
    proxy: {
      '/kpi': 'http://localhost:4620',
      '/under-served': 'http://localhost:4620',
      '/equity': 'http://localhost:4620',
      '/revocations': 'http://localhost:4620',
      '/feedback': 'http://localhost:4620',
      '/risk': 'http://localhost:4620',
      '/health': 'http://localhost:4620',
      // WebSocket proxy to API Gateway
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Emit to repo-level public/dist for standardized distribution
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
    include: ['src/**/*.{test,spec}.jsx'],
    css: true,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: '../../artifacts/equity-ui-v2-coverage',
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 50,
        statements: 60,
      },
    },
  },
});
