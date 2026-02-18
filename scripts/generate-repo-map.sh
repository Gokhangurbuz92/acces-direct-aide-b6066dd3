#!/bin/bash

# Create docs directory if it doesn't exist
mkdir -p docs

# Find all files, excluding specified directories and patterns
# We use a while loop to filter .env files more precisely
find . -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/.git/*' \
  -not -path '*/.vercel/*' \
  -not -path '*/coverage/*' \
  -not -path '*/test-results/*' \
  -not -path '*/playwright-report/*' \
  -not -path '*/venv/*' \
  -not -path '*/uploads_mock/*' \
  -not -name 'cookies*.txt' \
  -not -name 'test-img*.jpg' \
  -not -name '.DS_Store' \
  -not -path '*/api/_utils/build-info.js' \
  -print0 | while IFS= read -r -d '' file; do
    # Check if file is an env file (starts with .env or contains /.env)
    # If it is, ensure it is .env.example, otherwise skip
    if [[ "$file" == *".env"* ]]; then
      if [[ "$file" != *".env.example" ]]; then
        continue
      fi
    fi
    echo "$file"
done | sort > docs/REPO_FILES.txt

echo "Repo map generated in docs/REPO_FILES.txt"
