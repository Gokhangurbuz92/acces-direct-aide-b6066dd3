#!/bin/bash
# Production Health Check for AccesDirectAide
# Usage: ./scripts/healthcheck_prod.sh

set -euo pipefail

BASE_URL="https://www.accesdirectaide.fr"
PASSED=0
FAILED=0

echo "🏥 AccesDirectAide Production Health Check"
echo "==========================================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Homepage
echo "Test 1: Homepage (/)..."
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Homepage: HTTP $HTTP_CODE (text/html)"
    ((PASSED++))
else
    echo "❌ Homepage: HTTP $HTTP_CODE (expected 200)"
    ((FAILED++))
fi

# Test 2: API Taxonomy
echo "Test 2: API Taxonomy (/api/taxonomy)..."
RESPONSE=$(curl -sS -D - -o /dev/null "$BASE_URL/api/taxonomy" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "^content-type:" | tail -1 | awk '{print $2}')

if [ "$HTTP_CODE" = "200" ] && [[ "$CONTENT_TYPE" == *"application/json"* ]]; then
    echo "✅ API Taxonomy: HTTP $HTTP_CODE + $CONTENT_TYPE"
    ((PASSED++))
else
    echo "❌ API Taxonomy: HTTP $HTTP_CODE, Content-Type: $CONTENT_TYPE"
    ((FAILED++))
fi

# Test 3: Sitemap
echo "Test 3: Sitemap (/sitemap.xml)..."
RESPONSE=$(curl -sS -D - -o /dev/null "$BASE_URL/sitemap.xml" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "^content-type:" | tail -1 | awk '{print $2}')

if [ "$HTTP_CODE" = "200" ] && [[ "$CONTENT_TYPE" == *"application/xml"* ]]; then
    echo "✅ Sitemap: HTTP $HTTP_CODE + $CONTENT_TYPE"
    ((PASSED++))
else
    echo "❌ Sitemap: HTTP $HTTP_CODE, Content-Type: $CONTENT_TYPE"
    ((FAILED++))
fi

# Test 4: robots.txt with www sitemap
echo "Test 4: robots.txt (contains www sitemap)..."
ROBOTS_CONTENT=$(curl -sS "$BASE_URL/robots.txt")
if echo "$ROBOTS_CONTENT" | grep -q "Sitemap: https://www.accesdirectaide.fr/sitemap.xml"; then
    echo "✅ robots.txt: Contains canonical www sitemap"
    ((PASSED++))
else
    echo "❌ robots.txt: Missing or incorrect sitemap URL"
    echo "   Content: $ROBOTS_CONTENT"
    ((FAILED++))
fi

# Test 5: Apex redirect
echo "Test 5: Apex redirect (accesdirectaide.fr → www)..."
RESPONSE=$(curl -sS -I https://accesdirectaide.fr/ 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep -i "^HTTP/" | head -1 | awk '{print $2}')
LOCATION=$(echo "$RESPONSE" | grep -i "^location:" | head -1 | awk '{print $2}' | tr -d '\r')

if [ "$HTTP_CODE" = "308" ] && [ "$LOCATION" = "https://www.accesdirectaide.fr/" ]; then
    echo "✅ Apex redirect: HTTP $HTTP_CODE → $LOCATION"
    ((PASSED++))
else
    echo "❌ Apex redirect: HTTP $HTTP_CODE, Location: $LOCATION"
    ((FAILED++))
fi

# Test 6: Sitemap contains no vercel.app URLs
echo "Test 6: Sitemap canonical URLs (no vercel.app)..."
if curl -sS "$BASE_URL/sitemap.xml" 2>&1 | grep -qE "vercel\.app|acces-direct-aide-staging"; then
    echo "❌ Sitemap contains vercel.app/staging URLs"
    ((FAILED++))
else
    echo "✅ Sitemap: All URLs use canonical domain"
    ((PASSED++))
fi

# Summary
echo ""
echo "==========================================="
echo "📊 Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
    echo "🎉 All 6 health checks passed!"
    exit 0
else
    echo "⚠️  Some health checks failed"
    exit 1
fi
