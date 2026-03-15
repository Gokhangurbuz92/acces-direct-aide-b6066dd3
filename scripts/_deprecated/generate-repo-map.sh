#!/bin/bash

# Generates a list of all files in the repository, excluding artifacts.
# Usage: ./scripts/generate-repo-map.sh

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repository map to $OUTPUT_FILE..."

find . -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/.git/*' \
  -not -path '*/.vercel/*' \
  -not -path '*/coverage/*' \
  -not -path '*/test-results/*' \
  -not -path '*/venv/*' \
  -not \( -name '.env*' -not -name '.env.example' \) \
  -not -path '*/uploads_mock/*' \
  -not -path '*/cookies*.txt' \
  -not -path '*/test-img*.jpg' \
  -not -path '*/.DS_Store' \
  | sort > "$OUTPUT_FILE"

echo "Done. $(wc -l < "$OUTPUT_FILE") files listed."
