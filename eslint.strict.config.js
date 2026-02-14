import base from './eslint.config.js';

// Stricter-than-default lint config used for incremental debt paydown.
// This is intentionally not wired into `npm run lint` yet.
export default [
  ...base,
  {
    files: [
      '**/*.{js,jsx,mjs,cjs,ts,tsx}',
    ],
    rules: {
      // Re-enable core rules that are currently relaxed in `eslint.config.js`.
      'no-unused-vars': 'error',
      'no-useless-escape': 'error',
    },
  },
];

