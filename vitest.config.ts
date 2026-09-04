import path from 'path';
import react from '@vitejs/plugin-react';
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    server: { deps: { inline: ['next-intl'] } },
    environment: 'jsdom',
    setupFiles: [], // Add setup files if needed later
    include: ['**/*.test.{ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './__mocks__/server-only.js'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
