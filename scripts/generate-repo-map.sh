#!/bin/bash
# scripts/generate-repo-map.sh
# Generates a map of the repository files, excluding ignored directories.

OUTPUT_FILE="docs/REPO_FILES.txt"

echo "Generating repository map to $OUTPUT_FILE..."

# Find all files, excluding .git, node_modules, etc.
# Using -maxdepth 5 to prevent too much noise if deep, but prompt says "exporte une arborescence (find)".
# Excludes: node_modules, dist, .git, .vercel, coverage, test-results, venv, .env*

find . \
    -path "./.git" -prune -o \
    -path "./node_modules" -prune -o \
    -path "./dist" -prune -o \
    -path "./.vercel" -prune -o \
    -path "./coverage" -prune -o \
    -path "./test-results" -prune -o \
    -path "./playwright-report" -prune -o \
    -path "./venv" -prune -o \
    -path "./uploads_mock" -prune -o \
    -name ".DS_Store" -prune -o \
    -type f \( ! -name ".env*" -o -name ".env.example" \) -print | sort > "$OUTPUT_FILE"

echo "Done."
