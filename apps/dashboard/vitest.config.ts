// apps/dashboard/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.html'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      },
      include: [
        'src/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}'
      ]
    },
    benchmark: {
      include: ['**/*.{bench,benchmark}.ts'],
      exclude: ['node_modules', 'dist']
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/components/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ]
  },
  resolve: {
    alias: {
      'odds-core': resolve(__dirname, '../../packages/odds-core/src'),
      'odds-websocket': resolve(__dirname, '../../packages/odds-websocket/src'),
      'odds-arbitrage': resolve(__dirname, '../../packages/odds-arbitrage/src'),
      'odds-ml': resolve(__dirname, '../../packages/odds-ml/src'),
      'odds-temporal': resolve(__dirname, '../../packages/odds-temporal/src'),
      'odds-validation': resolve(__dirname, '../../packages/odds-validation/src')
    }
  }
});