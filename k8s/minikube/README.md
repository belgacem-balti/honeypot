# HoneypotX on Kubernetes (Minikube): Phase 1, isolated TaskFlow decoy

> **Scope:** local development and controlled security testing inside a VMware NAT VM.
> This is **not** a production honeypot. Exposing it to untrusted networks requires a
> separate security review (see [Known limitations](#known-limitations-and-remaining-work)).

## What is deployed

The repository currently implements one component: **TaskFlow**, a realistic task-management
web app with **deliberately injected vulnerabilities** (commit `e989808`) that acts as a
high-interaction web decoy.

```
 developer (127.0.0.1)            namespace: honeypot-decoy   (PSA: restricted, quota, default-deny)
        │ kubectl port-forward
        ▼
 ┌──────────────┐  :5000   ┌──────────────┐  :5432   ┌────────────────┐
 │ client       │ ───────► │ server       │ ───────► │ postgres-0     │──► PVC data-postgres-0 (1Gi)
 │ nginx :8080  │          │ Express API  │          │ PG 16, app role│
 │ React build  │          │ + Prisma     │          │ NOT superuser  │
 └──────────────┘          └──────────────┘          └────────────────┘
   egress: server only       egress: postgres only     egress: none
```

| Component | Kind | Image | Port | Requests → Limits |
|---|---|---|---|---|
| `client` | Deployment | `honeypotx/taskflow-client:0.1.0` (local build, nginx-unprivileged 1.30.5) | 8080 | 50m/32Mi → 200m/64Mi |
| `server` | Deployment (+ `migrate` initContainer) | `honeypotx/taskflow-server:0.1.0` (local build, node 22.23.3) | 5000 | 100m/128Mi → 500m/384Mi |
| `postgres` | StatefulSet + PVC | `postgres:16.15-alpine3.24@sha256:7218…80ea` | 5432 | 100m/256Mi → 500m/512Mi |

All Services are **ClusterIP**. There is no Ingress, NodePort or LoadBalancer, and the ResourceQuota
forbids NodePort and LoadBalancer Services in this namespace.

**Not implemented in the codebase (and therefore not deployed):** attack telemetry or event capture,
event ingestion, a message bus consumer, AI classification, threat intelligence enrichment, and
SIEM/SOC export. `RABBITMQ_URL`, `REDIS_URL` and `NODE_ROLE` appear only in `server/.env.example`.
The Redis-backed notification code (`server/src/config/redis.js`) is not wired up: its routes are not
mounted and `ioredis` is not a dependency.

## Layout

```
k8s/minikube/                  # this hardened Minikube setup (k8s/kustomization.yaml is upstream's separate stack)
  kustomization.yaml          # everything except the Secret
  secrets.example.env         # Secret key NAMES only
  base/namespace.yaml         # honeypot-decoy, Pod Security "restricted"
  base/limits.yaml            # ResourceQuota + LimitRange
  network-policies/           # default-deny + explicit allows
  postgres/                   # StatefulSet, Service, init script (creates taskflow_app role)
  server/                     # Deployment, Service "server", ConfigMap
  client/                     # Deployment, Service "client", nginx ConfigMap
server/Dockerfile.k8s         # k8s-only images; ./Dockerfile + docker-compose are unchanged
client/Dockerfile.k8s
```

## Prerequisites (verified on this VM)

- Minikube v1.39.0, profile `minikube`, docker driver, **containerd 2.3.4** runtime, Kubernetes v1.37.0, CNI **kindnet** (enforces NetworkPolicy through `kube-network-policies`).
- Use **`minikube kubectl --`** (v1.37). `/snap/bin/kubectl` is v1.35.9, which is outside the supported ±1 version skew.
- About 1 GB RAM of limits for this namespace (Minikube node: 3 GB / 2 CPU).

After a VM reboot the Minikube container does not restart by itself:

```bash
minikube start            # restarts the existing cluster; does NOT reset it
```

## Build the images

The runtime is containerd, so images built with host `docker build` are **not** visible to the cluster.
Build them inside Minikube instead:

```bash
cd ~/projects/honeypot
minikube image build -t honeypotx/taskflow-server:0.1.0 -f Dockerfile.k8s server/
minikube image build -t honeypotx/taskflow-client:0.1.0 -f Dockerfile.k8s client/
minikube image ls | grep honeypotx
```

The workloads use `imagePullPolicy: Never`. `honeypotx/...` resolves to Docker Hub, where that name
could belong to an unrelated third party, so pulling must never happen. When rebuilding, bump the tag
(e.g. `0.1.1`) in both the build command and the Deployment.

Base images are pinned by tag **and** digest in the Dockerfiles and the StatefulSet.

## Deploy

> **Use `apply -k k8s/minikube/`, never `apply -k k8s/`.** `k8s/kustomization.yaml` is upstream's
> separate stack (Ingress, RabbitMQ, Redis, HPA) and does not have this setup's isolation controls.

```bash
K="minikube kubectl --"

# 1. namespace + quota
$K apply -f k8s/minikube/base/namespace.yaml
$K apply -n honeypot-decoy -f k8s/minikube/base/limits.yaml

# 2. Secret: random values, never printed, never written to disk or Git
( su_pw=$(openssl rand -hex 24); app_pw=$(openssl rand -hex 24); jwt=$(openssl rand -hex 48)
  $K -n honeypot-decoy create secret generic decoy-secrets \
    --from-literal=postgres-superuser-password="$su_pw" \
    --from-literal=taskflow-app-password="$app_pw" \
    --from-literal=database-url="postgresql://taskflow_app:${app_pw}@postgres:5432/taskflow?schema=public" \
    --from-literal=jwt-secret="$jwt" \
    --dry-run=client -o yaml | $K apply -f - )

# 3. everything else (policies first, then postgres → server → client)
$K apply -k k8s/minikube/
$K -n honeypot-decoy rollout status sts/postgres
$K -n honeypot-decoy rollout status deploy/server
$K -n honeypot-decoy rollout status deploy/client
```

- **Start-up order:** the server's `migrate` initContainer runs `prisma migrate deploy` and retries
  with back-off until Postgres accepts connections. `migrate deploy` only applies pending migrations
  and never resets data.
- **Database init:** `postgres/init-configmap.yaml` runs only on an empty data directory. Changing
  `taskflow-app-password` in the Secret later does **not** change the role's password in an existing
  database.
- **Secrets:** Kubernetes Secrets are only base64-encoded and are **not encrypted at rest** by
  default. Anyone who can read Secrets in this namespace or the node's etcd can read them. These
  values are decoy-only on purpose: the app leaks `JWT_SECRET` and `DATABASE_URL` through
  `/api/debug` and `/api/config` by design. Never reuse real credentials here.

## Access (local only)

```bash
minikube kubectl -- -n honeypot-decoy port-forward --address 127.0.0.1 svc/client 18080:8080
# UI:  http://127.0.0.1:18080        API: http://127.0.0.1:18080/api/health
```

Port-forward binds to loopback only. Do not use `--address 0.0.0.0`.

## Verification performed (2026-10-14)

| Check | Result |
|---|---|
| Node Ready, system pods Running after restart | Verified |
| `postgres-0`, `server`, `client` Ready; PVC Bound | Verified |
| `prisma migrate deploy` applied `20261007144705_init`; rerun reports "No pending migrations" | Verified |
| `GET /api/health` through client → server; UI returns 200 | Verified |
| Register → login (JWT) → create task through the API | Verified |
| nginx rejects a 3 MB body with 413 | Verified |
| Decoy SQLi on `/api/search` is live (quote error, `' OR '1'='1`) | Verified |
| SQLi runs as `taskflow_app`, `is_superuser=off`; `pg_read_file` and `lo_import` → **permission denied**; stacked `COPY … TO PROGRAM` rejected | Verified |
| NetworkPolicy: client↛postgres, client↛internet, server↛kube-API, server↛internet, server↛client, postgres↛anything, `default` ns↛postgres/server; client→server, server→postgres, DNS allowed | Verified (12/12 expected outcomes) |
| Postgres pod deleted → data still present on the same PV | Verified |
| No NodePort/LoadBalancer/Ingress in the cluster | Verified |
| All pods non-root, read-only root FS, no SA token, no privilege escalation, PSA `restricted` | Verified |
| Generated secret values appear in no repo file | Verified |
| UI tested in a browser | Not tested (HTTP only) |
| Image vulnerability scan (Trivy) | Not tested |

To re-run the network checks:

```bash
K="minikube kubectl --"
$K -n honeypot-decoy exec deploy/client -- nc -z -w 4 postgres 5432     # must FAIL
$K -n honeypot-decoy exec deploy/server -- nc -z -w 4 10.96.0.1 443     # must FAIL (kube API)
$K -n honeypot-decoy exec deploy/server -- nc -z -w 4 1.1.1.1 443       # must FAIL (internet)
$K -n honeypot-decoy exec deploy/server -- nc -z -w 4 postgres 5432     # must SUCCEED
```

## Operations

```bash
K="minikube kubectl --"
$K get pods -A
$K -n honeypot-decoy get pods,svc,netpol,pvc
$K -n honeypot-decoy describe quota decoy-quota
$K -n honeypot-decoy logs deploy/server -c server
$K -n honeypot-decoy logs deploy/server -c migrate
$K -n honeypot-decoy logs postgres-0
$K -n honeypot-decoy describe pod <pod-name>
$K -n honeypot-decoy exec -it postgres-0 -- psql -U postgres -d taskflow
```

### Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `ErrImageNeverPull` | The image is not in the Minikube runtime. Rebuild with `minikube image build` (not `docker build`). |
| `migrate` initContainer restarting | Postgres is not ready yet (normal for a few seconds), or `database-url` does not match the role password. Check `logs … -c migrate`. |
| Pods rejected with `violates PodSecurity "restricted"` | The manifest lost a securityContext field. The namespace enforces `restricted`. |
| Pod `Pending` with `exceeded quota` | `decoy-quota` is full. Check `describe quota decoy-quota`. |
| All pods unreachable after `minikube start` | Wait for `coredns` and `storage-provisioner` to become Ready. They crash-loop briefly while the API server starts. |

### Cleanup

```bash
minikube kubectl -- delete -k k8s/minikube/   # deletes workloads, services, policies, namespace
```

Deleting the namespace also deletes the Secret and the PVC `data-postgres-0`. The decoy database
is then gone (the `standard` StorageClass reclaim policy is `Delete`). To keep the data, delete
only the workloads instead (`delete -n honeypot-decoy -f k8s/minikube/client/ -f k8s/minikube/server/ -f k8s/minikube/postgres/statefulset.yaml`).

## RabbitMQ status: deferred

The application does not use RabbitMQ, so no broker is deployed.

The cluster contains a partial **RabbitMQ Cluster Operator v2.23.0** install in `rabbitmq-system`,
applied earlier from `releases/latest`. Its pod was stuck in `ContainerCreating` with:

```
MountVolume.SetUp failed for volume "cluster-operator-webhook-certs" :
secret "cluster-operator-webhook-server-cert" not found
```

**Root cause (confirmed):** Cluster Operator 2.20+ requires **cert-manager** installed beforehand.
cert-manager was absent (no namespace, no `cert-manager.io` CRDs), so the manifest's `Certificate`
and `Issuer` were rejected and the webhook secret was never issued. The `RabbitmqCluster` CRD
itself is Established.

**Current state:** the operator Deployment is scaled to **0 replicas** (nothing deleted). Its
`cluster-operator-validating-webhook-configuration` (`failurePolicy: Fail`) only matches
`rabbitmqclusters` resources, so it affects nothing else. Namespace `messaging`, left over from
the removed Bitnami chart, is empty.

**When application code actually publishes or consumes events:**
1. Install a pinned cert-manager release (e.g. v1.21.x) and wait for `cert-manager-webhook` to be Ready.
2. Re-apply the **pinned** operator manifest `https://github.com/rabbitmq/cluster-operator/releases/download/v2.23.1/cluster-operator.yml` (never `latest`), so the Certificate and Issuer are created.
3. Verify that the webhook secret exists and the operator pod is Ready.
4. Create **one** single-node `RabbitmqCluster` (ClusterIP only; management UI through port-forward).

## Security notes

- This decoy is intentionally exploitable: SQL injection, unauthenticated `/api/admin/*` (including
  user deletion), and endpoints that leak secrets and password hashes. **Assume the server pod and
  everything in the `taskflow` database are attacker-controlled.**
- Containment relies on these controls, all verified:
  - a non-superuser DB role
  - default-deny NetworkPolicies, with no internet or kube-API egress
  - no ServiceAccount token
  - non-root, read-only root FS, all capabilities dropped
  - PSA `restricted`
  - a namespace quota
- Port-forwarded loopback access means the only "attacker" is you. Exposing the decoy to real
  attackers (NodePort, ingress, or VMware port mapping) is **out of scope** without a separate
  review covering:
  - ingress rate limiting
  - an egress-free node
  - log capture
  - legal and ethical considerations

## Known limitations and remaining work

1. **No attack telemetry.** The decoy records nothing about attackers beyond default nginx access
   logs. The missing interface is a structured JSON event per request: timestamp, source IP from
   `X-Forwarded-For`/`X-Real-IP`, method, path, query, a body excerpt or hash, user agent, matched
   decoy rule (e.g. `sqli:/api/search`) and response status. It should be written to stdout and
   collected by a log shipper, then handed to an ingestion API or message bus for normalisation,
   enrichment and SIEM export.
2. Ingestion, AI classification, threat intelligence enrichment and SOC/SIEM export: **not implemented.**
3. Image scanning (Trivy), dependency scanning and CI/CD: **not set up.**
4. The server process does not handle SIGTERM itself. `tini` forwards the signal and Node exits
   immediately; requests in flight may be cut.
5. `server/prisma/migrations/` is now un-ignored and must be committed for reproducible deployments.
