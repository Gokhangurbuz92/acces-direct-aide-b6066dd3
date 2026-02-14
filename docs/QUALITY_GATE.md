# Quality Gate: Strict Lint + Typecheck (Baseline Mode)

This repo currently runs a **non-strict** lint/typecheck gate to avoid blocking development.

Issue #45 tracks the long-term goal: re-enable strict rules and fix the existing debt incrementally.

## What’s Enforced Today

- `npm run lint`: current ESLint rules (must stay green).
- `npm run typecheck`: current TypeScript check (limited scope; must stay green).

## Strict Baseline Jobs (CI)

CI also runs **baseline** jobs that prevent regressions while allowing existing debt:

- `npm run lint:strict:baseline`
- `npm run typecheck:strict:baseline`

These jobs:

- Run strict rules.
- Compare results to a committed baseline snapshot in `docs/reports/`.
- **Fail only if the strict error count increases** (per rule / per TS error code).

## Local Usage

### See the strict errors (expected to fail today)

```bash
npm run lint:strict
npm run typecheck:strict
```

### Update baselines (only in dedicated PRs)

```bash
npm run lint:strict:baseline:update
npm run typecheck:strict:baseline:update
```

Baseline files:

- `docs/reports/eslint-strict-baseline.json`
- `docs/reports/tsc-strict-baseline.json`

## How to Pay Down the Debt

1. Pick a small slice (folder / rule / TS code).
2. Fix it and re-run strict checks.
3. Update baselines only when the strict totals decrease.
4. Repeat until strict jobs can be turned into hard gates (no baseline).

