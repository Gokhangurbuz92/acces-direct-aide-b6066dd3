#!/bin/bash
# Script de vérification P0 en production
# Usage: ./verify-p0-prod.sh [BASE_URL]
# Exemple: ./verify-p0-prod.sh https://www.accesdirectaide.fr

BASE_URL="${1:-https://www.accesdirectaide.fr}"

echo "=========================================="
echo "P0 Production Verification"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local expected_content_type="$4"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}|%{content_type}" "$url")
    status_code=$(echo "$response" | cut -d'|' -f1)
    content_type=$(echo "$response" | cut -d'|' -f2)
    
    if [ "$status_code" = "$expected_status" ]; then
        if [ -z "$expected_content_type" ] || [[ "$content_type" == *"$expected_content_type"* ]]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
            ((PASS++))
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $status_code but wrong content-type: $content_type)"
            ((FAIL++))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status_code, expected $expected_status)"
        ((FAIL++))
    fi
}

echo "=========================================="
echo "1. API Aides - Sort Validation"
echo "=========================================="

test_endpoint \
    "Aides with sort=-created_date" \
    "$BASE_URL/api/aides?sort=-created_date&limit=5" \
    "200" \
    "application/json"

test_endpoint \
    "Aides with sort=-published_at" \
    "$BASE_URL/api/aides?sort=-published_at&limit=5" \
    "200" \
    "application/json"

test_endpoint \
    "Aides with sort=alpha" \
    "$BASE_URL/api/aides?sort=alpha&limit=5" \
    "200" \
    "application/json"

echo ""
echo "=========================================="
echo "2. API Demarches - DB Drift Fix"
echo "=========================================="

test_endpoint \
    "Demarches basic query" \
    "$BASE_URL/api/demarches?statut=publie&limit=3" \
    "200" \
    "application/json"

echo ""
echo "=========================================="
echo "3. API Structures - DB Drift Fix"
echo "=========================================="

test_endpoint \
    "Structures basic query" \
    "$BASE_URL/api/structures?statut=actif&limit=3" \
    "200" \
    "application/json"

echo ""
echo "=========================================="
echo "4. Sitemap - Robustness"
echo "=========================================="

test_endpoint \
    "Sitemap XML" \
    "$BASE_URL/sitemap.xml" \
    "200" \
    "application/xml"

# Additional check: verify XML content
echo -n "Verifying sitemap XML content... "
sitemap_content=$(curl -s "$BASE_URL/sitemap.xml")
if [[ "$sitemap_content" == *"<?xml"* ]] && [[ "$sitemap_content" == *"<urlset"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} (Valid XML structure)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Invalid XML structure)"
    ((FAIL++))
fi

echo ""
echo "=========================================="
echo "5. Pages Publiques - Accessibility"
echo "=========================================="

test_endpoint \
    "Page /aides" \
    "$BASE_URL/aides" \
    "200" \
    "text/html"

test_endpoint \
    "Page /demarches" \
    "$BASE_URL/demarches" \
    "200" \
    "text/html"

test_endpoint \
    "Page /annuaire" \
    "$BASE_URL/annuaire" \
    "200" \
    "text/html"

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo -e "Total tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo "P0 objectives achieved! 🎉"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please check the failed endpoints and review logs."
    exit 1
fi
