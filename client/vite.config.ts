// @ts-nocheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild: mode === 'production'
    ? { pure: ['console.log', 'console.info', 'console.debug'] }
    : {},
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // React and i18n stay cached between releases; chart and PDF libraries travel with the lazy pages that use them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/i18next/.test(id)) return 'i18n';
          if (/react-dom|react-router|\/react\/|scheduler/.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}));

