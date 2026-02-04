#!/bin/bash

# Generates a map of the repository files, excluding ignored/build artifacts.
# Usage: ./scripts/generate-repo-map.sh

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repository map to $OUTPUT_FILE..."

# Find all files
# Exclude: .git, node_modules, dist, .vercel, coverage, test-results, venv, .env*, reports, .DS_Store
find . \
  -type d \( -name ".git" -o -name "node_modules" -o -name "dist" -o -name ".vercel" -o -name "coverage" -o -name "test-results" -o -name "venv" -o -name "uploads_mock" \) -prune \
  -o -type f \
  ! -name ".env*" \
  ! -name ".DS_Store" \
  ! -name "*.log" \
  ! -path "./docs/reports/*" \
  -print | sort > "$OUTPUT_FILE"

# Explicitly add .env.example if it exists (since we excluded .env*)
if [ -f ".env.example" ]; then
  if ! grep -q "^\./\.env\.example$" "$OUTPUT_FILE"; then
    echo "./.env.example" >> "$OUTPUT_FILE"
    sort -o "$OUTPUT_FILE" "$OUTPUT_FILE"
  fi
fi

echo "Repository map generated."
