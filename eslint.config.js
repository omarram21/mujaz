// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: [
      'dist/*',
      'design/*',
      'supabase/functions/*',
      'src/lib/database.types.ts',
      '.expo/*',
      'expo-env.d.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          // Hard-coded UI strings must go through i18n. JSX text with letters is a mistake.
          selector: 'JSXText[value=/[A-Za-z\\u0600-\\u06FF]/]',
          message: 'Hard-coded UI text: use t() from react-i18next.',
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]);
