import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'coverage/', 'dist/', 'eslint.config.js'],
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Physics error messages and diagnostics interpolate numeric values
      // constantly; numbers stringify unambiguously.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-console': 'error',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Math.random() is forbidden: the simulation must be deterministic. Use an explicit, documented seed.',
        },
      ],
    },
  },

  // ── Architectural module boundaries (CLAUDE.md §4, ARCHITECTURE.md §3.2) ──
  // The physics → visuals → AI hierarchy is absolute: no layer may import the
  // layer above it, and only `ui/` may import from `ui/`. Patterns match the
  // import specifier text, so boundaries hold for relative imports; the
  // `!**/types/...` exceptions keep `src/types/*` (shared type definitions)
  // importable everywhere.
  {
    files: ['src/physics/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/renderer',
                '**/renderer/**',
                '**/ai',
                '**/ai/**',
                '!**/types/ai',
                '**/ui',
                '**/ui/**',
                '**/store',
                '**/store/**',
                '**/translation',
                '**/translation/**',
              ],
              message:
                'physics/ is the top of the hierarchy: it may import nothing from downstream modules.',
            },
            {
              group: [
                'three',
                'three/**',
                '@react-three/**',
                'react',
                'react/**',
                'react-dom',
                'react-dom/**',
                '@tensorflow/**',
                'onnxruntime*',
              ],
              message:
                'physics/ must stay free of graphics, UI, and ML runtimes (ARCHITECTURE.md §3.2 guardrail).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/physics',
                '**/physics/**',
                '!**/physics/**/*.types',
                '!**/types/physics',
                '**/ai',
                '**/ai/**',
                '!**/types/ai',
                '**/ui',
                '**/ui/**',
              ],
              message:
                'renderer/ is a read-only consumer of PlanetaryState: it may import physics type definitions only, and nothing from ai/ or ui/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ai/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/physics',
                '**/physics/**',
                '!**/physics/**/*.types',
                '!**/types/physics',
                '**/renderer',
                '**/renderer/**',
                '**/ui',
                '**/ui/**',
              ],
              message:
                'ai/ is a read-only explainer of PlanetaryState: it may import physics type definitions only, and nothing from renderer/ or ui/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/translation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/physics',
                '**/physics/**',
                '!**/physics/**/*.types',
                '!**/types/physics',
                '**/renderer',
                '**/renderer/**',
                '**/ai',
                '**/ai/**',
                '!**/types/ai',
                '**/ui',
                '**/ui/**',
                '**/store',
                '**/store/**',
              ],
              message:
                'translation/ contains pure functions over physics values: it may import physics type definitions only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/store/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/renderer',
                '**/renderer/**',
                '**/ai',
                '**/ai/**',
                '!**/types/ai',
                // Parent-relative so these match the sibling React UI layer
                // (src/ui) without catching store's own `store/ui.ts`
                // module, whose self-import is `./ui` (CLAUDE.md §3 names it).
                '../ui',
                '../ui/**',
              ],
              message:
                'store/ mediates between UI inputs and the physics engine: it may invoke physics, but never renderer/, ai/, or ui/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.ts', 'src/ui/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/physics',
                '**/physics/**',
                '!**/physics/**/*.types',
                '!**/types/physics',
                '**/ai',
                '**/ai/**',
                '!**/types/ai',
              ],
              message:
                'ui/ performs no physics and talks to no AI directly: submit inputs and read results via store actions only.',
            },
          ],
        },
      ],
    },
  },
);
