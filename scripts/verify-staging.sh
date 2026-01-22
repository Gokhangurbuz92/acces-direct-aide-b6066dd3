#!/bin/bash

# Pre-Prod Verification Script
# Usage: ./scripts/verify-staging.sh <STAGING_URL>
# Example: ./scripts/verify-staging.sh https://acces-direct-aide-staging.vercel.app

URL=$1

if [ -z "$URL" ]; then
  echo "Usage: $0 <STAGING_URL>"
  echo "Example: $0 https://my-app.vercel.app"
  exit 1
fi

echo "--- 1. Checking /api/health ---"
echo "GET $URL/api/health"
HEALTH=$(curl -s "$URL/api/health")
echo "Response: $HEALTH"

if [[ "$HEALTH" == *"\"ok\":true"* ]]; then
  echo "✅ Health: OK"
else
  echo "❌ Health: FAIL"
fi

echo ""
echo "--- 2. Checking /login/pro (Guard) ---"
echo "GET $URL/login/pro"
# We expect 404 or redirect to Home (200 but content is home)
# If 404, it's perfect. If redirect, check title.
LOGIN_HTTP=$(curl -o /dev/null -s -w "%{http_code}" "$URL/login/pro")
echo "HTTP Code: $LOGIN_HTTP"

if [ "$LOGIN_HTTP" == "404" ] || [ "$LOGIN_HTTP" == "403" ]; then
  echo "✅ /login/pro is HIDDEN/PROTECTED (Status $LOGIN_HTTP)"
else
  # If SPA handles routing, it might return 200 with Home page.
  # Harder to verify with simple curl without content inspection, 
  # but 404/403 is the strict requirement compliance.
  echo "⚠️ Status $LOGIN_HTTP. Please verify manually that this is NOT the login page."
fi

echo ""
echo "--- Verification Complete ---"
