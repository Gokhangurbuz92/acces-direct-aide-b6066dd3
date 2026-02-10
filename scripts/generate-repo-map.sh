#!/bin/bash
set -e

# Phase 0: Generate REPO_FILES.txt excluding artifacts and secrets

# 1. Find all files, pruning ignored directories
find . -type d \( \
    -name ".git" \
    -o -name "node_modules" \
    -o -name "dist" \
    -o -name ".vercel" \
    -o -name "coverage" \
    -o -name "test-results" \
    -o -name "playwright-report" \
    -o -name "venv" \
    -o -name "uploads_mock" \
\) -prune -o \
-type f -print | \
grep -vE "/\.DS_Store$" | \
grep -vE "REPO_FILES.tmp$" | \
grep -vE "^\./\.env" | \
grep -vE "cookies.*\.txt$" | \
grep -vE "test-img.*\.jpg$" | \
grep -vE "api/_utils/build-info\.js$" > docs/REPO_FILES.tmp

# 2. Append .env.example if it exists (since we excluded all .env*)
if [ -f .env.example ]; then
    echo "./.env.example" >> docs/REPO_FILES.tmp
fi

# 3. Sort and save
sort -u docs/REPO_FILES.tmp > docs/REPO_FILES.txt
rm docs/REPO_FILES.tmp

echo "Repo map generated in docs/REPO_FILES.txt"
