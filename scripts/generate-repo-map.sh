#!/bin/bash
# Generate a repository file map excluding noise

find . -maxdepth 5 \
  \( -name '.git' -o -name '.vercel' -o -name 'node_modules' -o -name 'dist' -o -name 'coverage' -o -name 'test-results' -o -name 'venv' -o -name '__pycache__' -o -name 'proofs' \) -prune \
  -o -type f \( ! -name '.env' ! -name '.env.local' ! -name '.DS_Store' \) -print | \
  grep -vE '/\.env\.(?!example$)[^/]*$' | sort > docs/REPO_FILES.txt

echo "Repository map generated at docs/REPO_FILES.txt"
