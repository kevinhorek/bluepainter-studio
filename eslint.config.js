import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'site/dist', 'site/.astro', '**/node_modules/**']),
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
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: { ...globals.node },
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
