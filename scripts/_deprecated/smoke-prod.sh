#!/usr/bin/env bash
set -euo pipefail

# CP5 Fast Link Check (curl)
# - Fails if cannot connect (000)
# - Fails if any route returns 5xx
# - Logs into a report file

REPORT_FILE="release/v1.0.0/proofs/05-prod-smoke/smoke-prod-report.txt"
mkdir -p "$(dirname "$REPORT_FILE")"

# Prefer explicit env. If not set, prefer local if reachable; else use PROD.
BASE_URL="${PLAYWRIGHT_BASE_URL:-${BASE_URL:-}}"
if [[ -z "${BASE_URL}" ]]; then
  if curl -fsS --max-time 2 "http://127.0.0.1:3000/" >/dev/null 2>&1; then
    BASE_URL="http://127.0.0.1:3000"
    echo "[Smoke] Detected local server: ${BASE_URL}"
  else
    BASE_URL="https://www.accesdirectaide.fr"
    echo "[Smoke] No local server detected. Using PROD: ${BASE_URL}"
  fi
fi

echo "Starting Smoke Check against $BASE_URL at $(date)" > "$REPORT_FILE"

check_url() {
  local url="$1"
  echo "Checking $url..."

  # If curl fails (connection refused/DNS/etc), we force status to 000 without breaking set -e
  local status
  status="$(curl -o /dev/null -sS -w "%{http_code}" "$BASE_URL$url" || echo "000")"

  if [[ "$status" == "000" ]]; then
    echo "❌ FAILED: Could not connect to $BASE_URL$url (status 000)" | tee -a "$REPORT_FILE"
    exit 1
  fi

  # Numeric compare for 5xx
  if [[ "$status" -ge 500 ]]; then
    echo "❌ FAILED: $url returned $status" | tee -a "$REPORT_FILE"
    exit 1
  fi

  echo "✅ PASS: $url returned $status" | tee -a "$REPORT_FILE"
}

check_url "/"
check_url "/aides"
check_url "/demarches"
check_url "/structures"
check_url "/actualites"
check_url "/robots.txt"

echo "Smoke Check Complete. All targets healthy." | tee -a "$REPORT_FILE"
