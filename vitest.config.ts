import { defineConfig } from 'vitest/config';
import path from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/**/src/**/*.{test,spec}.ts', 'apps/api/src/**/*.{test,spec}.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['apps/web/src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
          setupFiles: ['./apps/web/src/test/setup.ts'],
        },
      },
    ],
  },
});
