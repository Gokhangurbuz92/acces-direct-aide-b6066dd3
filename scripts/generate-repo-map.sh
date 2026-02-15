#!/bin/bash
# Generate docs/REPO_FILES.txt

find . -type f \
  -not -path '*/.git/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/coverage/*' \
  -not -path '*/test-results/*' \
  -not -path '*/venv/*' \
  -not -path '*/.vercel/*' \
  -not -path '*/uploads_mock/*' \
  -not -name 'package-lock.json' \
  -not -name '.DS_Store' \
  -not -name 'cookies*.txt' \
  -not -name 'test-img*.jpg' \
  -not -path './api/_utils/build-info.js' \
  \( ! -name ".env*" -or -name ".env.example" \) \
  | sort > docs/REPO_FILES.txt
