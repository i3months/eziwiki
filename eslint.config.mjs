import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

/**
 * Flat config, carried over from the .eslintrc this project grew up with.
 * Next's own presets bring the React and TypeScript plugins; Prettier runs
 * as a rule so a formatting drift fails the lint rather than waiting for a
 * separate check to notice.
 */
const config = [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'coverage/',
      'reference/',
      'public/',
      '*.config.js',
      '*.config.ts',
      'packages/*/template/',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierRecommended,
  {
    rules: {
      'no-underscore-dangle': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default config;
