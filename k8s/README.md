# TaskFlow on Kubernetes (kind)

Manifests for running the TaskFlow honeypot on a local kind cluster with
Pod Security Admission and NetworkPolicies. The application manifests have no
`namespace:` field: apply them to `honeypot-vuln` or `honeypot-fixed` with `-n`.

| File | Content |
|------|---------|
| `kind-config.yaml` | kind cluster, default CNI disabled (Calico installed by `scripts/kind-up.sh`) |
| `00-namespaces.yaml` | `honeypot-vuln`, `honeypot-fixed` (PSA restricted), `security-monitoring` |
| `10-postgres.yaml` | PostgreSQL 16 (UID 999), PVC, Service `postgres:5432` |
| `20-server.yaml` | API server (UID 1001), Service `server:5000` |
| `30-client.yaml` | nginx-unprivileged (UID 101), Service `client:8080`, Ingress `taskflow.localhost` |

## Images

### Local images (default)

The manifests use `taskflow-server:local` and `taskflow-client:local` with
`imagePullPolicy: IfNotPresent`. Build them from the hardened Dockerfiles and
load them into the kind nodes:

```bash
docker build -f server/Dockerfile.hardened -t taskflow-server:local server
docker build -f client/Dockerfile.hardened -t taskflow-client:local client
kind load docker-image taskflow-server:local taskflow-client:local --name honeypot
```

After a rebuild, load the image again and restart the Deployment
(`kubectl -n <ns> rollout restart deployment/server`), because the tag does not change.

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
kubectl -n honeypot-fixed set image deployment/server server=ghcr.io/belgacem-balti/taskflow-server:${SHA}
kubectl -n honeypot-fixed set image deployment/client client=ghcr.io/belgacem-balti/taskflow-client:${SHA}
```

To make the change permanent, replace the `image:` lines in `20-server.yaml` and
`30-client.yaml` with the same references. For immutability, use the digest
(`ghcr.io/...@sha256:...`, shown on the GHCR package page) instead of the tag.
Images built before that commit run nginx as root on port 80: Pod Security
`restricted` rejects them.

## Secrets and schema

Secrets are never committed. Create them with `kubectl` (example values are
fictitious and must start with `FAKE-`):

```bash
NS=honeypot-fixed
kubectl -n $NS create secret generic postgres-credentials \
  --from-literal=POSTGRES_PASSWORD='FAKE-postgres-password'
kubectl -n $NS create secret generic server-secrets \
  --from-literal=DATABASE_URL='postgresql://postgres:FAKE-postgres-password@postgres:5432/taskflow' \
  --from-literal=JWT_SECRET='FAKE-jwt-secret-change-me'
```

The hardened server image does not contain the Prisma CLI, so the schema is
loaded by the postgres entrypoint the first time the volume is initialised:

```bash
kubectl -n $NS create configmap taskflow-schema \
  --from-file=server/prisma/migrations/20261003185324_init/migration.sql
```

This ConfigMap must exist before the first postgres start. If the PVC was
already initialised without it, delete the PVC and recreate the Deployment.

## Deploy

```bash
scripts/kind-up.sh
kubectl apply -f k8s/00-namespaces.yaml
# secrets + configmap (above), then:
kubectl -n honeypot-fixed apply -f k8s/10-postgres.yaml -f k8s/20-server.yaml -f k8s/30-client.yaml
for d in postgres server client; do kubectl -n honeypot-fixed rollout status deployment/$d --timeout=180s; done
curl -i http://taskflow.localhost/api/health
```

To deploy the second variant next to the first one, change the Ingress host,
for example to `vuln.taskflow.localhost`, before applying `30-client.yaml` to `honeypot-vuln`.
