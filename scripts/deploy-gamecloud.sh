#!/usr/bin/env bash
# =============================================================================
# deploy-gamecloud.sh
# Applique le manifeste Kubernetes quiz-api dans le namespace "gamecloud"
# et force le redémarrage du déploiement pour utiliser la nouvelle image.
#
# Usage :
#   ./scripts/deploy-gamecloud.sh [MANIFEST_FILE] [KIND_CLUSTER_NAME]
#
# Exemples :
#   ./scripts/deploy-gamecloud.sh
#   ./scripts/deploy-gamecloud.sh k8s/quiz-api.yaml esgis-cluster
# =============================================================================

set -euo pipefail

# ── Paramètres ────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${1:-${REPO_ROOT}/k8s/quiz-api.yaml}"
KIND_CLUSTER="${2:-kind}"
NAMESPACE="gamecloud"
DEPLOYMENT="quiz-api"

# ── Couleurs ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info() { echo -e "${CYAN}[deploy-gamecloud]${NC} $*"; }
log_ok()   { echo -e "${GREEN}[deploy-gamecloud] ✓${NC} $*"; }
log_warn() { echo -e "${YELLOW}[deploy-gamecloud] ⚠${NC}  $*"; }
log_err()  { echo -e "${RED}[deploy-gamecloud] ✗${NC} $*" >&2; }

# ── Vérifications préalables ──────────────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    log_err "Commande '$1' introuvable. Veuillez l'installer."
    exit 1
  fi
}

check_cmd kubectl
check_cmd kind

# Pointer kubectl sur le bon contexte Kind
KUBE_CONTEXT="kind-${KIND_CLUSTER}"
if ! kubectl config get-contexts "${KUBE_CONTEXT}" &>/dev/null; then
  log_warn "Contexte kubectl '${KUBE_CONTEXT}' introuvable. Contextes disponibles :"
  kubectl config get-contexts 2>/dev/null || true
  log_err "Vérifiez que le cluster Kind '${KIND_CLUSTER}' est démarré."
  exit 1
fi

export KUBECONFIG="${HOME}/.kube/config"
kubectl config use-context "${KUBE_CONTEXT}" >/dev/null

log_info "Contexte actif : $(kubectl config current-context)"

# Vérifier que le manifeste existe
if [[ ! -f "${MANIFEST}" ]]; then
  log_err "Manifeste introuvable : ${MANIFEST}"
  exit 1
fi

# ── Application du manifeste ──────────────────────────────────────────────────
log_info "Application du manifeste : ${MANIFEST}"
kubectl apply -f "${MANIFEST}"
log_ok "Manifeste appliqué."

# ── Forcer le redémarrage pour utiliser la nouvelle image ──────────────────────
log_info "Redémarrage du déploiement '${DEPLOYMENT}' dans '${NAMESPACE}'..."
kubectl rollout restart deployment/"${DEPLOYMENT}" -n "${NAMESPACE}"

# ── Attente de la disponibilité ───────────────────────────────────────────────
log_info "Attente du rollout (timeout 120s)..."
if kubectl rollout status deployment/"${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=120s; then
  log_ok "Déploiement '${DEPLOYMENT}' opérationnel."
else
  log_warn "Le rollout n'a pas convergé dans le délai imparti."
  log_info "Diagnostic :"
  kubectl describe deployment/"${DEPLOYMENT}" -n "${NAMESPACE}" 2>/dev/null | tail -20 || true
  kubectl get pods -n "${NAMESPACE}" -l "app=${DEPLOYMENT}" 2>/dev/null || true
  log_warn "Essayez manuellement :"
  echo "  kubectl rollout restart deployment/${DEPLOYMENT} -n ${NAMESPACE}"
  exit 1
fi

# ── Informations d'accès ──────────────────────────────────────────────────────
NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo '127.0.0.1')"
NODE_PORT="$(kubectl get svc "${DEPLOYMENT}" -n "${NAMESPACE}" -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo '30301')"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Déploiement gamecloud terminé avec succès !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Namespace  : ${CYAN}${NAMESPACE}${NC}"
echo -e "  Deployment : ${CYAN}${DEPLOYMENT}${NC}"
echo ""
echo -e "  Endpoints disponibles :"
echo -e "    Santé    : ${YELLOW}http://${NODE_IP}:${NODE_PORT}/health${NC}"
echo -e "    Quiz ESGIS : ${YELLOW}http://${NODE_IP}:${NODE_PORT}/api/quiz/esgis${NC}"
echo -e "    Quiz complet : ${YELLOW}http://${NODE_IP}:${NODE_PORT}/api/quiz/esgis/full${NC}"
echo -e "    Practice  : ${YELLOW}http://${NODE_IP}:${NODE_PORT}/api/quiz/practice${NC}"
echo ""
echo -e "  Pods actifs :"
kubectl get pods -n "${NAMESPACE}" -l "app=${DEPLOYMENT}" --no-headers 2>/dev/null | \
  awk '{printf "    %-45s %s\n", $1, $3}' || true
echo ""
