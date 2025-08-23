import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      'no-console': 'off', // Allow console for CLI tools
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],
      'curly': ['warn', 'all'],
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': 'off', // Too disruptive for existing code
      'comma-dangle': 'off', // Too disruptive for existing code
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      'no-case-declarations': 'off', // Common pattern in existing code
      'no-undef': 'error', // Critical - undefined variables
      'no-redeclare': 'error', // Critical - variable redeclaration
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off', // TypeScript handles this
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],
      'curly': ['warn', 'all'],
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': 'off',
      'comma-dangle': 'off',
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      'no-undef': 'error',
      'no-redeclare': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'public/equity-ui-v2/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'artifacts/**',
      '*.min.js',
      'public/dist/**',
    ],
  },
];
