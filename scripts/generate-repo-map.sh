#!/bin/bash
# Generates a text file listing all files in the repository, excluding ignored/heavy folders.

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repository map to $OUTPUT_FILE..."

# Find all files, exclude specific directories
# Logic for .env: exclude .env* UNLESS it is .env.example
find . \
  -type d \( -name "node_modules" -o -name "dist" -o -name ".git" -o -name ".vercel" -o -name "coverage" -o -name "test-results" -o -name "venv" -o -name "uploads_mock" -o -name ".cursor" \) -prune \
  -o -type f \
  \( ! -name ".env*" -o -name ".env.example" \) \
  ! -name "*.log" \
  ! -name "cookies*.txt" \
  ! -name "test-img*.jpg" \
  -print | sort > "$OUTPUT_FILE"

echo "Done."
