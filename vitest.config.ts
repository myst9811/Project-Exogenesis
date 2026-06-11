import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Excluded: type-only files, and the Three.js scene wiring, which
      // requires a WebGL context jsdom cannot provide and whose visual
      // output is explicitly out of scope for unit tests (CLAUDE.md §11).
      // The renderer's pure derivation layer (src/renderer/*.ts) is gated.
      // Excluded I/O boundaries: type-only files, the WebGL scene (needs a
      // GL context), and the AI provider adapters (network + SDK). Their
      // pure cores are gated; the boundaries are verified by build/runtime.
      exclude: [
        'src/**/*.test.ts',
        'src/types/**',
        'src/renderer/scene/**',
        'src/ai/providers/**',
      ],
      thresholds: {
        'src/physics/**/*.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/translation/**/*.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/renderer/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/store/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/ai/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
