# Wazuh integration (SOC analysis)

```
 HONEYPOT VM (192.168.87.136)                                  WAZUH VM
 ┌───────────────────────────────────────────┐                 ┌───────────────────────┐
 │ server pod ─stdout JSON─► ship-logs.sh    │                 │ wazuh-manager         │
 │                            │              │  TCP 1514/1515  │  honeypot_rules.xml   │
 │  /var/log/honeypot/taskflow-events.json ──┼─► wazuh-agent ─►│  indexer + dashboard  │
 └───────────────────────────────────────────┘                 └───────────────────────┘
```

The server writes one JSON event per request (`server/src/middleware/telemetry.js`) with
`srcip`, `path`, `attack`, `severity`, captured `username`/`password` and payload.
`attack` is one of `sqli`, `xss`, `path_traversal`, `cmd_injection`, `scanner`, `recon`,
`user_enumeration`, `admin_access`, `account_takeover`, `data_exfiltration`, `auth_failure`,
`probe`, `none`.

## 0. Network check (honeypot VM)

Both VMs must reach each other (same VMware NAT network, or bridged).

```bash
WAZUH_IP=192.168.87.XXX          # IP of the Wazuh VM (`ip a` on it)
nc -zv $WAZUH_IP 1514 && nc -zv $WAZUH_IP 1515
```

If it fails: on the Wazuh VM `sudo ufw allow 1514/tcp && sudo ufw allow 1515/tcp`.

## 1. Install the Wazuh agent (honeypot VM)

The agent version must be **≤ the manager version** (`/var/ossec/bin/wazuh-control info` on the Wazuh VM).

```bash
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --dearmor -o /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" \
  | sudo tee /etc/apt/sources.list.d/wazuh.list
sudo apt update
sudo WAZUH_MANAGER="$WAZUH_IP" WAZUH_AGENT_NAME="honeypot-taskflow" apt install -y wazuh-agent
```

## 2. Tell the agent to read the honeypot log

```bash
sudo mkdir -p /var/log/honeypot && sudo chown $USER: /var/log/honeypot
sudo nano /var/ossec/etc/ossec.conf      # paste wazuh/agent-localfile.xml inside <ossec_config>
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent
```

## 3. Install the rules (Wazuh VM)

Copy `wazuh/honeypot_rules.xml` to the Wazuh VM, then:

```bash
sudo cp honeypot_rules.xml /var/ossec/etc/rules/
sudo chown wazuh:wazuh /var/ossec/etc/rules/honeypot_rules.xml
sudo chmod 660 /var/ossec/etc/rules/honeypot_rules.xml
sudo systemctl restart wazuh-manager
sudo /var/ossec/bin/agent_control -l    # honeypot-taskflow should be "Active"
```

## 4. Rebuild the server and start shipping logs (honeypot VM)

```bash
cd ~/projects/honeypot
minikube start
minikube image build -t honeypotx/taskflow-server:0.1.0 -f Dockerfile.k8s server/   # containerd: not `docker build`
minikube kubectl -- rollout restart deploy/server -n honeypot-decoy
./scripts/ship-logs.sh k8s &              # or: ./scripts/ship-logs.sh compose
```

To keep the shipper running across reboots, run it as a systemd user service.

## 5. Test end to end

```bash
minikube kubectl -- -n honeypot-decoy port-forward --address 127.0.0.1 svc/client 18080:8080 &
curl -s "http://127.0.0.1:18080/api/search?q='%20OR%201=1--" >/dev/null
curl -s http://127.0.0.1:18080/api/debug >/dev/null
curl -s -A sqlmap/1.7 http://127.0.0.1:18080/api/backup/users >/dev/null
for i in $(seq 7); do curl -s -XPOST -H 'content-type: application/json' \
  -d '{"email":"admin@taskflow.io","password":"pass'$i'"}' http://127.0.0.1:18080/api/auth/login >/dev/null; done
tail -n 3 /var/log/honeypot/taskflow-events.json
```

On the Wazuh VM, test a rule without traffic: `sudo /var/ossec/bin/wazuh-logtest`, then paste one line from the events file.
It should show `id: '100105'` for the SQLi line.

## 6. SOC analysis in the dashboard

**Threat Hunting** (or **Discover**, index `wazuh-alerts-*`), filter `rule.groups: honeypot`:

| Question | Query / visualisation |
|---|---|
| Who attacks the most? | Bar chart, terms on `data.srcip` |
| What kind of attacks? | Pie chart, terms on `data.attack` |
| Most dangerous alerts | `rule.groups: honeypot and rule.level >= 10` |
| Credentials attackers try | Table, `data.username` and `data.password` where `data.attack: auth_failure` |
| Attack tools used | Terms on `data.user_agent` |
| ATT&CK coverage | **MITRE ATT&CK** module, filter on agent `honeypot-taskflow` |
| Timeline per attacker | `data.srcip: "x.x.x.x"`, sort by `timestamp` |

Save these panels as a dashboard named "HoneypotX SOC".

| Rule | Level | Meaning |
|---|---|---|
| 100100 | 3 | Any request to the decoy |
| 100101 | 5 | 404 probe |
| 100102 / 100103 | 7 | Recon / scanner tool |
| 100104 | 5 | Failed login |
| 100106 / 100107 | 10 | XSS, traversal, cmd injection / admin or reset-password abuse |
| 100105 / 100108 | 12 | SQL injection / user DB dumped |
| 100110 | 10 | Brute force (6 failures in 2 min, same IP) |
| 100111 | 10 | Directory brute-force (20 404s in 1 min) |
| 100112 | 13 | SQLi campaign (3 in 5 min, same IP) |

Optional next step: Active Response (`firewall-drop`) on rule 100112. Keep it off while you test from your own IP.
