#!/bin/bash
# Generates a map of the repository files, excluding ignored/build directories.

find . \
  -type d \( \
    -name "node_modules" -o \
    -name "dist" -o \
    -name "dist-ssr" -o \
    -name ".git" -o \
    -name ".vercel" -o \
    -name "coverage" -o \
    -name "test-results" -o \
    -name "playwright-report" -o \
    -name "venv" -o \
    -name "uploads_mock" \
  \) -prune \
  -o -type f \( \
    -name ".env" -o \
    -name ".env.local" -o \
    -name ".DS_Store" -o \
    -name "cookies*.txt" -o \
    -name "test-img*.jpg" \
  \) -prune \
  -o -print | sort > docs/REPO_FILES.txt
