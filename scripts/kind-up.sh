#!/usr/bin/env bash
# Create the kind cluster for the honeypot lab, install Calico (NetworkPolicy
# enforcement) and ingress-nginx. Idempotent: re-running skips what exists.
#
# Usage: scripts/kind-up.sh
# Env:   CLUSTER_NAME (default: honeypot)
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-honeypot}"
CALICO_VERSION="v3.29.3"
INGRESS_NGINX_VERSION="controller-v1.12.1"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIND_CONFIG="${ROOT_DIR}/k8s/kind-config.yaml"

log() { printf '[kind-up] %s\n' "$*"; }
die() { printf '[kind-up] ERROR: %s\n' "$*" >&2; exit 1; }

for bin in docker kind kubectl; do
  command -v "$bin" >/dev/null 2>&1 || die "'$bin' is required but not installed"
done
docker info >/dev/null 2>&1 || die "Docker daemon is not running"

if kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
  log "cluster '$CLUSTER_NAME' already exists, skipping creation"
else
  log "creating cluster '$CLUSTER_NAME' (no default CNI)"
  kind create cluster --name "$CLUSTER_NAME" --config "$KIND_CONFIG"
fi

kubectl config use-context "kind-${CLUSTER_NAME}" >/dev/null

log "installing Calico ${CALICO_VERSION}"
kubectl apply -f "https://raw.githubusercontent.com/projectcalico/calico/${CALICO_VERSION}/manifests/calico.yaml"
kubectl -n kube-system rollout status daemonset/calico-node --timeout=300s
kubectl -n kube-system rollout status deployment/calico-kube-controllers --timeout=300s

log "waiting for nodes to be Ready"
kubectl wait --for=condition=Ready nodes --all --timeout=300s

log "installing ingress-nginx ${INGRESS_NGINX_VERSION} (kind provider)"
kubectl apply -f "https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/kind/deploy.yaml"
kubectl -n ingress-nginx wait --for=condition=Ready pod \
  --selector=app.kubernetes.io/component=controller --timeout=300s

log "cluster ready:"
kubectl get nodes -o wide
