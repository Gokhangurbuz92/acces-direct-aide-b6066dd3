#!/bin/bash
# scripts/guard-no-legacy-key.sh

# Forbidden keyword
KEYWORD="ENCRYPTION_KEY"
ALLOWED_FILES="scripts/guard-no-legacy-key.sh"

echo "🔍 Scanning for forbidden keyword: $KEYWORD..."

# Search using grep, excluding the script itself and common ignore directories
# We use 'process.env.ENCRYPTION_KEY' or just 'ENCRYPTION_KEY' ? 
# User asked specifically for 'ENCRYPTION_KEY' to verify total removal.
# But 'ADA_ENCRYPTION_KEY' contains the substring! 
# So we must search for 'ENCRYPTION_KEY' but exclude 'ADA_ENCRYPTION_KEY'.
# Actually, if we renamed it, 'ADA_ENCRYPTION_KEY' is fine.
# We want to find cases where it is NOT 'ADA_ENCRYPTION_KEY'.
# Using grep -w (word match) might help but 'ADA_ENCRYPTION_KEY' is one word.
# 'ENCRYPTION_KEY' as a word would match if it stands alone.

# If the code uses `process.env.ENCRYPTION_KEY`, checking for `ENCRYPTION_KEY` alone matches.
# But checks for `ADA_ENCRYPTION_KEY` also match substring `ENCRYPTION_KEY`.
# We need to find `ENCRYPTION_KEY` that is NOT preceded by `ADA_`.

# Using ripgrep if available or grep. Assuming standard grep is safer for portable script.
# Pattern: negative lookbehind? grep doesn't easily support it.
# We can grep for ENCRYPTION_KEY and grep -v ADA_ENCRYPTION_KEY

FOUND=$(grep -r "ENCRYPTION_KEY" . \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=dist \
    --exclude-dir=.next \
    --exclude-dir=.gemini \
    --exclude="guard-no-legacy-key.sh" \
    --exclude="task.md" \
    --exclude="implementation_plan.md" \
    --exclude="package-lock.json" | grep -v "ADA_ENCRYPTION_KEY")

if [ -n "$FOUND" ]; then
    echo "❌ Forbidden '$KEYWORD' usage found (excluding ADA_ prefixed):"
    echo "$FOUND"
    echo "FAILURE: You must rename all ENCRYPTION_KEY to ADA_ENCRYPTION_KEY."
    exit 1
fi

echo "✅ No legacy '$KEYWORD' found."
exit 0
