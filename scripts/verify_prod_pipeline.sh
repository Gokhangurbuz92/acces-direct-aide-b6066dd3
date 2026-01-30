#!/bin/bash

# Configuration
DOMAIN="https://www.accesdirectaide.fr"
URL="$DOMAIN/api/cron/pipeline"

echo "=== Verification Production Pipeline ==="
echo "Target: $DOMAIN"
echo ""
echo "Veuillez saisir votre CRON_SECRET (input masqué) :"
read -s TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "Erreur: Token vide."
    exit 1
fi

export TOKEN

# Test 1: Alias 'demarches' -> 'aides' (Smoke Mode)
echo "---------------------------------------------------"
echo "TEST 1: Alias 'demarches' (maps to 'aides') [Mode: Smoke]"
echo "---------------------------------------------------"
curl -sS -X POST "$URL?source=demarches&mode=smoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{}' \
  -D /tmp/p.headers \
  -o /tmp/p.body

echo ""
echo "--- Headers (Release Info) ---"
tr -d '\r' < /tmp/p.headers | grep -i 'x-release-sha\|x-deploy-env' || echo "(No release headers found)"

echo "--- Body Response ---"
cat /tmp/p.body
echo ""

# Test 2: Alias 'actualites' -> 'rss' (Limit 10)
echo ""
echo "---------------------------------------------------"
echo "TEST 2: Alias 'actualites' (maps to 'rss') [Limit: 10]"
echo "---------------------------------------------------"
curl -sS -X POST "$URL?source=actualites&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{}' \
  -D /tmp/p2.headers \
  -o /tmp/p2.body

echo ""
echo "--- Body Response ---"
cat /tmp/p2.body
echo ""
