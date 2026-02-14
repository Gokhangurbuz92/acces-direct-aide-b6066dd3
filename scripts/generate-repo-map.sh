#!/bin/bash
set -e

# Generates a map of the repository files, excluding noise
# Usage: ./scripts/generate-repo-map.sh

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repo map to $OUTPUT_FILE..."

# Find all files, excluding specific directories
# We use -prune to skip descending into excluded directories
find . \
  -type d \( \
    -name "node_modules" -o \
    -name "dist" -o \
    -name ".git" -o \
    -name ".vercel" -o \
    -name "coverage" -o \
    -name "test-results" -o \
    -name "playwright-report" -o \
    -name "venv" -o \
    -name "uploads_mock" \
  \) -prune -o \
  -type f \( \
    -not -name ".env*" -o -name ".env.example" \
  \) \
  -not -name "cookies*.txt" \
  -not -name "test-img*.jpg" \
  -not -name "api/_utils/build-info.js" \
  -print | sort > "$OUTPUT_FILE"

echo "Done."
