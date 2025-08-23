import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, node: true, jest: true },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['src/**/*.{test,spec}.jsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        node: true,
        jest: true,
        vi: true,
        describe: true,
        it: true,
        expect: true,
      },
    },
    rules: {},
  },
  {
    files: ['src/stores/ThemeContext.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
