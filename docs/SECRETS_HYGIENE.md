# Secrets Hygiene Policy (No Values)

This repo must never contain real secret values (tokens, passwords, private keys, full DB URLs with credentials).

## Hard Rules (PR Blockers)

- Do not commit `.env*` files (except `.env.example` / `.env.template`).
- Do not paste secret values in issues, PR descriptions, docs, or chat.
- Do not include DB URLs with embedded passwords in docs. Use passwordless placeholders:
  - ✅ `postgresql://USER@HOST:5432/DBNAME?sslmode=require` (password omitted)
- Treat DSNs and provider endpoints as sensitive configuration: do not paste real ones in docs.

## What To Do If Something Leaks

- Assume compromise and rotate (values can still exist in git history even after deletion).
- Do **not** rewrite git history in routine PRs. Prefer rotation + incident notes.
- Follow: `docs/ROTATE_SECRETS.md` (runbook, no values).

## Guardrails In This Repo

- CI secret scanner (gitleaks): blocks new leaks on PRs and `main`.
- Local scan (redacted, workspace only): `npm run security:scan`.
- Vercel env drift check (names only): `npm run vercel:env:check`.

## PR Checklist (Security)

- [ ] No secret values added to `docs/` or `README*`.
- [ ] No credentials embedded in URLs (DB URLs, DSNs, API endpoints with tokens).
- [ ] `npm run security:scan` is green (or explain why).
