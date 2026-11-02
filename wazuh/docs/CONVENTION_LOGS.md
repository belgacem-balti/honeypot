# Convention des logs des honeypots

Convention partagée entre le bloc honeypots (K8s) et le bloc Wazuh.

## Emplacement

```
/var/log/honeypotx/<honeypot>/<fichier>.json
```

- `<honeypot>` : nom court en minuscules (`cowrie`, `web`, `ftp`, `smb`…).
- Sur le nœud, le dossier est un `hostPath` (`type: DirectoryOrCreate`) monté dans le pod.
- Avec minikube (driver docker), `/var/log/honeypotx` est partagé avec la VM par
  `minikube mount ... --uid=999 --gid=999` (`systemd/honeypotx-mount.service`).
  L'agent Wazuh lit les fichiers côté VM.

## Format

- Une ligne = un événement JSON complet (JSON Lines), encodage UTF-8.
- Champs recommandés : `timestamp` (ISO 8601 UTC), `eventid`, `src_ip`, `src_port`,
  `dst_ip`, `dst_port`, `protocol`, `session`, `sensor`.
- Cowrie respecte déjà ce format (`cowrie.json`, `eventid` = `cowrie.*`).

## Rotation et rétention

- Le fichier actif garde un nom fixe (ex. `cowrie.json`) : c'est lui que l'agent Wazuh suit.
- Les fichiers tournés sont nommés `<fichier>.json.AAAA-MM-JJ`.
- `systemd/honeypotx-retention.timer` : gzip après 1 jour, suppression après 7 jours.

## Ajouter un honeypot

1. Écrire dans `/var/log/honeypotx/<honeypot>/<honeypot>.json` (hostPath).
2. Vérifier que le fichier est lisible depuis la VM (`ls -l`), droits 644 ou 664.
3. Ajouter un `<localfile>` json dans `/var/ossec/etc/shared/honeypots/agent.conf` sur le manager.
4. Ajouter les règles dans une plage d'IDs dédiée (Cowrie : 100100-100199).
