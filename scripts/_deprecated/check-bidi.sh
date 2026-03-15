#!/bin/bash
set -e

echo "🔍 Scanning for hidden bidirectional Unicode characters..."

# Usage of Perl for cross-platform compatibility (macOS/Linux)
# Scans for U+202A-U+202E and U+2066-U+2069
FOUND=$(find . -type f \
    -not -path '*/.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/.next/*' \
    \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.md" -o -name "*.json" \) \
    -print0 | xargs -0 perl -ne 'if (/[\x{202a}-\x{202e}\x{2066}-\x{2069}]/) { print "FILE: $ARGV LINE: $.\n" }')

if [ -n "$FOUND" ]; then
  echo "❌ Error: Forbidden bidirectional Unicode characters found:"
  echo "$FOUND"
  exit 1
else
  echo "✅ No hidden bidirectional characters found."
  exit 0
fi
