#!/usr/bin/env bash
# =============================================================================
# build-and-load.sh
# Construit l'image Docker quiz-api et l'injecte dans le cluster Kind local.
#
# Usage :
#   ./scripts/build-and-load.sh [IMAGE_TAG] [KIND_CLUSTER_NAME]
#
# Exemples :
#   ./scripts/build-and-load.sh                        # tag=latest, cluster=kind
#   ./scripts/build-and-load.sh v1.2 esgis-cluster
# =============================================================================

set -euo pipefail

# ── Paramètres ────────────────────────────────────────────────────────────────
IMAGE_NAME="quiz-api"
IMAGE_TAG="${1:-latest}"
KIND_CLUSTER="${2:-kind}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Couleurs pour les logs ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()  { echo -e "${CYAN}[build-and-load]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[build-and-load] ✓${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[build-and-load] ⚠${NC}  $*"; }
log_err()   { echo -e "${RED}[build-and-load] ✗${NC} $*" >&2; }

# ── Vérifications préalables ──────────────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    log_err "Commande '$1' introuvable. Veuillez l'installer."
    exit 1
  fi
}

check_cmd docker
check_cmd kind

# Vérifier que le cluster Kind existe
if ! kind get clusters 2>/dev/null | grep -q "^${KIND_CLUSTER}$"; then
  log_warn "Cluster Kind '${KIND_CLUSTER}' introuvable."
  log_info "Clusters disponibles :"
  kind get clusters 2>/dev/null || true
  log_err "Créez d'abord le cluster avec : kind create cluster --name ${KIND_CLUSTER}"
  exit 1
fi

# ── Build Docker ──────────────────────────────────────────────────────────────
log_info "Construction de l'image ${FULL_IMAGE}..."
cd "${REPO_ROOT}"

docker build \
  --tag "${FULL_IMAGE}" \
  --file Dockerfile \
  --label "build.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "build.branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)" \
  --label "build.commit=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)" \
  .

log_ok "Image construite : ${FULL_IMAGE}"

# ── Injection dans Kind ───────────────────────────────────────────────────────
log_info "Chargement de l'image dans le cluster Kind '${KIND_CLUSTER}'..."
kind load docker-image "${FULL_IMAGE}" --name "${KIND_CLUSTER}"

log_ok "Image ${FULL_IMAGE} chargée dans Kind '${KIND_CLUSTER}'"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Build et chargement terminés avec succès !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Image  : ${CYAN}${FULL_IMAGE}${NC}"
echo -e "  Cluster: ${CYAN}${KIND_CLUSTER}${NC}"
echo ""
echo -e "  Étape suivante : ${YELLOW}./scripts/deploy-gamecloud.sh${NC}"
echo ""
