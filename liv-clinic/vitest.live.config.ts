import { defineConfig } from 'vitest/config';
import path from 'path';

// 실물 시험 전용 설정 — test/live/*.live.ts 만 돈다. 실제 OpenAI를 부르고(비용이 든다), 운영 DB·Slack에는 닿지 않는다.
// 평소의 `npm test`(vitest.config.ts)에는 걸리지 않는다.
// 실행 (liv-clinic 폴더에서): NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run --config vitest.live.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/live/**/*.live.ts'],
    testTimeout: 1_800_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './test/stubs/server-only.ts'),
      'next/navigation': path.resolve(__dirname, './test/stubs/next-navigation.ts'),
    },
  },
});
