import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
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
      // Strengthen a11y checks commonly missed
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/tabindex-no-positive': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
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
