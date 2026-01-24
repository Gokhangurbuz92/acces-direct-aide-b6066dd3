import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', '.vercel', 'node_modules', 'test-results'] },

  // 1. Front-end (React) - src only
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',

      // RELAXED RULES FOR BASELINE
      'react/no-unescaped-entities': 'off', // 900+ errors here
      'react/prop-types': 'off',            // 900+ errors here
      'no-unused-vars': 'warn',             // Warn only

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Legacy Codebase Baseline - Warnings only
      'react/no-unknown-property': 'warn',
    },
  },

  // 2. Back-end & Tools (Node.js) - api, scripts, configs
  {
    files: ['api/**/*.js', 'scripts/**/*.js', '*.config.js', 'dev-server.js', 'e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      // Legacy Codebase Baseline - Warnings only
      'no-useless-escape': 'warn',
      'no-control-regex': 'warn',
      'no-prototype-builtins': 'warn',
      'no-redeclare': 'warn',
    },
  },
]
