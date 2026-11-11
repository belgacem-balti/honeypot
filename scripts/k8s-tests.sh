#!/usr/bin/env bash
# Security tests for the TaskFlow deployment on kind.
# Positive tests prove the app works; negative tests prove the controls block.
# Each negative network test is paired with a positive control from the same
# pod, so a broken probe cannot pass as "blocked".
#
# Usage: scripts/k8s-tests.sh
# Env:   NS          namespace under test        (default: honeypot-fixed)
#        INGRESS_URL ingress entry point          (default: http://127.0.0.1)
#        HOST        Ingress host header          (default: taskflow.localhost)
set -uo pipefail

NS="${NS:-honeypot-fixed}"
INGRESS_URL="${INGRESS_URL:-http://127.0.0.1}"
HOST="${HOST:-taskflow.localhost}"
PROBE_IMAGE="busybox:1.36.1"
PROBE="np-probe-client"
TIMEOUT=3

PASS=0
FAIL=0
ok()   { PASS=$((PASS + 1)); printf '  OK    %s\n' "$*"; }
fail() { FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$*"; }
section() { printf '\n== %s\n' "$*"; }
# expect <allow|deny> <description> <command...>
expect() {
  local want="$1" desc="$2"; shift 2
  if "$@" >/dev/null 2>&1; then got=allow; else got=deny; fi
  if [[ "$got" == "$want" ]]; then ok "$desc ($got)"; else fail "$desc (expected $want, got $got)"; fi
}

cleanup() { kubectl -n "$NS" delete pod "$PROBE" --ignore-not-found --wait=false >/dev/null 2>&1; }
trap cleanup EXIT

command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required" >&2; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 2; }

section "Preconditions ($NS)"
expect allow "Calico is running" \
  kubectl -n kube-system rollout status daemonset/calico-node --timeout=10s
for d in postgres server client; do
  expect allow "deployment/$d is available" \
    kubectl -n "$NS" rollout status "deployment/$d" --timeout=60s
done
expect allow "default-deny-all NetworkPolicy exists" \
  kubectl -n "$NS" get networkpolicy default-deny-all

SERVER_IP="$(kubectl -n "$NS" get svc server -o jsonpath='{.spec.clusterIP}')"
POSTGRES_IP="$(kubectl -n "$NS" get svc postgres -o jsonpath='{.spec.clusterIP}')"

section "Positive: application through the Ingress"
http_code() { curl -s -o /dev/null -m 10 -w '%{http_code}' -H "Host: $HOST" "$INGRESS_URL$1"; }
expect_http() {
  local path="$1" desc="$2" code
  code="$(http_code "$path")"
  if [[ "$code" == "200" ]]; then ok "GET $path via Ingress -> 200$desc"; else fail "GET $path via Ingress -> $code (expected 200)"; fi
}
expect_http / ""
expect_http /api/health " (client -> server)"

section "Network: server pod"
# The server image has node but no nc: open raw TCP sockets with node.
node_connect() {
  kubectl -n "$NS" exec deploy/server -- node -e "
    const s = require('net').connect({ host: '$1', port: $2 });
    s.setTimeout(${TIMEOUT}000, () => process.exit(1));
    s.on('connect', () => process.exit(0));
    s.on('error', () => process.exit(1));"
}
expect allow "server -> postgres:5432" node_connect postgres 5432
expect deny  "server -> Internet 1.1.1.1:443 (egress)" node_connect 1.1.1.1 443
expect deny  "server -> Internet 8.8.8.8:53 TCP (egress)" node_connect 8.8.8.8 53

section "Network: pod with client labels"
# Same labels as the client Deployment, so the same policies apply to it.
kubectl -n "$NS" apply -f - >/dev/null <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: $PROBE
  labels:
    app.kubernetes.io/name: client
    taskflow/test-probe: "true"
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    runAsGroup: 65534
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: probe
      image: $PROBE_IMAGE
      command: ["sleep", "600"]
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: ["ALL"] }
      resources:
        requests: { cpu: 10m, memory: 16Mi }
        limits: { cpu: 50m, memory: 32Mi }
EOF
if kubectl -n "$NS" wait --for=condition=Ready "pod/$PROBE" --timeout=90s >/dev/null 2>&1; then
  probe_nc() { kubectl -n "$NS" exec "$PROBE" -- nc -z -w "$TIMEOUT" "$1" "$2"; }
  expect allow "client -> server:5000 (control)" probe_nc "$SERVER_IP" 5000
  expect deny  "client -> postgres:5432" probe_nc "$POSTGRES_IP" 5432
  expect deny  "client -> Internet 1.1.1.1:443" probe_nc 1.1.1.1 443

  section "Quarantine: label quarantine=true"
  kubectl -n "$NS" label pod "$PROBE" quarantine=true --overwrite >/dev/null
  sleep 3
  expect deny  "quarantined client -> server:5000" probe_nc "$SERVER_IP" 5000
  kubectl -n "$NS" label pod "$PROBE" quarantine- >/dev/null
  sleep 3
  expect allow "client -> server:5000 after removing quarantine" probe_nc "$SERVER_IP" 5000
else
  fail "probe pod $PROBE did not become Ready (image $PROBE_IMAGE pull?)"
fi

section "Admission: Pod Security restricted and ResourceQuota"
# Server-side dry-run goes through admission without creating anything.
admission() {
  kubectl -n "$NS" apply --dry-run=server -f - 2>&1
}
root_pod="$(admission <<EOF
apiVersion: v1
kind: Pod
metadata: { name: psa-root-test }
spec:
  containers:
    - name: root
      image: $PROBE_IMAGE
      command: ["sleep", "60"]
      securityContext: { runAsUser: 0 }
      resources:
        requests: { cpu: 10m, memory: 16Mi }
        limits: { cpu: 50m, memory: 32Mi }
EOF
)"
if grep -q "violates PodSecurity" <<<"$root_pod"; then
  ok "root pod rejected by Pod Security (restricted)"
else
  fail "root pod NOT rejected: $root_pod"
fi

no_limits="$(admission <<EOF
apiVersion: v1
kind: Pod
metadata: { name: no-limits-test }
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: nolimits
      image: $PROBE_IMAGE
      command: ["sleep", "60"]
      securityContext:
        allowPrivilegeEscalation: false
        capabilities: { drop: ["ALL"] }
EOF
)"
if grep -qi "must specify" <<<"$no_limits"; then
  ok "pod without requests/limits rejected by ResourceQuota"
else
  fail "pod without limits NOT rejected: $no_limits"
fi

printf '\n== Result: %d OK, %d FAIL\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
