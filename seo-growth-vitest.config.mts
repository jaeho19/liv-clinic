import { defineConfig } from './liv-clinic/node_modules/vitest/dist/config.js';
import { fileURLToPath } from 'node:url';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['seo-growth-regression.test.ts'],
    server: { deps: { inline: ['next-intl'] } },
  },
  resolve: {
    alias: {
      '@': local('./liv-clinic/src'),
      vitest: local('./liv-clinic/node_modules/vitest/dist/index.js'),
      react: local('./liv-clinic/node_modules/react'),
      'next/navigation': local('./liv-clinic/test/stubs/next-navigation.ts'),
      'server-only': local('./liv-clinic/test/stubs/server-only.ts'),
    },
  },
});
