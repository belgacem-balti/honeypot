# Wazuh detection for TaskFlow

Wazuh watches the TaskFlow server logs and raises alerts for SQL injection,
XSS, brute force and access to the honeypot's sensitive routes, each mapped to
MITRE ATT&CK.

```
kind cluster                                       host (Docker)
┌───────────────────────────────────────────┐      ┌──────────────────────────┐
│ honeypot-*/server pod -> stdout (JSON)     │      │ wazuh.manager 4.14.10    │
│        │ container runtime                │      │  decoders + rules        │
│        ▼                                  │      │  alerts.json             │
│ /var/log/pods/... (hostPath, read-only)   │      │                          │
│        │                                  │ 1514 │                          │
│ security-monitoring/wazuh-agent DaemonSet ─┼─────►│ 172.18.0.100 ("kind" net) │
└───────────────────────────────────────────┘ 1515 └──────────────────────────┘
```

| File | Content |
|------|---------|
| `docker-compose.yml` | Wazuh manager, single node, outside the cluster, on the `kind` Docker network |
| `config/enable-authd-password.sh` | Makes agent enrollment require a password (image default: no password) |
| `rules/taskflow_decoders.xml` | Strips the CRI prefix of `/var/log/pods` lines, decodes the JSON |
| `rules/taskflow_rules.xml` | Rules 100100-100145 with MITRE ATT&CK IDs |
| `../k8s/50-wazuh-agent.yaml` | Agent DaemonSet in `security-monitoring` |
| `../k8s/41-networkpolicies-monitoring.yaml` | Agent egress limited to the manager on 1514/1515 |

## Status: the server does not log JSON yet

Today the server only prints `Server is running on port 5000`. **No rule can
fire until the server writes the log format below.** Logging is Koussay's area,
so the middleware further down is a proposal, not applied.

## Expected log format

One JSON object per line on stdout. `app` must be the first key: the decoder
looks for `{"app":"taskflow-server"` at the start of the JSON (spaces allowed).

HTTP request (one line per request, written when the response finishes):

```json
{"app":"taskflow-server","type":"http","timestamp":"2026-11-11T10:00:00.000Z","method":"GET","path":"/api/search","query":"q=' OR 1=1 --","http_status":500,"srcip":"10.244.1.7","user_agent":"sqlmap/1.8","duration_ms":12,"user_id":null}
```

Authentication event:

```json
{"app":"taskflow-server","type":"auth","timestamp":"2026-11-11T10:00:01.000Z","event":"login_failed","email":"alice@example.com","srcip":"10.244.1.7"}
```

| Field | Type | Notes |
|-------|------|-------|
| `app` | string | always `taskflow-server`, first key |
| `type` | string | `http` or `auth` |
| `timestamp` | string | ISO 8601 UTC |
| `method`, `path` | string | path without the query string |
| `query` | string | URL-decoded query string, truncated to 1024 characters |
| `body` | string | JSON body, **only** for task routes (`/api/tasks*`), sensitive keys redacted, truncated to 1024 characters |
| `http_status` | number | not `status`: Wazuh reserves that name |
| `srcip` | string | client IP; Wazuh's static field, used by `same_source_ip` |
| `event` | string | `login_failed`, `login_success` (auth only) |
| `email` | string | login attempted (auth only); not `user`, which Wazuh reserves |
| `user_agent`, `duration_ms`, `user_id` | | context only |

Never log passwords, tokens, the `Authorization` header or cookies.

## Rules and MITRE ATT&CK

| Rule | Level | Detects | Where in TaskFlow | ATT&CK |
|------|-------|---------|-------------------|--------|
| 100110 | 10 | SQL injection in query string | `GET /api/search?q=`, `GET /api/admin/search?q=` (`$queryRawUnsafe`) | T1190 Exploit Public-Facing Application |
| 100111 | 10 | SQL injection in body | task routes | T1190 |
| 100112 | 12 | SQL injection answered with HTTP 500 (DB error leaked) | same | T1190 |
| 100120 | 8 | XSS payload in query string | any route | T1189 Drive-by Compromise, T1059.007 JavaScript |
| 100121 | 10 | Stored XSS in body | task title/description, rendered with `dangerouslySetInnerHTML` | T1189, T1059.007 |
| 100130 | 5 | Failed login | `POST /api/auth/login` | T1110 Brute Force |
| 100131 | 10 | 8 failed logins in 120 s from one IP | same | T1110.001 Password Guessing |
| 100140 | 8 | `/api/debug` accessed | system/env info | T1082 System Information Discovery |
| 100141 | 10 | `/api/config` accessed | configuration and secrets | T1552 Unsecured Credentials |
| 100142 | 10 | `/api/backup/users` accessed | user dump | T1213 Data from Information Repositories |
| 100143 | 12 | `/api/backup/users` returned 200 | users and hashes exposed | T1213 |
| 100145 | 12 | 3 sensitive routes in 300 s from one IP | reconnaissance | T1595.003 Wordlist Scanning |

The routes in `server/src/routes/vulnerable.js` (`/api/vulnerable/*`) are not
mounted in `app.js`, so no rule targets them.

## Deployment

Prerequisites: the kind cluster from `scripts/kind-up.sh` (it creates the
`kind` Docker network) and `k8s/00-namespaces.yaml` applied.

```bash
# 1. Check the kind network subnet; WAZUH_MANAGER_IP must be inside it
docker network inspect kind -f '{{(index .IPAM.Config 0).Subnet}}'

# 2. Secrets for the manager (wazuh/.env is git-ignored; FAKE- values for the lab)
#    The API password must have upper/lower case, digit and symbol, 8+ characters.
cat > wazuh/.env <<'EOF'
WAZUH_REGISTRATION_PASSWORD=FAKE-wazuh-enrollment-password
WAZUH_API_PASSWORD=FAKE-Api-Passw0rd.
EOF

# 3. Manager
docker compose -f wazuh/docker-compose.yml up -d
docker compose -f wazuh/docker-compose.yml logs -f wazuh.manager   # wait for "wazuh-analysisd ... started"

# 4. Agent (same enrollment password as the manager)
kubectl -n security-monitoring create secret generic wazuh-agent-enrollment \
  --from-literal=WAZUH_REGISTRATION_PASSWORD='FAKE-wazuh-enrollment-password'
kubectl apply -f k8s/41-networkpolicies-monitoring.yaml
kubectl apply -f k8s/50-wazuh-agent.yaml
kubectl -n security-monitoring rollout status daemonset/wazuh-agent

# 5. Agents registered on the manager
docker exec $(docker compose -f wazuh/docker-compose.yml ps -q wazuh.manager) /var/ossec/bin/agent_control -l
```

If you change `WAZUH_MANAGER_IP`, update `WAZUH_MANAGER_SERVER` in
`k8s/50-wazuh-agent.yaml` and narrow the `ipBlock` in
`k8s/41-networkpolicies-monitoring.yaml` to `<ip>/32`.

## Testing the rules

`wazuh-logtest` runs the decoders and rules on a line without any agent:

```bash
M=$(docker compose -f wazuh/docker-compose.yml ps -q wazuh.manager)
docker exec -it "$M" /var/ossec/bin/wazuh-logtest
# paste a line, for example (CRI prefix as read from /var/log/pods):
2026-11-11T10:00:00.000000000Z stdout F {"app":"taskflow-server","type":"http","method":"GET","path":"/api/search","query":"q=' UNION SELECT email,password FROM \"User\" --","http_status":500,"srcip":"10.244.1.7"}
# expected: decoder taskflow-server, rule 100112 (level 12), mitre T1190
```

End-to-end, once the server logs JSON:

```bash
curl -s -H 'Host: taskflow.localhost' "http://127.0.0.1/api/search?q=%27%20OR%201%3D1%20--"
curl -s -H 'Host: taskflow.localhost' http://127.0.0.1/api/config >/dev/null
docker exec "$M" tail -n 5 /var/ossec/logs/alerts/alerts.json
```

## Proposed JSON logging middleware (not applied)

For Koussay to review. It writes the format above without new dependencies.
The file would be `server/src/middleware/jsonLogger.js`, registered in
`server/src/app.js` right after `express.json()`:
`app.use(require('./middleware/jsonLogger').httpLogger);`

```js
const SENSITIVE_KEYS = /pass(word)?|token|secret|authorization|cookie/i;
const MAX = 1024;

function write(entry) {
  process.stdout.write(JSON.stringify({ app: 'taskflow-server', ...entry }) + '\n');
}

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) =>
    [k, SENSITIVE_KEYS.test(k) ? '[REDACTED]' : redact(v)]));
}

function clip(text) {
  return text && text.length > MAX ? text.slice(0, MAX) : text;
}

function httpLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const [path, rawQuery = ''] = req.originalUrl.split('?');
    let query = rawQuery;
    try { query = decodeURIComponent(rawQuery.replace(/\+/g, ' ')); } catch (_e) { /* keep raw */ }
    write({
      type: 'http',
      timestamp: new Date().toISOString(),
      method: req.method,
      path,
      query: clip(query),
      body: path.startsWith('/api/tasks') && req.body ? clip(JSON.stringify(redact(req.body))) : undefined,
      http_status: res.statusCode,
      srcip: req.ip,
      user_agent: req.get('user-agent'),
      duration_ms: Number(process.hrtime.bigint() - start) / 1e6,
      user_id: req.user ? req.user.id : null
    });
  });
  next();
}

function authEvent(event, req, email) {
  write({ type: 'auth', timestamp: new Date().toISOString(), event, email, srcip: req.ip });
}

module.exports = { httpLogger, authEvent };
```

In `authController.login`, call `authEvent('login_failed', req, email)` on
invalid credentials and `authEvent('login_success', req, email)` on success.

Two points to settle with the owner of the server:

- Behind ingress-nginx and the client nginx, `req.ip` is the proxy address.
  `app.set('trust proxy', 2)` makes Express read `X-Forwarded-For`, which only
  makes sense if the server is reachable through those proxies alone. The
  NetworkPolicies guarantee that in the cluster.
- `query` and `body` keep attacker-controlled text on purpose, because that is
  what the rules match. They are clipped and redacted, and never contain
  credentials.

## Known limits

- **No indexer or dashboard.** Alerts are in `alerts.json` on the manager. The
  official single-node stack (`wazuh-docker`, tag `v4.14.10`, folder
  `single-node/`) adds indexer and dashboard, with generated certificates.
- **The agent runs as root** with 6 capabilities and a writable root
  filesystem, because the image's init requires it. Its namespace is therefore
  privileged; the agent is still not privileged, has no hostNetwork and no API
  token, and only mounts `/var/log/pods` read-only.
- **Network path.** Agent traffic leaves the node with SNAT to the node
  address on the `kind` network. This works because the manager is on the same
  Docker network; a remote manager would need routing and TLS considerations.
- **Detection by pattern.** The SQLi/XSS regexes catch common payloads, not
  every encoding. A blocked request (WAF, validation) still raises an alert:
  these are attempt alerts, not proof of compromise.
