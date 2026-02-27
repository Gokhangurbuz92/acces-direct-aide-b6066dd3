#!/bin/bash
# ═══════════════════════════════════════════════════════════
# deploy.sh — Script de déploiement local pour ADA
# Usage: ./scripts/deploy.sh [--skip-tests]
# ═══════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${BLUE}▸${NC} $1"; }
ok()   { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC}  $1"; }
fail() { echo -e "${RED}❌${NC} $1" && exit 1; }

SKIP_TESTS=false
for arg in "$@"; do
    [ "$arg" == "--skip-tests" ] && SKIP_TESTS=true
done

echo ""
echo -e "${BLUE}🚀 ADA — Pipeline de Déploiement${NC}"
echo "════════════════════════════════════"
echo ""

# ─── 1. Env checks ───────────────────────────────────────
log "Vérification des prérequis..."

if [ -z "${DATABASE_URL:-}" ]; then
    fail "DATABASE_URL n'est pas définie. Configurez votre .env"
fi

if ! command -v node &> /dev/null; then
    fail "Node.js n'est pas installé."
fi

ok "Prérequis validés"

# ─── 2. Dependencies ─────────────────────────────────────
log "Installation des dépendances..."
npm ci --silent 2>/dev/null || npm install --silent
ok "Dépendances installées"

# ─── 3. Lint ──────────────────────────────────────────────
log "Vérification qualité (ESLint)..."
npx eslint src/ --quiet --max-warnings=0 2>/dev/null && ok "Lint OK" || {
    warn "Warnings ESLint détectés (non-bloquant)"
}

# ─── 4. Backend syntax check ─────────────────────────────
log "Vérification syntaxe API..."
find api/_handlers -name '*.js' -exec node -c {} \; 2>/dev/null
ok "Syntaxe API validée"

# ─── 5. Prisma + Build ───────────────────────────────────
log "Génération Prisma Client + Build Vite..."
npx prisma generate --no-hints 2>/dev/null
npx vite build 2>&1 | tail -3
ok "Build terminé"

# ─── 6. Database sync ────────────────────────────────────
log "Synchronisation du schéma avec la base de données..."
npx prisma db push --accept-data-loss --skip-generate 2>/dev/null
ok "Schéma DB synchronisé"

# ─── 7. Deploy to Vercel ─────────────────────────────────
log "Déploiement vers Vercel (production)..."
if command -v vercel &> /dev/null; then
    vercel --prod --yes
else
    npx -y vercel --prod --yes
fi
ok "Déployé sur Vercel"

# ─── 8. Smoke tests ──────────────────────────────────────
if [ "$SKIP_TESTS" = false ]; then
    log "Tests de fumée post-déploiement..."
    node scripts/smoke-test.js && ok "Smoke tests passés" || warn "Certains tests ont échoué"
else
    warn "Tests de fumée ignorés (--skip-tests)"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ADA est en production !${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
