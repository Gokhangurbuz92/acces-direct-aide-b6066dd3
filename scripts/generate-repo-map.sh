#!/bin/bash
# scripts/generate-repo-map.sh
# Generates a list of files in docs/REPO_FILES.txt excluding artifacts

find . \
  \( \
    -name 'node_modules' -o \
    -name 'dist' -o \
    -name '.git' -o \
    -name '.vercel' -o \
    -name 'coverage' -o \
    -name 'test-results' -o \
    -name 'venv' -o \
    -name 'uploads_mock' \
  \) -prune \
  -o \
  -not -name '.env' \
  -not -name '.env.local' \
  -not -name '.env.production' \
  -not -name '.env.development' \
  -not -name '.env.test' \
  -not -name 'cookies*.txt' \
  -not -name 'test-img*.jpg' \
  -not -path '.' \
  -print \
  | sort > docs/REPO_FILES.txt
