#!/usr/bin/env bash
set -euo pipefail

# --- Preconditions ---
: "${BYPASS_SECRET:?Missing BYPASS_SECRET in env}"
: "${CRON_SECRET:?Missing CRON_SECRET in env}"

echo "== Project check =="
if [ -f ".vercel/project.json" ]; then
  echo "[.vercel/project.json]"
  cat .vercel/project.json
else
  echo "WARN: .vercel/project.json not found (project may not be linked)."
fi

echo
echo "== Picking latest READY deployment (top of vercel ls) =="

# On prend la 1ère URL trouvée dans `vercel ls --status READY` (la plus récente est en haut)
DEPLOY_URL="$(vercel ls --status READY | grep -Eo 'https://[^ ]+' | head -n 1 || true)"

if [ -z "${DEPLOY_URL:-}" ]; then
  echo "ERROR: Could not auto-pick DEPLOY_URL from 'vercel ls --status READY'."
  echo "Run: vercel ls --status READY"
  exit 1
fi

# Sécurité anti-alias: si jamais tu tombes sur git-main, on force à prendre une URL hashée
if echo "$DEPLOY_URL" | grep -q 'git-main'; then
  echo "WARN: Picked a git-main alias. Trying to pick a hashed deployment URL instead..."
  DEPLOY_URL="$(vercel ls --status READY | grep -Eo 'https://acces-direct-aide-staging-[a-z0-9]+-gokhangurbuz92s-projects\.vercel\.app' | head -n 1 || true)"
fi

echo "Using DEPLOY_URL=$DEPLOY_URL"
echo

curl_args=(--silent --show-error --location --connect-timeout 10 --max-time 40)

run() {
  local label="$1"
  local path="$2"
  echo "=============================="
  echo "$label"
  echo "PATH: $path"
  echo "------------------------------"
  vercel curl "$path" \
    --deployment "$DEPLOY_URL" \
    --protection-bypass "$BYPASS_SECRET" \
    -- --include "${curl_args[@]}"
  echo
}

# 1) Debug router (doit renvoyer pathname/path)
run "DEBUG ROUTER" "/api/cron/ingest-structures?debug=1"

# 2) Ingestion réel (doit renvoyer created/updated/skipped/errors)
run "INGEST STRUCTURES" "/api/cron/ingest-structures?secret=$CRON_SECRET"

# 3) Smoke tests API (on tronque juste visuellement si c’est énorme)
run "TAXONOMY" "/api/taxonomy"
run "AIDES (pageSize=1)" "/api/aides?pageSize=1"
run "DEMARCHES (pageSize=1)" "/api/demarches?pageSize=1"
run "STRUCTURES (pageSize=1)" "/api/structures?pageSize=1"

echo "DONE."
