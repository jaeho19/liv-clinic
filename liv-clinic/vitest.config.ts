import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // scripts/__tests__/*.mjs 는 node:test 러너 전용(빌드 스크립트 테스트).
    // `npm run test:rules`(node --test)로 별도 실행하며, vitest 기본 글롭에
    // 걸리면 "No test suite found"로 실패하므로 여기서 제외한다.
    exclude: [...configDefaults.exclude, 'scripts/**'],
    // next-intl(ESM)이 next/navigation을 확장자 없이 import해 Node가 해석하지 못한다 →
    // vite로 인라인 처리해 위 alias(next/navigation 스텁)가 적용되게 한다.
    server: { deps: { inline: ['next-intl'] } },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next.js가 빌드 시점에 주입하는 가상 모듈 — 테스트에서는 no-op으로 대체
      'server-only': path.resolve(__dirname, './test/stubs/server-only.ts'),
      // next-intl/navigation이 로드 시 요구하는 next/navigation — 노드 테스트 환경에서는 해석되지 않으므로 no-op 스텁
      'next/navigation': path.resolve(__dirname, './test/stubs/next-navigation.ts'),
    },
  },
});
