import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next.js가 빌드 시점에 주입하는 가상 모듈 — 테스트에서는 no-op으로 대체
      'server-only': path.resolve(__dirname, './test/stubs/server-only.ts'),
    },
  },
});
