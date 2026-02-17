#!/bin/bash
# Generate a list of all files in the repository, excluding ignored directories.

TEMP_FILE="/tmp/REPO_FILES.tmp"

# Find all files, excluding unwanted directories and excluding all .env* files initially
find . -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/.git/*' \
  -not -path '*/.vercel/*' \
  -not -path '*/coverage/*' \
  -not -path '*/test-results/*' \
  -not -path '*/venv/*' \
  -not -path '*/uploads_mock/*' \
  -not -name 'cookies*.txt' \
  -not -name 'test-img*.jpg' \
  -not -name '.DS_Store' \
  -not -name '.env*' \
  > "$TEMP_FILE"

# Explicitly add .env.example if it exists
if [ -f .env.example ]; then
    echo "./.env.example" >> "$TEMP_FILE"
fi

# Sort and deduplicate, output to final file
sort -u "$TEMP_FILE" > docs/REPO_FILES.txt
rm "$TEMP_FILE"

echo "Repo map generated in docs/REPO_FILES.txt"
