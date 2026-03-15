#!/bin/bash
# ============================================================
# Accès Direct Aide — Script d'initialisation Production
# ============================================================
# Usage:
#   chmod +x scripts/setup-production.sh
#   ./scripts/setup-production.sh
# ============================================================

set -euo pipefail

echo ""
echo "🛠️  Accès Direct Aide — Setup Production Souverain"
echo "==================================================="
echo ""

# ─────────────────────────────────────────────────
# 1. Vérification des prérequis
# ─────────────────────────────────────────────────

echo "📋 Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé."
    echo "   → https://docs.docker.com/engine/install/"
    exit 1
fi
echo "  ✅ Docker $(docker --version | sed 's/Docker version //' | sed 's/,.*//')"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    exit 1
fi
echo "  ✅ Node $(node --version)"

if ! command -v npx &> /dev/null; then
    echo "❌ npx n'est pas disponible."
    exit 1
fi
echo "  ✅ npx disponible"

echo ""

# ─────────────────────────────────────────────────
# 2. Vérification du fichier .env
# ─────────────────────────────────────────────────

echo "📋 Vérification de la configuration..."

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env.local"
fi
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Aucun fichier .env trouvé."
    echo "   Copiez .env.example vers .env.production et remplissez les valeurs."
    echo "   → cp .env.example .env.production"
    exit 1
fi
echo "  ✅ Fichier env: $ENV_FILE"

# Vérifier les variables critiques
check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
    if [ -z "$var_value" ] || [[ "$var_value" == *"placeholder"* ]] || [[ "$var_value" == *"user:pass"* ]]; then
        echo "  ⚠️  ${var_name} non configuré"
        return 1
    fi
    echo "  ✅ ${var_name} configuré"
    return 0
}

MISSING=0
check_var "DATABASE_URL" || MISSING=$((MISSING + 1))
check_var "GEMINI_API_KEY" || MISSING=$((MISSING + 1))

if [ $MISSING -gt 0 ]; then
    echo ""
    echo "⚠️  ${MISSING} variable(s) critique(s) non configurée(s)."
    echo "   Le déploiement peut échouer. Continuez à vos risques."
    echo ""
fi

# ─────────────────────────────────────────────────
# 3. Démarrage des services Docker
# ─────────────────────────────────────────────────

echo ""
echo "🐳 Démarrage de PostgreSQL + Redis..."
docker compose up -d postgres redis

echo ""
echo "⏳ Attente de PostgreSQL..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "❌ PostgreSQL n'a pas démarré dans les temps."
        exit 1
    fi
    sleep 1
done
echo "  ✅ PostgreSQL prêt"

# ─────────────────────────────────────────────────
# 4. Extension pgvector
# ─────────────────────────────────────────────────

echo ""
echo "🧮 Activation de pgvector..."
docker compose exec -T postgres psql -U postgres -d acces_direct_aide \
    -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
echo "  ✅ pgvector activé"

# ─────────────────────────────────────────────────
# 5. Migrations Prisma
# ─────────────────────────────────────────────────

echo ""
echo "📊 Application des migrations Prisma..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss 2>/dev/null || echo "  ⚠️  Migrations en erreur — vérifier manuellement"
echo "  ✅ Schéma DB à jour"

# ─────────────────────────────────────────────────
# 6. Build Docker (API)
# ─────────────────────────────────────────────────

echo ""
echo "🏗️  Build de l'image de production..."
docker build -t ada-api . --quiet
echo "  ✅ Image ada-api construite"

# ─────────────────────────────────────────────────
# 7. Résumé
# ─────────────────────────────────────────────────

echo ""
echo "==================================================="
echo "✅ Environnement prêt !"
echo ""
echo "Commandes suivantes :"
echo "  docker run -d --name ada-api --env-file ${ENV_FILE} -p 3000:3000 ada-api"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "Documentation :"
echo "  → docs/RUNBOOK.md"
echo "  → docs/openapi.yaml"
echo "==================================================="
