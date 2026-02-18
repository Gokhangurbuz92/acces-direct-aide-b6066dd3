#!/bin/bash
# Generate a list of all files in the repository, excluding build artifacts and secrets.

# Create docs directory if it doesn't exist
mkdir -p docs

# Find all files, excluding specific directories and patterns
# We exclude .env* files generally, but explicitly keep .env.example
find . -type d \( \
    -name "node_modules" -o \
    -name "dist" -o \
    -name ".git" -o \
    -name ".vercel" -o \
    -name "coverage" -o \
    -name "test-results" -o \
    -name "venv" -o \
    -name "uploads_mock" \
\) -prune -o \
-type f \
-not -name ".env*" \
-not -name "cookies*.txt" \
-not -name "test-img*.jpg" \
-print > docs/REPO_FILES.tmp

# Add back .env.example if it exists
if [ -f .env.example ]; then
    echo "./.env.example" >> docs/REPO_FILES.tmp
fi

# Sort and save to final file
sort -u docs/REPO_FILES.tmp > docs/REPO_FILES.txt
rm docs/REPO_FILES.tmp

echo "Repository map generated at docs/REPO_FILES.txt"
