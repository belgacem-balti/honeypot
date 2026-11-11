#!/usr/bin/env bash
# Run by the wazuh-manager image from /entrypoint-scripts/ before Wazuh starts.
# Requires a password for agent enrollment (port 1515); the image default is
# use_password=no, which lets anyone who reaches 1515 register an agent.
set -euo pipefail

OSSEC_CONF=/var/ossec/etc/ossec.conf
PASS_FILE=/var/ossec/etc/authd.pass

if [[ -z "${WAZUH_REGISTRATION_PASSWORD:-}" ]]; then
  echo "[authd] WAZUH_REGISTRATION_PASSWORD is empty, refusing to start" >&2
  exit 1
fi

printf '%s\n' "$WAZUH_REGISTRATION_PASSWORD" > "$PASS_FILE"
chown root:wazuh "$PASS_FILE"
chmod 640 "$PASS_FILE"

sed -i 's#<use_password>no</use_password>#<use_password>yes</use_password>#' "$OSSEC_CONF"
grep -q '<use_password>yes</use_password>' "$OSSEC_CONF" \
  || { echo "[authd] could not enable use_password in $OSSEC_CONF" >&2; exit 1; }
echo "[authd] enrollment password enabled"
