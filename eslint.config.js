import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'extension/dist', 'site/dist', 'site/.astro', '**/node_modules/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: [
      'api/**/*.{js,mjs}',
      'scripts/**/*.{js,mjs}',
      'mcp/**/*.{js,mjs}',
      'site/api/**/*.{js,mjs}',
      'desktop/**/*.{js,cjs,mjs}',
      'packages/**/*.{js,cjs,mjs}',
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Figma plugin main thread: a classic script in Figma's sandbox, written in
    // conservative syntax (so `catch (err)` keeps its binding).
    files: ['figma-plugin/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        figma: 'readonly',
        __html__: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  {
    files: ['extension/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        acquireVsCodeApi: 'readonly',
      },
    },
  },
])
