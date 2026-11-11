# Incident response runbook — TaskFlow on Kubernetes

Scope: a TaskFlow pod (client, server or postgres) in `honeypot-vuln` or
`honeypot-fixed` is suspected compromised, typically after a Wazuh alert.
Phases follow NIST SP 800-61: detect, contain, eradicate, recover, lessons
learned. Every phase has one owner; the owner may delegate, not skip.

## Roles

| Role | Person | Responsibilities |
|------|--------|------------------|
| Incident lead, Kubernetes and observability | Mariem Baraket | Triage, containment, evidence, cluster recovery |
| Application and logging | Koussay | Root cause in the code, fix, log changes |
| Repository and CI/CD | Belgacem Balti (to confirm) | Image rebuild, CI run, secret rotation in GitHub |
| Scribe | to assign | Timeline, commands run, decisions |

If the incident lead is unavailable, the first person who sees the alert
takes the role until handover.

## Severity

| Wazuh level | Examples (rule) | Severity | Target time to contain |
|-------------|-----------------|----------|------------------------|
| 12+ | SQLi with DB error (100112), user backup downloaded (100143), recon sweep (100145) | High | 15 min |
| 10 | SQLi attempt (100110/100111), stored XSS (100121), brute force (100131), `/api/config` (100141) | Medium | 1 h |
| 5–8 | Failed login (100130), `/api/debug` (100140), XSS in query (100120) | Low | Review same day |

This is a honeypot: attempts are expected. Escalate to High when an attack
**succeeds** (HTTP 200 on a sensitive route, DB error leaked, unknown process,
unexpected outbound connection attempt).

Common variables for the commands below:

```bash
NS=honeypot-fixed                                     # or honeypot-vuln
M=$(docker compose -f wazuh/docker-compose.yml ps -q wazuh.manager)
TS=$(date -u +%Y%m%dT%H%M%SZ)
EVIDENCE=incident-$TS && mkdir -p "$EVIDENCE"         # outside the git tree in real use
```

## 1. Detect — owner: incident lead

1. Read the alert and note rule ID, level, MITRE ID, source IP, path:

   ```bash
   docker exec "$M" tail -n 50 /var/ossec/logs/alerts/alerts.log
   docker exec "$M" grep -E '"id":"1001[0-9]{2}"' /var/ossec/logs/alerts/alerts.json | tail -n 20
   ```

2. Identify the pod that produced the log. The agent location in the alert
   (`/var/log/pods/<ns>_<pod>_<uid>/...`) gives namespace and pod name:

   ```bash
   kubectl -n $NS get pods -o wide -L quarantine
   POD=<pod name from the alert>
   ```

3. Confirm on the pod itself (the `grep` relies on the JSON log format of
   `wazuh/README.md`, which the server does not produce yet):

   ```bash
   kubectl -n $NS logs "$POD" --since=1h | grep -E '"path":"/api/(search|admin/search|config|debug|backup/users)"' | tail -n 20
   kubectl -n $NS get events --sort-by=.lastTimestamp | tail -n 20
   ```

4. Decide the severity (table above), open the timeline (scribe) with the
   alert time, detection time and the decision. Move to containment for
   Medium and High.

## 2. Contain — owner: incident lead

Goal: stop the attacker in seconds while keeping the pod for analysis.

1. **Isolate the pod** (all ingress and egress dropped, DNS included; see
   `k8s/40-networkpolicies.yaml`):

   ```bash
   kubectl -n $NS label pod "$POD" quarantine=true --overwrite
   ```

2. **Check the isolation** from a pod with the client labels, as in
   `scripts/k8s-tests.sh`:

   ```bash
   kubectl -n $NS get pod "$POD" -o jsonpath='{.metadata.labels.quarantine}{"\n"}'   # true
   kubectl -n $NS get networkpolicy quarantine-isolate default-deny-all
   ```

3. **Restore service without destroying evidence.** The quarantined pod still
   belongs to its ReplicaSet, so no replacement starts and, with one replica,
   the service is down. Detach it by changing its `app.kubernetes.io/name`
   label: the ReplicaSet starts a clean pod, the old one stays isolated (it is
   still `quarantine=true` and covered by `default-deny-all`) and leaves the
   Service:

   ```bash
   APP=$(kubectl -n $NS get pod "$POD" -o jsonpath='{.metadata.labels.app\.kubernetes\.io/name}')
   kubectl -n $NS label pod "$POD" app.kubernetes.io/name=quarantined-$APP taskflow/quarantined-from=$APP --overwrite
   kubectl -n $NS rollout status deployment/$APP --timeout=120s
   ```

   Skip this step for postgres if data integrity is in doubt: a new postgres
   pod would mount the same PVC.

4. **Block the source** when it is outside the cluster. There is no WAF; deny
   the IP on the Ingress (ingress-nginx annotation):

   ```bash
   kubectl -n $NS annotate ingress client \
     nginx.ingress.kubernetes.io/denylist-source-range=<attacker ip>/32 --overwrite
   ```

   On kind, traffic entering through the host port may be source-NATed, so the
   IP seen by ingress-nginx can be the Docker gateway: check
   `kubectl -n ingress-nginx logs deploy/ingress-nginx-controller` before
   blocking, or you may block everyone.

5. **Keep secrets from being reused** if the alert involves `/api/config`,
   `/api/debug`, SQLi with success or RCE: assume `JWT_SECRET` and the
   database password are known and go to eradication step 3 now.

Do **not** delete the pod or restart the Deployment at this stage: the
memory, `/tmp` and logs of the pod are evidence.

## 3. Eradicate — owner: application and logging (Koussay), with the incident lead

1. **Collect evidence** (incident lead) before anything is removed:

   ```bash
   kubectl -n $NS get pod "$POD" -o yaml                   > "$EVIDENCE/pod.yaml"
   kubectl -n $NS describe pod "$POD"                      > "$EVIDENCE/pod-describe.txt"
   kubectl -n $NS logs "$POD" --all-containers --timestamps > "$EVIDENCE/pod.log"
   kubectl -n $NS logs "$POD" --all-containers --previous  > "$EVIDENCE/pod-previous.log" 2>/dev/null
   kubectl -n $NS get pod "$POD" -o jsonpath='{.status.containerStatuses[*].imageID}' > "$EVIDENCE/image-digest.txt"
   kubectl -n $NS get events --sort-by=.lastTimestamp     > "$EVIDENCE/events.txt"
   kubectl -n $NS get networkpolicy -o yaml                > "$EVIDENCE/networkpolicies.yaml"
   docker exec "$M" cat /var/ossec/logs/alerts/alerts.json > "$EVIDENCE/wazuh-alerts.json"
   sha256sum "$EVIDENCE"/* > "$EVIDENCE/SHA256SUMS"
   ```

   Running processes and files, through the API (not the pod network), with a
   debug container that complies with Pod Security `restricted`:

   ```bash
   kubectl -n $NS exec "$POD" -- ps aux                    > "$EVIDENCE/ps.txt" 2>&1
   kubectl -n $NS exec "$POD" -- ls -la /tmp               > "$EVIDENCE/tmp.txt" 2>&1
   kubectl -n $NS debug "$POD" -it --image=busybox:1.36.1 --profile=restricted --target=$APP -- sh
   ```

2. **Find the root cause** (Koussay): map the Wazuh rule to the route
   (`wazuh/README.md`, rules table), reproduce in a local environment, write
   the fix and a test. Typical fixes: parameterised Prisma queries instead of
   `$queryRawUnsafe` (`/api/search`, `/api/admin/search`), output encoding
   instead of `dangerouslySetInnerHTML`, authentication on `/api/debug`,
   `/api/config`, `/api/backup/users`.

3. **Rotate exposed secrets** (incident lead in the cluster, repository owner
   in GitHub). Fictitious values shown; real values never go in tickets or git:

   ```bash
   # new JWT secret: invalidates every issued token
   kubectl -n $NS create secret generic server-secrets \
     --from-literal=DATABASE_URL='postgresql://postgres:FAKE-new-db-password@postgres:5432/taskflow' \
     --from-literal=JWT_SECRET='FAKE-new-jwt-secret' \
     --dry-run=client -o yaml | kubectl -n $NS apply -f -
   # database password: change it in postgres, then in its Secret
   kubectl -n $NS exec deploy/postgres -- psql -U postgres -d taskflow \
     -c "ALTER USER postgres WITH PASSWORD 'FAKE-new-db-password';"
   kubectl -n $NS create secret generic postgres-credentials \
     --from-literal=POSTGRES_PASSWORD='FAKE-new-db-password' \
     --dry-run=client -o yaml | kubectl -n $NS apply -f -
   ```

   Rotate the matching GitHub secrets (`JWT_SECRET`, `DATABASE_URL`,
   `POSTGRES_PASSWORD`) used by `deploy.yml`. If `/api/backup/users` returned
   200, user password hashes are exposed: force a password reset.

4. **Check for persistence and spread** (incident lead):

   ```bash
   kubectl get pods -A -o wide | grep -v -E 'kube-system|ingress-nginx|calico'
   kubectl -n $NS get deploy,rs,pods,svc,ingress,networkpolicy,secret,configmap
   kubectl -n $NS exec deploy/postgres -- psql -U postgres -d taskflow \
     -c 'SELECT id, email, "createdAt", "updatedAt" FROM "User" ORDER BY "updatedAt" DESC LIMIT 20;'
   ```

   Look for objects or users created during the incident window, and for
   other alerts from the same source IP in Wazuh.

5. **Remove the compromised pod** once the evidence is saved and hashed:

   ```bash
   kubectl -n $NS delete pod "$POD"
   ```

## 4. Recover — owner: repository and CI/CD (image), incident lead (cluster)

1. Merge the fix through a pull request; CI rebuilds and scans the images and
   pushes `ghcr.io/belgacem-balti/taskflow-{server,client}:<sha>`.
2. Deploy the fixed image by SHA (never `:latest`), see `k8s/README.md`:

   ```bash
   SHA=<full commit sha of the fix>
   kubectl -n $NS set image deployment/server server=ghcr.io/belgacem-balti/taskflow-server:${SHA}
   kubectl -n $NS rollout restart deployment/server     # also picks up the rotated Secrets
   kubectl -n $NS rollout status deployment/server --timeout=180s
   ```

3. Verify the security controls and the application:

   ```bash
   NS=$NS scripts/k8s-tests.sh
   curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: taskflow.localhost' "http://127.0.0.1/api/search?q=%27%20OR%201%3D1%20--"
   ```

   The injection must no longer return data or a database error, and Wazuh
   must still raise the attempt alert (100110), proving detection still works.

4. Remove the temporary IP block when it is no longer needed:

   ```bash
   kubectl -n $NS annotate ingress client nginx.ingress.kubernetes.io/denylist-source-range-
   ```

5. Watch Wazuh alerts for the source IP and the affected route for 24 hours,
   then close the incident.

## 5. Lessons learned — owner: incident lead, whole team

Within 5 working days, a blameless review. Write it in
`docs/incidents/<date>-<short-name>.md` with:

- **Timeline** (UTC): first malicious request, alert, detection, containment,
  fix deployed, closure.
- **Metrics**: time to detect (first request → alert), time to contain
  (alert → quarantine), time to recover (alert → fixed image in production).
- **Root cause**: the vulnerable code path and why tests and scanners
  (Semgrep, Trivy, ZAP) did or did not report it.
- **What worked / what did not**: alert quality, runbook steps, missing logs.
- **Actions**, each with an owner and a date, for example: new Wazuh rule,
  new test in `scripts/k8s-tests.sh`, Semgrep rule, NetworkPolicy change,
  runbook update.

## Quick reference

| Action | Command |
|--------|---------|
| Isolate a pod | `kubectl -n $NS label pod <pod> quarantine=true --overwrite` |
| Detach it from its Deployment | `kubectl -n $NS label pod <pod> app.kubernetes.io/name=quarantined-<app> --overwrite` |
| Release (false positive only) | `kubectl -n $NS label pod <pod> quarantine-` |
| List quarantined pods | `kubectl get pods -A -l quarantine=true` |
| Latest Wazuh alerts | `docker exec $M tail -n 50 /var/ossec/logs/alerts/alerts.log` |
| Test the controls | `NS=$NS scripts/k8s-tests.sh` |
