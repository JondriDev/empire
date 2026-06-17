import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'
import { defineConfig, globalIgnores } from 'eslint/config'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

export default defineConfig([
  globalIgnores(['dist', 'src/vite-env.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.base,
      ...compat.extends('plugin:react-hooks/recommended'),
    ],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-unused-vars': 'off',
      // Intentional empty `catch {}` is used throughout for best-effort
      // localStorage/clipboard access that can throw in restricted contexts.
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
      parserOptions: {
        jsxRuntime: 'automatic',
      },
    },
  },
])