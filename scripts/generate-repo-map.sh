#!/bin/bash
# scripts/generate-repo-map.sh

# Ensure docs directory exists
mkdir -p docs

echo "Generating repository file inventory to docs/REPO_FILES.txt..."

# Use find to list files, excluding specific directories and files
# We exclude .git explicitly, although -not -path '*/.*' might catch some .files, we want to keep some configuration files like .gitignore or .github if needed, but the prompt asked to exclude .git, .vercel, .env*

find . -type f \
  -not -path "./.git/*" \
  -not -path "./.vercel/*" \
  -not -path "./node_modules/*" \
  -not -path "./dist/*" \
  -not -path "./coverage/*" \
  -not -path "./test-results/*" \
  -not -path "./venv/*" \
  -not -path "./uploads_mock/*" \
  -not -name ".env*" \
  -not -name ".DS_Store" \
  -not -path "./api/_utils/build-info.js" \
  | sort > docs/REPO_FILES.txt

echo "Inventory generated."
