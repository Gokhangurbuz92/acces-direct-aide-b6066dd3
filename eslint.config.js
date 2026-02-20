import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // ✅ Ignore build + artifacts (évite de lint des fichiers générés)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'release/**',
      '.vercel/**',
      'storybook-static/**',
      '**/*.min.js',
    ],
  },

  // -------------------------
  // ✅ Front (Browser): src/*
  // -------------------------
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
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

      // ✅ Très souvent inutile (et source d’erreurs) sur projets modernes
      'react/prop-types': 'off',
      'no-unused-vars': 'off', // Too many false positives in existing codebase
      'react/no-unescaped-entities': 'off', // Too many legacy issues
      'no-useless-escape': 'off', // Legacy regex issues
      'react/no-unknown-property': 'off', // Radix UI / CMDK attributes

      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // --------------------------------------
  // ✅ Node (scripts/api/config): process, Buffer, require, etc.
  // --------------------------------------
  {
    files: [
      'scripts/**/*.{js,jsx}',
      'api/**/*.{js,jsx}',
      'tests/**/*.{js,jsx}',
      'playwright.config.{js,cjs,mjs}',
      'vite.config.{js,cjs,mjs}',
      'eslint.config.{js,cjs,mjs}',
      '**/*.config.{js,cjs,mjs}',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        // Si tu as des tests type Jest/Vitest (describe/it/expect)
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off', // Too many false positives in scripts
      'no-useless-escape': 'off', // Regex patterns in scripts
      'no-redeclare': 'off', // Overlap with globals
      'no-prototype-builtins': 'off',
    },
  },

  // --------------------------------------
  // ✅ UI Components (Shadcn/Radix): constants exports
  // --------------------------------------
  {
    files: ['src/components/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // --------------------------------------
  // ✅ Context files: allow hooks + providers in same file
  // --------------------------------------
  {
    files: ['src/contexts/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]
