import globals from 'globals';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import baseConfig from '../eslint.config.base.js';

const APP_FILES = [
  'src/**/*.vue',
  'src/**/*.ts',
  'src/**/*.js',
  'src-boot/**/*.ts',
  'tests/**/*.ts',
  '*.ts',
];

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: [
      'dist/',
      'certs/',
      '.quasar/',
      'node_modules/',
      'src-pwa/',
      '.eslintrc.js',
    ],
  },
  ...vuePlugin.configs['flat/recommended'],
  prettierConfig,
  {
    files: ['*.config.mjs', '.postcssrc.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: APP_FILES,
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
        ecmaVersion: 2023,
      },
      globals: {
        ...globals.browser,
        Temporal: 'readonly',
        __statics: 'readonly',
        __QUASAR_SSR__: 'readonly',
        __QUASAR_SSR_SERVER__: 'readonly',
        __QUASAR_SSR_CLIENT__: 'readonly',
        __QUASAR_SSR_PWA__: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      'prettier/prettier': 'error',
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'vue/no-v-html': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
];
