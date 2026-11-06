import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line']
    }
  },
  {
    files: ['tests/**/*.js'],
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', 'specs/**']
  }
];
