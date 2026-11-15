#!/usr/bin/env bash
# Create/update the Kubernetes Secrets used by the k8s/ stack from a local .env.
#
# WARNING: this script targets the UPSTREAM stack in k8s/ (k8s/kustomization.yaml,
# namespace "honeypot"). It does NOT apply to the hardened Minikube stack in
# k8s/minikube/ (namespace "honeypot-decoy", Secret "decoy-secrets"), which keeps
# its own secrets procedure: see k8s/minikube/README.md and k8s/minikube/secrets.example.env.
#
#   scripts/create-k8s-secrets.sh [--namespace <ns>] [--dry-run] [path/to/.env]
#
# Options:
#   --namespace <ns>  target namespace (default: the one in k8s/kustomization.yaml,
#                     fallback k8s/namespace.yaml). The namespace must already exist,
#                     except the default one, which is created from k8s/namespace.yaml.
#   --dry-run         print only the Secret NAMES and KEY names that would be created.
#                     Never prints values and never calls kubectl.
#   -h, --help        show this help.
#
# - Reads .env as plain KEY=VALUE lines (it is never sourced/executed).
# - Creates postgres-secret, server-secret and security-secret with
#   `kubectl create secret generic --from-env-file ... --dry-run=client -o yaml | kubectl apply -f -`.
# - NEVER prints secret values: they only travel through 0600 temp files and a pipe.
#
# Environment overrides:
#   KUBECTL       kubectl command (default: "minikube kubectl --" if minikube exists, else "kubectl")
#   NAMESPACE     same as --namespace (the option wins)
#   PG_HOST       primary Postgres Service   (default: postgres-service)
#   PG_SHARD1_HOST shard-1 Postgres Service  (default: postgres-shard-1-service)
#   PG_PORT       (default: 5432)
set -euo pipefail
set +x   # never trace: tracing would print values

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="$REPO_ROOT/k8s"

die() { echo "error: $*" >&2; exit 1; }
usage() { sed -n '2,/^set -euo/{/^set -euo/d;s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; }

cat >&2 <<'WARN'
WARNING: this script targets the upstream stack in k8s/ (namespace "honeypot" by default).
         It is NOT for k8s/minikube/ (namespace "honeypot-decoy", Secret "decoy-secrets"):
         that stack has its own procedure, see k8s/minikube/README.md.
WARN

# --- arguments -------------------------------------------------------------
DRY_RUN=0
NS_OPT=""
ENV_FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --namespace)   [ $# -ge 2 ] && [ -n "$2" ] || die "--namespace needs a value"; NS_OPT="$2"; shift 2 ;;
    --namespace=*) NS_OPT="${1#*=}"; [ -n "$NS_OPT" ] || die "--namespace needs a value"; shift ;;
    --dry-run)     DRY_RUN=1; shift ;;
    -h|--help)     usage; exit 0 ;;
    --)            shift; [ $# -gt 0 ] && { ENV_FILE="$1"; shift; }; [ $# -eq 0 ] || die "too many arguments"; break ;;
    -*)            die "unknown option: $1 (see --help)" ;;
    *)             [ -z "$ENV_FILE" ] || die "too many arguments"; ENV_FILE="$1"; shift ;;
  esac
done
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

if [ "$DRY_RUN" -eq 0 ]; then
  [ -f "$ENV_FILE" ] || die "$ENV_FILE not found. Copy .env.example to .env and fill it in."
fi

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
DEFAULT_NS="$(detect_ns)"
NS="${NS_OPT:-${NAMESPACE:-$DEFAULT_NS}}"
[ -n "$NS" ] || die "could not detect the namespace; use --namespace <ns>"
[[ "$NS" =~ ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$ ]] || die "invalid namespace name: $NS"
if [ "$NS" = "honeypot-decoy" ]; then
  die "honeypot-decoy belongs to k8s/minikube/, which uses its own Secret (decoy-secrets). See k8s/minikube/README.md."
fi

# Secret names and key names (no values). Single source of truth for both modes.
SECRET_NAMES=(postgres-secret server-secret security-secret)
declare -A SECRET_KEYS=(
  [postgres-secret]="POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL DATABASE_URL_SHARD_0 DATABASE_URL_SHARD_1"
  [server-secret]="JWT_SECRET"
  [security-secret]="GROQ_API_KEY ABUSEIPDB_API_KEY OTX_API_KEY"
)

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run: nothing is sent to the cluster, no values are printed."
  echo "namespace: $NS"
  for name in "${SECRET_NAMES[@]}"; do
    echo "secret/$name  keys: $(tr ' ' ',' <<<"${SECRET_KEYS[$name]}")"
  done
  [ -f "$ENV_FILE" ] || { echo "note: $ENV_FILE not found; .env checks skipped." >&2; exit 0; }
fi

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

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run: $ENV_FILE passed the checks."
  exit 0
fi

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
  # k8s/namespace.yaml only defines the default namespace; never use it for another one.
  [ "$NS" = "$DEFAULT_NS" ] || die "namespace $NS does not exist; create it first."
  echo "namespace $NS does not exist; creating it from k8s/namespace.yaml"
  "${KC[@]}" apply -f "$K8S_DIR/namespace.yaml" >/dev/null
fi

apply_secret() {   # name envfile
  "${KC[@]}" -n "$NS" create secret generic "$1" \
      --from-env-file="$2" --dry-run=client -o yaml \
    | "${KC[@]}" apply -f - >/dev/null
  echo "secret/$1 applied in namespace $NS (keys: $(cut -d= -f1 "$2" | paste -sd, -))"
}

for name in "${SECRET_NAMES[@]}"; do
  f="$TMP/${name%-secret}.env"
  # guard: the temp file must hold exactly the declared keys
  [ "$(cut -d= -f1 "$f" | paste -sd' ' -)" = "${SECRET_KEYS[$name]}" ] || die "internal: key mismatch for $name"
  apply_secret "$name" "$f"
done

echo "done. Pods that already run must be restarted to pick up new values:"
echo "  ${KC[*]} -n $NS rollout restart deploy/server"
