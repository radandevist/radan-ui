import { defineConfig } from 'vitest/config';

// Component tests sit beside the component (`src/components/<name>/*.test.tsx`); DOM ones start with `// @vitest-environment jsdom`.
export default defineConfig({ test: { include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'] } });
