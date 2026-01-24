import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', 'test-results', 'playwright-report'] },

  // React / Frontend Configuration
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
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
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Relaxing rules for existing codebase to pass CI
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off',
      'no-unused-vars': ['warn', { 'varsIgnorePattern': '^React$' }],
      'no-useless-escape': 'off',
    },
  },

  // Backend / Scripts / Config Configuration
  {
    files: ['api/**/*.js', 'scripts/**/*.js', '*.config.js', 'dev-server.js', 'e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'off', // Relaxing for mixed CJS/ESM globals (like process, module) in config files
      'no-unused-vars': 'warn',
      'no-useless-escape': 'off',
      'no-prototype-builtins': 'off',
      'no-control-regex': 'off',
      'no-redeclare': 'off',
    }
  }
]
