#!/bin/bash
# Generates a map of the repository files, excluding ignored/build directories.

# Generates a map of the repository files, excluding ignored/build directories.

# Generate repo map
# Excludes: node_modules, dist, .git, .vercel, coverage, test-results, venv, .env*, uploads_mock, cookies*
find . -maxdepth 5 \
  -not -path '*/.git/*' \
  -not -path '*/.git' \
  -not -path '*/.vercel/*' \
  -not -path '*/.vercel' \
  -not -path '*/node_modules/*' \
  -not -path '*/node_modules' \
  -not -path '*/dist/*' \
  -not -path '*/dist' \
  -not -path '*/coverage/*' \
  -not -path '*/coverage' \
  -not -path '*/test-results/*' \
  -not -path '*/test-results' \
  -not -path '*/playwright-report/*' \
  -not -path '*/playwright-report' \
  -not -path '*/venv/*' \
  -not -path '*/venv' \
  -not -path '*/__pycache__/*' \
  -not -path '*/uploads_mock/*' \
  -not -path '*/uploads_mock' \
  -not -name '.env*' \
  -not -name 'cookies*.txt' \
  -not -name 'test-img*.jpg' \
  | sort > docs/REPO_FILES.txt

echo "Repo map generated at docs/REPO_FILES.txt"
