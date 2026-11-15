#!/usr/bin/env bash
# Create/update the Kubernetes Secrets used by the k8s/ stack from a local .env.
#
#   scripts/create-k8s-secrets.sh [path/to/.env]
#
# - Reads .env as plain KEY=VALUE lines (it is never sourced/executed).
# - Detects the namespace from k8s/kustomization.yaml (fallback: k8s/namespace.yaml).
# - Creates postgres-secret, server-secret and security-secret with
#   `kubectl create secret generic --from-env-file ... --dry-run=client -o yaml | kubectl apply -f -`.
# - NEVER prints secret values: they only travel through 0600 temp files and a pipe.
#
# Environment overrides:
#   KUBECTL       kubectl command (default: "minikube kubectl --" if minikube exists, else "kubectl")
#   NAMESPACE     skip namespace detection
#   PG_HOST       primary Postgres Service   (default: postgres-service)
#   PG_SHARD1_HOST shard-1 Postgres Service  (default: postgres-shard-1-service)
#   PG_PORT       (default: 5432)
set -euo pipefail
set +x   # never trace: tracing would print values

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$REPO_ROOT/.env}"
K8S_DIR="$REPO_ROOT/k8s"

die() { echo "error: $*" >&2; exit 1; }

[ -f "$ENV_FILE" ] || die "$ENV_FILE not found. Copy .env.example to .env and fill it in."

# --- kubectl ---------------------------------------------------------------
if [ -n "${KUBECTL:-}" ]; then
  read -r -a KC <<<"$KUBECTL"
elif command -v minikube >/dev/null 2>&1; then
  KC=(minikube kubectl --)
else
  KC=(kubectl)
fi

# --- namespace detection ---------------------------------------------------
detect_ns() {
  local ns=""
  [ -f "$K8S_DIR/kustomization.yaml" ] &&
    ns=$(sed -nE 's/^namespace:[[:space:]]*"?([a-z0-9-]+)"?[[:space:]]*$/\1/p' "$K8S_DIR/kustomization.yaml" | head -1)
  if [ -z "$ns" ] && [ -f "$K8S_DIR/namespace.yaml" ]; then
    ns=$(awk '/^kind:[[:space:]]*Namespace/{f=1} f&&/^[[:space:]]+name:/{print $2; exit}' "$K8S_DIR/namespace.yaml" | tr -d '"')
  fi
  echo "$ns"
}
NS="${NAMESPACE:-$(detect_ns)}"
[ -n "$NS" ] || die "could not detect the namespace; set NAMESPACE=..."

# --- read .env without executing it ----------------------------------------
declare -A ENV=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
  [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
  key="${BASH_REMATCH[2]}"; val="${BASH_REMATCH[3]}"
  if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"; fi
  ENV[$key]="$val"
done < "$ENV_FILE"

get() { printf '%s' "${ENV[$1]:-}"; }

is_placeholder() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    ""|change_me|changeme|replace_me*|password|secret|xxx*) return 0 ;;
  esac
  return 1
}

missing=()
for k in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB JWT_SECRET; do
  is_placeholder "$(get "$k")" && missing+=("$k")
done
[ ${#missing[@]} -eq 0 ] || die "empty or placeholder value in $ENV_FILE for: ${missing[*]}"
[ "$(get JWT_SECRET | wc -c)" -ge 32 ] || die "JWT_SECRET is too short (use: openssl rand -base64 32)"
[ "$(get POSTGRES_PASSWORD | wc -c)" -ge 16 ] || die "POSTGRES_PASSWORD is too short (use: openssl rand -base64 32)"

for k in GROQ_API_KEY ABUSEIPDB_API_KEY OTX_API_KEY; do
  is_placeholder "$(get "$k")" && echo "note: $k is empty; lookups using it will fail." >&2
done

# RFC 3986 percent-encoding for the password inside DATABASE_URL (base64 has + / =)
urlencode() {
  local s="$1" out="" c i
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      [A-Za-z0-9._~-]) out+="$c" ;;
      *) out+=$(printf '%%%02X' "'$c") ;;
    esac
  done
  printf '%s' "$out"
}

PG_HOST="${PG_HOST:-postgres-service}"
PG_SHARD1_HOST="${PG_SHARD1_HOST:-postgres-shard-1-service}"
PG_PORT="${PG_PORT:-5432}"
u="$(urlencode "$(get POSTGRES_USER)")"
p="$(urlencode "$(get POSTGRES_PASSWORD)")"
db="$(get POSTGRES_DB)"
url0="postgresql://${u}:${p}@${PG_HOST}:${PG_PORT}/${db}?schema=public"
url1="postgresql://${u}:${p}@${PG_SHARD1_HOST}:${PG_PORT}/${db}?schema=public"

# --- temp env files (0600, removed on exit) --------------------------------
umask 077
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

{
  printf 'POSTGRES_USER=%s\n'        "$(get POSTGRES_USER)"
  printf 'POSTGRES_PASSWORD=%s\n'    "$(get POSTGRES_PASSWORD)"
  printf 'POSTGRES_DB=%s\n'          "$db"
  printf 'DATABASE_URL=%s\n'         "$url0"
  printf 'DATABASE_URL_SHARD_0=%s\n' "$url0"
  printf 'DATABASE_URL_SHARD_1=%s\n' "$url1"
} > "$TMP/postgres.env"
printf 'JWT_SECRET=%s\n' "$(get JWT_SECRET)" > "$TMP/server.env"
{
  printf 'GROQ_API_KEY=%s\n'      "$(get GROQ_API_KEY)"
  printf 'ABUSEIPDB_API_KEY=%s\n' "$(get ABUSEIPDB_API_KEY)"
  printf 'OTX_API_KEY=%s\n'       "$(get OTX_API_KEY)"
} > "$TMP/security.env"

# --- apply -----------------------------------------------------------------
ctx="$("${KC[@]}" config current-context 2>/dev/null || echo '?')"
echo "kubectl context: $ctx   namespace: $NS"

if ! "${KC[@]}" get namespace "$NS" >/dev/null 2>&1; then
  echo "namespace $NS does not exist; creating it from k8s/namespace.yaml"
  "${KC[@]}" apply -f "$K8S_DIR/namespace.yaml" >/dev/null
fi

apply_secret() {   # name envfile
  "${KC[@]}" -n "$NS" create secret generic "$1" \
      --from-env-file="$2" --dry-run=client -o yaml \
    | "${KC[@]}" apply -f - >/dev/null
  echo "secret/$1 applied in namespace $NS (keys: $(cut -d= -f1 "$2" | paste -sd, -))"
}

apply_secret postgres-secret "$TMP/postgres.env"
apply_secret server-secret   "$TMP/server.env"
apply_secret security-secret "$TMP/security.env"

echo "done. Pods that already run must be restarted to pick up new values:"
echo "  ${KC[*]} -n $NS rollout restart deploy/server"
