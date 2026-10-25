// @ts-check
/**
 * Root ESLint flat config.
 *
 * Besides the usual recommended rules, this file enforces the architecture
 * boundaries from docs/plan.md section 2.1 with `no-restricted-imports`.
 * Some globs target folders that later phases create; that is intentional.
 *
 * Note: in flat config a later block that sets the same rule REPLACES the
 * earlier value for matching files (rules are not merged). That is why the
 * boundary blocks below compose their pattern lists explicitly.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

/* ---------- boundary pattern building blocks ---------- */

/** core/ and *.service.ts stay framework-free: no Express, Prisma or adapters. */
const frameworkFreePatterns = [
  {
    group: ['express', 'express/*', '@prisma/*', '**/generated/**', '**/infra/**', '**/infra'],
    message:
      'core/ and services must stay framework-free: depend on ports, not on Express, Prisma or infra adapters.',
  },
];

/**
 * A module may reach into another module only through its port or entity
 * files (`*.repository`, `*.entity`, `*.ports`), never its controller,
 * routes, mapper or Prisma adapter (`prisma-*.repository`).
 * Matches imports shaped like `../<otherModule>/<file>`.
 */
const crossModulePatterns = [
  {
    regex: String.raw`^\.\./(?!\.\.)[^/]+/(?!(?!prisma-)[\w.-]+\.(?:repository|entity|ports)$).+$`,
    message:
      'Import another module only through its port or entity files (*.repository, *.entity, *.ports), never its controller, routes or Prisma adapter.',
  },
];

const restrict = (patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/src/generated/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/blob-report/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  /* ---------- web (browser + React) ---------- */
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  /* ---------- architecture boundaries (plan section 2.1) ---------- */

  // API: modules talk to each other only through ports/entities.
  {
    files: ['apps/api/src/modules/**/*.ts'],
    rules: restrict(crossModulePatterns),
  },
  // API: services are also framework-free (later block wins, so combine both lists).
  {
    files: ['apps/api/src/modules/**/*.service.ts'],
    rules: restrict([...frameworkFreePatterns, ...crossModulePatterns]),
  },
  // API: core/ is a leaf kernel.
  {
    files: ['apps/api/src/core/**/*.ts'],
    rules: restrict(frameworkFreePatterns),
  },

  // Shared contracts: production code may import only zod (and its own files).
  {
    files: ['packages/shared/src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: restrict([
      {
        regex: String.raw`^(?!zod(?:/.*)?$)(?!\.{1,2}/).+$`,
        message: '@kata/shared is a leaf contract package: it may import only zod.',
      },
    ]),
  },

  // Web: ui primitives know nothing about features, the API layer or server state.
  {
    files: ['apps/web/src/components/ui/**/*.{ts,tsx}'],
    rules: restrict([
      {
        group: [
          '@/features',
          '@/features/*',
          '**/features/**',
          '@/lib/api',
          '@/lib/api/*',
          '**/lib/api/**',
          '@tanstack/*',
        ],
        message:
          'ui primitives are the re-skin surface: they may not import features, the API layer or TanStack.',
      },
    ]),
  },
  // Web: features consume ui only through the barrel.
  {
    files: ['apps/web/src/features/**/*.{ts,tsx}'],
    rules: restrict([
      {
        group: ['@/components/ui/*', '**/components/ui/*'],
        message:
          "Import ui primitives through the barrel: import { Button } from '@/components/ui'.",
      },
    ]),
  },

  // Must stay last: turns off stylistic rules that Prettier owns.
  prettier,
);
