#!/bin/bash

# Generates a map of the repository files, excluding ignored/build directories.

find . \
    \( -path "./.git" -o -path "./node_modules" -o -path "./dist" -o -path "./.vercel" -o -path "./coverage" -o -path "./test-results" -o -path "./venv" -o -path "./uploads_mock" -o -path "./__pycache__" \) -prune \
    -o -name ".env*" ! -name ".env.example" -prune \
    -o -print | sort > docs/REPO_FILES.txt
