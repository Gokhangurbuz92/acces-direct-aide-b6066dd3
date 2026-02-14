# Vercel Dev (Vite) Notes

This repo is a Vite SPA with an `/api/*` dev middleware (see `vite.config.js`).

## Recommended Local Dev (Stable)

Run Vite directly (includes the API middleware):

```bash
npm run dev -- --port 3000 --host 127.0.0.1
```

## Using `vercel dev` (Optional)

If you want to run via Vercel CLI:

1. Link once:
   - `vercel link`
2. Start:
   - `vercel dev --listen 3000`

## Issue #138: `/@vite/client` “HTML” Confusion

When validating Vite client assets, **use a GET request**:

```bash
curl -s -o /dev/null -D - http://127.0.0.1:3000/@vite/client | rg -i '^content-type:'
```

Note: `curl -I` sends a HEAD request. Vite may respond differently for HEAD on virtual modules (so it can look like HTML even though GET is correct).

## E2E

For reliable E2E, prefer the built-in Playwright webServer (it starts Vite automatically):

```bash
npm run test:e2e
```

If you start the server yourself, export a base URL:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

