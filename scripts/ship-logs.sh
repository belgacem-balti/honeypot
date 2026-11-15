#!/usr/bin/env bash
# Copies honeypot telemetry lines from the server container to a file that the
# local Wazuh agent tails. Works for both deployments:
#   ./scripts/ship-logs.sh k8s       # minikube, namespace honeypot-decoy
#   ./scripts/ship-logs.sh compose   # docker-compose, container taskflow-server
set -u

MODE="${1:-k8s}"
OUT="${HONEYPOT_LOG:-/var/log/honeypot/taskflow-events.json}"
NAMESPACE="${NAMESPACE:-honeypot-decoy}"

mkdir -p "$(dirname "$OUT")"
touch "$OUT"

follow() {
  local tail="$1"
  case "$MODE" in
    k8s)     minikube kubectl -- logs -f -n "$NAMESPACE" -l app.kubernetes.io/name=server \
               -c server --tail="$tail" --max-log-requests=10 2>/dev/null ;;
    compose) docker logs -f --tail="$tail" taskflow-server 2>/dev/null ;;
    *)       echo "usage: $0 [k8s|compose]" >&2; exit 2 ;;
  esac
}

# First attach replays recent history; reconnects (pod restart, rollout) only
# take new lines, so events are not duplicated in Wazuh.
tail=200
while true; do
  follow "$tail" | grep --line-buffered '^{"honeypot":"taskflow"' >> "$OUT"
  tail=0
  sleep 3
done
