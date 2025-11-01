import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      all: true,
      include: ['src/core/**/*.ts'],
      reporter: ['text'],
      reportsDirectory: '',
    },
  },
});
