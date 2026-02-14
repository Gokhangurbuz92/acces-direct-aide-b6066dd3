#!/bin/bash
# Generates a map of the repository files, excluding build artifacts and temporary files.

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repository map to $OUTPUT_FILE..."

find . \
  -path "./node_modules" -prune -o \
  -path "./dist" -prune -o \
  -path "./.git" -prune -o \
  -path "./.vercel" -prune -o \
  -path "./coverage" -prune -o \
  -path "./test-results" -prune -o \
  -path "./venv" -prune -o \
  -path "./uploads_mock" -prune -o \
  -name ".env*" -not -name ".env.example" -prune -o \
  -name "cookies*.txt" -prune -o \
  -name "test-img*.jpg" -prune -o \
  -path "./api/_utils/build-info.js" -prune -o \
  -print | sort > "$OUTPUT_FILE"

echo "Done."
