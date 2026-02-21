#!/bin/bash

# Generates a list of all files in the repository, excluding artifacts and hidden files.
# Usage: ./scripts/generate-repo-map.sh

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repository file list to $OUTPUT_FILE..."

# Find all files, excluding specific directories and patterns
find . -type f \
  -not -path '*/.git/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/dist-ssr/*' \
  -not -path '*/.vercel/*' \
  -not -path '*/coverage/*' \
  -not -path '*/test-results/*' \
  -not -path '*/venv/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/.cursor/*' \
  -not -path '*/uploads_mock/*' \
  -not -name '.DS_Store' \
  -not -name '.env*' \
  -not -name 'cookies*.txt' \
  -not -name 'test-img*.jpg' \
  -not -name 'npm-debug.log*' \
  -not -name 'yarn-debug.log*' \
  -not -name 'yarn-error.log*' \
  -not -name 'pnpm-debug.log*' \
  -not -name 'lerna-debug.log*' \
  | sort > "$OUTPUT_FILE"

# Add allowed env files back if they were excluded by .env*
if [ -f .env.example ]; then
  echo "./.env.example" >> "$OUTPUT_FILE"
fi
if [ -f .env.template ]; then
  echo "./.env.template" >> "$OUTPUT_FILE"
fi

# Sort again to place env files correctly
sort -o "$OUTPUT_FILE" "$OUTPUT_FILE"

echo "Done. File list written to $OUTPUT_FILE."
