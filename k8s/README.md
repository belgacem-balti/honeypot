# TaskFlow on Kubernetes (kind)

Manifests for running the TaskFlow honeypot on a local kind cluster with
Pod Security Admission, a ResourceQuota and default-deny NetworkPolicies
enforced by Calico.

The application manifests have no `namespace:` field: apply them to
`honeypot-vuln` or `honeypot-fixed` with `-n`. Only `00-namespaces.yaml` and
`41-networkpolicies-monitoring.yaml` set their namespace explicitly.

| File | Content |
|------|---------|
| `kind-config.yaml` | kind cluster (1 control-plane, 1 worker), default CNI disabled, ports 80/443 for the Ingress |
| `00-namespaces.yaml` | `honeypot-vuln`, `honeypot-fixed` (PSA restricted), `security-monitoring` (privileged, documented exception) |
| `05-resourcequota.yaml` | Quota on requests/limits: pods without limits are rejected |
| `10-postgres.yaml` | PostgreSQL 16 (UID 999), PVC, Service `postgres:5432` |
| `20-server.yaml` | API server (UID 1001), Service `server:5000` |
| `30-client.yaml` | nginx-unprivileged (UID 101), Service `client:8080`, Ingress `taskflow.localhost` |
| `40-networkpolicies.yaml` | Default deny, DNS, Ingress -> client -> server -> postgres, quarantine |
| `41-networkpolicies-monitoring.yaml` | Same model for `security-monitoring`: Wazuh agent -> manager 1514/1515 |
| `50-wazuh-agent.yaml` | Wazuh agent DaemonSet in `security-monitoring` (setup in `wazuh/README.md`) |

`kubernetes-secrets.yaml` at the repository root is a deliberately insecure
teaching target (secrets in clear). It is not part of this deployment and must
not be applied.

## Prerequisites

- Docker (Docker Desktop on Windows/macOS) running
- [kind](https://kind.sigs.k8s.io/) >= 0.27 and `kubectl`
- `curl`, `bash` (Git Bash works on Windows)

## Deployment order

The order matters: the namespaces carry the Pod Security labels, the quota
must exist before the pods, and Secrets/ConfigMap must exist before postgres
and the server start.

```bash
# 1. Cluster, Calico, ingress-nginx
scripts/kind-up.sh

# 2. Namespaces (Pod Security labels)
kubectl apply -f k8s/00-namespaces.yaml

# 3. Images (see "Images" below)
docker build -f server/Dockerfile.hardened -t taskflow-server:local server
docker build -f client/Dockerfile.hardened -t taskflow-client:local client
kind load docker-image taskflow-server:local taskflow-client:local --name honeypot

# 4. Per application namespace
NS=honeypot-fixed
kubectl -n $NS apply -f k8s/05-resourcequota.yaml
# 4a. Secrets and schema ConfigMap (see "Secrets" below)
# 4b. Network policies, then workloads
kubectl -n $NS apply -f k8s/40-networkpolicies.yaml
kubectl -n $NS apply -f k8s/10-postgres.yaml -f k8s/20-server.yaml -f k8s/30-client.yaml
for d in postgres server client; do kubectl -n $NS rollout status deployment/$d --timeout=180s; done

# 5. Monitoring namespace policies (before the Wazuh agent)
kubectl apply -f k8s/41-networkpolicies-monitoring.yaml

# 6. Smoke test
curl -i -H 'Host: taskflow.localhost' http://127.0.0.1/api/health
```

Applying the NetworkPolicies before the workloads means no pod ever runs
without them.

### Second variant

ingress-nginx rejects the same host/path in two namespaces. To deploy
`honeypot-vuln` next to `honeypot-fixed`, repeat step 4 with `NS=honeypot-vuln`
and change the Ingress host:

```bash
sed 's/host: taskflow.localhost/host: vuln.taskflow.localhost/' k8s/30-client.yaml \
  | kubectl -n honeypot-vuln apply -f -
```

Then test it with `HOST=vuln.taskflow.localhost NS=honeypot-vuln scripts/k8s-tests.sh`.

## Secrets

Secrets are never committed. Create them with `kubectl` in each application
namespace. The values below are fictitious and start with `FAKE-`: replace them
for any shared environment.

```bash
NS=honeypot-fixed
kubectl -n $NS create secret generic postgres-credentials \
  --from-literal=POSTGRES_PASSWORD='FAKE-postgres-password'
kubectl -n $NS create secret generic server-secrets \
  --from-literal=DATABASE_URL='postgresql://postgres:FAKE-postgres-password@postgres:5432/taskflow' \
  --from-literal=JWT_SECRET='FAKE-jwt-secret-change-me'
```

| Secret | Key | Used by |
|--------|-----|---------|
| `postgres-credentials` | `POSTGRES_PASSWORD` | `10-postgres.yaml` |
| `server-secrets` | `DATABASE_URL`, `JWT_SECRET` | `20-server.yaml` |

The password in `DATABASE_URL` must match `POSTGRES_PASSWORD`. Postgres only
reads it when the volume is first initialised: changing it later requires
`ALTER USER` or deleting the PVC.

To rotate a value without deleting the Secret:

```bash
kubectl -n $NS create secret generic server-secrets \
  --from-literal=DATABASE_URL='...' --from-literal=JWT_SECRET='FAKE-new-value' \
  --dry-run=client -o yaml | kubectl -n $NS apply -f -
kubectl -n $NS rollout restart deployment/server
```

### Database schema

The hardened server image does not contain the Prisma CLI, so the schema is
loaded by the postgres entrypoint the first time the volume is initialised:

```bash
kubectl -n $NS create configmap taskflow-schema \
  --from-file=server/prisma/migrations/20261003185324_init/migration.sql
```

This ConfigMap must exist before the first postgres start. If the PVC was
already initialised without it, delete the Deployment and the PVC, then apply
`10-postgres.yaml` again.

## Images

### Local images (default)

The manifests use `taskflow-server:local` and `taskflow-client:local` with
`imagePullPolicy: IfNotPresent` (step 3 above). After a rebuild, load the image
again and restart the Deployment, because the tag does not change:

```bash
kind load docker-image taskflow-server:local --name honeypot
kubectl -n $NS rollout restart deployment/server
```

### Switching to GHCR images produced by CI

`.github/workflows/ci.yml` pushes, on every push to `main`/`develop`:

```
ghcr.io/belgacem-balti/taskflow-server:<commit sha>
ghcr.io/belgacem-balti/taskflow-client:<commit sha>
```

It also pushes `:latest`, which must not be used here. Pick the full SHA of a
commit that contains the non-root client (`fix(client): run nginx as non-root`,
or any later commit), check that the tag exists, then point the Deployments at it:

```bash
SHA=<full commit sha built by CI>
kubectl -n $NS set image deployment/server server=ghcr.io/belgacem-balti/taskflow-server:${SHA}
kubectl -n $NS set image deployment/client client=ghcr.io/belgacem-balti/taskflow-client:${SHA}
```

To make the change permanent, replace the `image:` lines in `20-server.yaml` and
`30-client.yaml` with the same references. For immutability, use the digest
(`ghcr.io/...@sha256:...`, shown on the GHCR package page) instead of the tag.
Images built before that commit run nginx as root on port 80: Pod Security
`restricted` rejects them.

## Tests

```bash
scripts/k8s-tests.sh                       # NS=honeypot-fixed by default
NS=honeypot-vuln HOST=vuln.taskflow.localhost scripts/k8s-tests.sh
```

The script prints one `OK`/`FAIL` line per check and exits non-zero if any
check fails.

| Type | Check |
|------|-------|
| Positive | `GET /` and `GET /api/health` through the Ingress return 200; server -> postgres:5432 |
| Network (negative) | client -> postgres:5432, client -> Internet, server -> Internet (1.1.1.1:443, 8.8.8.8:53) are blocked |
| Quarantine | a pod labelled `quarantine=true` can no longer reach the server, and can again once the label is removed |
| Admission (negative) | a root pod is rejected by Pod Security; a pod without limits is rejected by the quota |

Every negative network check is paired with a positive control from the same
pod, so a broken probe cannot pass as "blocked". Admission checks use
`--dry-run=server` and create nothing.

Useful manual checks:

```bash
kubectl get ns -L pod-security.kubernetes.io/enforce
kubectl -n $NS get networkpolicy
kubectl -n $NS describe resourcequota taskflow-quota
kubectl -n $NS get events --field-selector reason=FailedCreate
```

## Quarantine

To isolate a compromised pod while keeping it for forensics:

```bash
kubectl -n $NS label pod <pod-name> quarantine=true
```

All its ingress and egress traffic, DNS included, is dropped. Kubernetes
NetworkPolicies can only allow traffic and they add up, so a deny-only policy
would not cancel the existing allows. Instead, every allow policy excludes
`quarantine=true` pods. A Deployment pod that is relabelled is still counted by
its ReplicaSet, so no replacement is started; see `docs/runbook-incident.md`.

## Known limits

- **base64 is not encryption.** Anyone allowed to `get secrets` in the
  namespace reads the values (`kubectl get secret -o jsonpath=... | base64 -d`),
  and kind does not enable encryption at rest in etcd. For a real environment
  use Sealed Secrets, External Secrets or a vault, plus etcd encryption.
- **The controls contain, they do not fix.** The application is still
  vulnerable by design; the cluster limits what an attacker can do after an
  exploit (no Internet egress, no lateral move to the database, no API token,
  read-only filesystem).
- **Same images in both namespaces.** `honeypot-vuln` and `honeypot-fixed`
  run the same application images; only the deployment target differs.
- **`security-monitoring` is privileged.** The Wazuh agent needs `hostPath`
  to read node logs, which `baseline` and `restricted` forbid. Keep the
  namespace limited to the agent; `restricted` stays in audit/warn mode.
- **Wazuh egress uses a broad `ipBlock`** (`172.18.0.0/16`, the usual kind
  Docker network). Check it with
  `docker network inspect kind -f '{{(index .IPAM.Config 0).Subnet}}'` and narrow
  it to the manager address (`/32`).
- **Schema without Prisma history.** Loading `migration.sql` through the
  postgres entrypoint does not create the `_prisma_migrations` table; a later
  `prisma migrate deploy` would try to replay the migration.
- **No TLS on the Ingress**, and `taskflow.localhost` only resolves locally.
- **Redis is not deployed.** Without `REDIS_URL` the server uses its
  in-memory cache, which is per pod.
- **ingress-nginx** is used because it is the documented kind setup; the
  project was retired upstream in 2026, so pick another controller for anything
  beyond this lab.
- **Single replicas, no PodDisruptionBudget, no backup** of the PVC.
