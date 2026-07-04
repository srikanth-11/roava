// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const { FlatCompat } = require('@eslint/eslintrc');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

// eslint-plugin-react-native-a11y is eslintrc-style; FlatCompat bridges it.
const compat = new FlatCompat();

module.exports = defineConfig([
  expoConfig,
  ...compat.extends('plugin:react-native-a11y/all'),
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Labels are required; hints are supplementary per RN a11y docs.
      // The /all preset's blanket hint requirement produces noise, not access.
      'react-native-a11y/has-accessibility-hint': 'off',
    },
  },
]);
