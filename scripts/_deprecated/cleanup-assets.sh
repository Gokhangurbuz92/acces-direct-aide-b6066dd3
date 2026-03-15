#!/bin/bash

# cleanup-assets.sh (v2)
# Orchestre le nettoyage et l'optimisation WebP pour la PR #1

set -e

echo "🛡️  Démarrage de la Phase de Nettoyage ADA..."

# 1. Nettoyage des PNGs orphelins (Audit v3 — public/assets/branding)
LOGOS=("logo-full.png" "logo-icon.png" "logo-full-transparent.png" "logo-icon-transparent.png")
BASE_PATH="public/assets/branding"

for logo in "${LOGOS[@]}"; do
    FILE="$BASE_PATH/$logo"
    if [ -f "$FILE" ]; then
        echo "🗑️  Suppression de l'asset orphelin : $logo"
        rm "$FILE"
    else
        echo "ℹ️  Déjà absent : $logo"
    fi
done

# 2. Nettoyage des PNGs redondants dans public/brand/ (WebP déjà présents)
BRAND_PNGS=(
    "logo-horizontal-tagline-transparent.png"
    "logo-horizontal-tagline.png"
    "logo-horizontal-transparent.png"
    "logo-horizontal.png"
    "logo-mark-transparent.png"
    "logo-mark.png"
    "logo-stacked-tagline-transparent.png"
    "logo-stacked-tagline.png"
)

for png in "${BRAND_PNGS[@]}"; do
    FILE="public/brand/$png"
    WEBP="public/brand/${png%.png}.webp"
    if [ -f "$FILE" ] && [ -f "$WEBP" ]; then
        echo "🗑️  Suppression PNG redondant (WebP existe) : $png"
        rm "$FILE"
    elif [ -f "$FILE" ]; then
        echo "⚠️  PNG sans WebP — conservé : $png"
    else
        echo "ℹ️  Déjà absent : $png"
    fi
done

# 3. Lancement de la conversion WebP pour les images OG
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
    echo "✅ PR #1 prête pour la revue. Performance optimisée."
else
    echo "❌ Échec du build. Veuillez vérifier les chemins d'images."
    exit 1
fi
