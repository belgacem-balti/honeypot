#!/usr/bin/env bash
# HoneypotX : déploiement de l'enrichissement MISP avec une liste de TEST, sur le manager Wazuh.
# Usage (sur le serveur) : sudo bash /tmp/honeypotx/apply_misp_test.sh
# Fichiers attendus à côté du script : honeypotx_rules.xml, misp_to_cdb.py,
#   test-misp-export.json, misp-samples.json
# Sécurité : sauvegarde avant toute modification ; restauration automatique si
#   wazuh-logtest échoue ou si wazuh-manager n'est pas active après le redémarrage.
set -euo pipefail

SRC=$(cd "$(dirname "$0")" && pwd)
OSSEC=${OSSEC:-/var/ossec}   # surchargeable uniquement pour les tests
TS=$(date +%F-%H%M%S)
BACKUP_DIR=${BACKUP_DIR:-/root}   # surchargeable uniquement pour les tests
BACKUP=$BACKUP_DIR/honeypotx-backup-$TS.tgz
LOG=$BACKUP_DIR/honeypotx-apply-$TS.log
LIST=$OSSEC/etc/lists/misp-ioc-ip
SCRIPT_DST=$OSSEC/integrations/misp_to_cdb.py
ANCHOR='<list>etc/lists/security-eventchannel</list>'
CREATED=()   # fichiers créés par ce script, supprimés en cas de restauration
CHANGED=0    # 1 dès qu'un fichier de /var/ossec a été modifié

exec > >(tee -a "$LOG") 2>&1
step() { echo; echo "=== $*"; }

restore() {
  echo "!!! RESTAURATION depuis $BACKUP"
  tar xzpf "$BACKUP" -C "$OSSEC/etc"
  for f in "${CREATED[@]}"; do rm -f "$f" && echo "supprimé : $f"; done
}

on_error() {
  local rc=$? line=$1
  echo "!!! Échec ligne $line (code $rc)"
  if [[ $CHANGED -eq 1 ]]; then restore; fi
  echo "Journal : $LOG"
  exit "$rc"
}
trap 'on_error $LINENO' ERR

# --- 0. Vérifications préalables (aucune modification) ---
step "0. Vérifications"
[[ $EUID -eq 0 ]] || { echo "Lancer avec sudo"; exit 1; }
for f in honeypotx_rules.xml misp_to_cdb.py test-misp-export.json misp-samples.json; do
  [[ -s $SRC/$f ]] || { echo "Fichier manquant : $SRC/$f"; exit 1; }
done
systemctl is-active --quiet wazuh-manager || { echo "wazuh-manager n'est pas active avant le début : arrêt"; exit 1; }
if ! grep -q 'etc/lists/misp-ioc-ip' "$OSSEC/etc/ossec.conf"; then
  grep -qF "$ANCHOR" "$OSSEC/etc/ossec.conf" || { echo "Ancre introuvable dans ossec.conf : $ANCHOR"; exit 1; }
fi
PY=$(command -v python3 || true)
[[ -n $PY ]] || PY=$OSSEC/framework/python/bin/python3
[[ -x $PY ]] || { echo "Aucun python3 trouvé"; exit 1; }
echo "Python : $PY ($($PY --version 2>&1))"
"$PY" -m py_compile "$SRC/misp_to_cdb.py"

# --- 1. Sauvegarde ---
step "1. Sauvegarde -> $BACKUP"
tar czpf "$BACKUP" -C "$OSSEC/etc" rules lists ossec.conf
tar tzf "$BACKUP" | grep -c . | xargs echo "fichiers sauvegardés :"

# --- 2. Script MISP ---
step "2. Installation de $SCRIPT_DST"
[[ -e $SCRIPT_DST ]] || CREATED+=("$SCRIPT_DST")
CHANGED=1
install -o root -g wazuh -m 750 "$SRC/misp_to_cdb.py" "$SCRIPT_DST"

# --- 3. Liste CDB de test ---
step "3. Liste de test $LIST"
[[ -e $LIST ]] || CREATED+=("$LIST")
rc=0; "$PY" "$SCRIPT_DST" --from-file "$SRC/test-misp-export.json" --output "$LIST" || rc=$?
[[ $rc -eq 0 || $rc -eq 2 ]] || { echo "misp_to_cdb.py a échoué (code $rc)"; false; }
ls -l "$LIST"; cat "$LIST"

# --- 4. ossec.conf ---
step "4. Déclaration de la liste dans ossec.conf"
if grep -q 'etc/lists/misp-ioc-ip' "$OSSEC/etc/ossec.conf"; then
  echo "déjà présente"
else
  sed -i "\|$ANCHOR|a\    <list>etc/lists/misp-ioc-ip</list>" "$OSSEC/etc/ossec.conf"
fi
grep -n '<list>' "$OSSEC/etc/ossec.conf"
[[ $(grep -c 'etc/lists/misp-ioc-ip' "$OSSEC/etc/ossec.conf") -eq 1 ]]

# --- 5. Règles ---
step "5. Règles $OSSEC/etc/rules/honeypotx_rules.xml"
install -o wazuh -g wazuh -m 660 "$SRC/honeypotx_rules.xml" "$OSSEC/etc/rules/honeypotx_rules.xml"
grep -c '<rule id=' "$OSSEC/etc/rules/honeypotx_rules.xml" | xargs echo "règles :"

# --- 6. wazuh-logtest ---
step "6. wazuh-logtest (3 lignes : 203.0.113.66, 192.0.2.45, 198.51.100.99)"
OUT=$(timeout 120 "$OSSEC/bin/wazuh-logtest" < "$SRC/misp-samples.json" 2>&1 || true)
grep -E "^\s+(id|level|description):|ERROR|CRITICAL|WARNING" <<<"$OUT" || true
if grep -qE "ERROR|CRITICAL" <<<"$OUT"; then
  echo "wazuh-logtest a renvoyé une erreur : pas de redémarrage"; false
fi
IDS=$( (grep -oE "^\s+id: '[0-9]+'" <<<"$OUT" || true) | grep -oE "[0-9]+" | tr '\n' ' ' || true)
echo "IDs obtenus : $IDS (attendus : 100150 100150 100101)"
[[ $IDS == "100150 100150 100101 " ]] || { echo "Résultat inattendu : pas de redémarrage"; false; }

# --- 7. Redémarrage ---
step "7. Redémarrage de wazuh-manager"
systemctl restart wazuh-manager || true
sleep 20
if ! systemctl is-active --quiet wazuh-manager; then
  echo "!!! wazuh-manager n'est pas active après le redémarrage"
  trap - ERR
  restore
  systemctl restart wazuh-manager || true
  sleep 20
  systemctl is-active wazuh-manager || true
  echo "Journal : $LOG"
  exit 1
fi
systemctl is-active wazuh-manager
grep -iE "misp-ioc-ip|honeypotx|ERROR" "$OSSEC/logs/ossec.log" | tail -5 || true

trap - ERR
step "OK : enrichissement MISP (liste de test) actif"
echo "Sauvegarde : $BACKUP"
echo "Journal    : $LOG"
