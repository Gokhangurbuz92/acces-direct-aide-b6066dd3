#!/bin/bash
set -euo pipefail

# Use env vars from .env.production.local if not already set
# source .env.production.local

BYPASS_SECRET="soSff74hIIef5jn501hwuOKuYNDHfmj3"
DEPLOY_URL="https://acces-direct-aide-staging-hksoi6v2u-gokhangurbuz92s-projects.vercel.app"

echo "=== SMOKE TESTS ON $DEPLOY_URL ==="

test_endpoint() {
  local path=$1
  echo "Testing $path..."
  curl -s -L "$DEPLOY_URL$path" \
    -H "x-vercel-protection-bypass: $BYPASS_SECRET" \
    -H "x-vercel-set-bypass-cookie: true" \
    --show-error | head -c 200
  echo -e "\n-----------------------------------"
}

test_endpoint "/api/taxonomy"
test_endpoint "/api/aides?pageSize=1"
test_endpoint "/api/demarches?pageSize=1"
test_endpoint "/api/structures?pageSize=1"
echo "=== TESTS COMPLETED ==="
