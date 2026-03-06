#!/bin/bash

# cleanup-assets.sh (v2)
# Orchestre le nettoyage et l'optimisation WebP pour la PR #1
# Usage: bash scripts/cleanup-assets.sh

set -e

echo "🛡️  Démarrage de la Phase de Nettoyage ADA..."
echo ""

# 1. Nettoyage des PNGs orphelins (Audit v3)
LOGOS=("logo-full.png" "logo-icon.png" "logo-full-transparent.png" "logo-icon-transparent.png")
BASE_PATH="public/assets/branding"
CLEANED=0

for logo in "${LOGOS[@]}"; do
    FILE="$BASE_PATH/$logo"
    if [ -f "$FILE" ]; then
        echo "🗑️  Suppression de l'asset orphelin : $logo ($(du -h "$FILE" | cut -f1))"
        rm "$FILE"
        CLEANED=$((CLEANED + 1))
    else
        echo "✅ Déjà nettoyé : $logo"
    fi
done
echo ""
echo "📊 $CLEANED fichier(s) orphelin(s) supprimé(s)."
echo ""

# 2. Lancement de la conversion WebP
if [ -f "scripts/convert-to-webp.js" ]; then
    echo "⚙️  Lancement de la conversion WebP..."
    node scripts/convert-to-webp.js
else
    echo "⚠️  Script convert-to-webp.js introuvable."
fi

echo ""
echo "🏗️  Vérification de l'intégrité (Build)..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PR #1 prête pour la revue. Performance optimisée."
else
    echo ""
    echo "❌ Échec du build. Veuillez vérifier les chemins d'images."
    exit 1
fi
