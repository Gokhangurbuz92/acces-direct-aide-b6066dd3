#!/bin/bash
URL="${1:-https://acces-direct-aide-staging-rftam2nhq-gokhangurbuz92s-projects.vercel.app}"
TOKEN="${2:-TEST_TOKEN}" # Default token if not provided

echo "🔍 Verifying Staging: $URL"
echo "--------------------------------"

echo "1️⃣  Health Check (/api/health)"
curl -s -o /dev/null -w "%{http_code}" "$URL/api/health"
echo " (Expected: 200 or 401 if Vercel Auth active)"

echo -e "\n2️⃣  Admin Security - No Auth (/api/admin/inbox)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/admin/inbox")
echo "Status: $STATUS"
if [ "$STATUS" == "401" ] || [ "$STATUS" == "403" ]; then
    echo "✅ PASS (Blocked)"
else
    echo "❌ FAIL (Expected 401/403)"
fi

echo -e "\n3️⃣  Admin Security - With Bad Token"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer BAD_TOKEN" "$URL/api/admin/inbox")
echo "Status: $STATUS"
if [ "$STATUS" == "401" ] || [ "$STATUS" == "403" ]; then
    echo "✅ PASS (Blocked)"
else
    echo "❌ FAIL (Expected 401/403)"
fi

echo -e "\n4️⃣  Pipeline Security - No Secret (/api/cron/pipeline)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/cron/pipeline")
echo "Status: $STATUS"
if [ "$STATUS" == "401" ] || [ "$STATUS" == "403" ]; then
    echo "✅ PASS (Blocked)"
else
    echo "❌ FAIL (Expected 401/403)"
fi

echo -e "\n--------------------------------"
echo "Note: If basic stats are 401, it might be Vercel Password Protection."
