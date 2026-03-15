#!/bin/bash

# Configuration
PROD_DOMAIN="www.accesdirectaide.fr"
APEX_DOMAIN="accesdirectaide.fr"
STAGING_DOMAIN="staging.accesdirectaide.fr" # Update if different

echo "=========================================="
echo "DNS & Redirect Verification"
echo "=========================================="

# 1. Check Canonical Domain (Prod)
echo ""
echo "1. Checking Canonical Domain (https://$PROD_DOMAIN)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$PROD_DOMAIN/)
if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ OK: Returns 200 OK."
else
  echo "❌ FAIL: Returns $HTTP_CODE (Expected 200)."
fi

# 2. Check Apex Redirect
echo ""
echo "2. Checking Apex Redirect (https://$APEX_DOMAIN)..."
LOCATION=$(curl -s -I https://$APEX_DOMAIN/ | grep -i "location:" | awk '{print $2}' | tr -d '\r')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$APEX_DOMAIN/)

if [[ "$LOCATION" == "https://$PROD_DOMAIN/"* ]]; then
   echo "✅ OK: Redirects to https://$PROD_DOMAIN/."
else
   echo "❌ FAIL: Redirects to $LOCATION (Expected https://$PROD_DOMAIN/)."
fi

# 3. Check Headers (Security & Vercel)
echo ""
echo "3. Checking Headers on Canonical..."
HEADERS=$(curl -s -I https://$PROD_DOMAIN/)

if echo "$HEADERS" | grep -q "x-vercel-id"; then
  echo "✅ OK: x-vercel-id present."
else
  echo "⚠️ WARN: x-vercel-id missing (Is this hosted on Vercel?)."
fi

if echo "$HEADERS" | grep -q "x-robots-tag: noindex"; then
  echo "❌ FAIL: x-robots-tag: noindex found on PROD! (SEO Danger)."
else
  echo "✅ OK: No 'noindex' tag on Prod."
fi

# 4. Check Staging (if accessible)
echo ""
echo "4. Checking Staging ($STAGING_DOMAIN)..."
STG_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$STAGING_DOMAIN/)

if [ "$STG_HTTP_CODE" == "200" ]; then
    echo "✅ OK: Staging is accessible."
    STG_HEADERS=$(curl -s -I https://$STAGING_DOMAIN/)
    if echo "$STG_HEADERS" | grep -q "x-robots-tag: noindex"; then
        echo "✅ OK: Staging has 'noindex' tag (Good)."
    else
        echo "⚠️ WARN: Staging MISSING 'noindex' tag (SEO Risk)."
    fi
else
    echo "⚠️ SKIP: Staging not accessible or not configured yet ($STG_HTTP_CODE)."
fi

echo ""
echo "=========================================="
echo "Done."
