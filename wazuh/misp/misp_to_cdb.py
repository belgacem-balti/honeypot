#!/usr/bin/env python3
"""HoneypotX : export des IP malveillantes de MISP vers la liste CDB Wazuh misp-ioc-ip.

Source  : MISP /attributes/restSearch (ip-src, ip-dst, ip-src|port, ip-dst|port ; to_ids=1)
          ou un export JSON MISP local (--from-file), pour tester hors ligne.
Sortie  : /var/ossec/etc/lists/misp-ioc-ip, une ligne "clé:valeur" par IP.
          IPv4 /32 -> "203.0.113.5:misp_event_1234"
          CIDR /8, /16, /24 -> préfixe "203.0.113.:misp_event_1234" (lookup address_match_key)
          Autres masques et IPv6 : ignorés (signalés sur stderr).
Code de sortie : 0 = liste inchangée, 2 = liste modifiée (redémarrer wazuh-manager), 1 = erreur.

Variables d'environnement : MISP_URL, MISP_KEY (clé API, jamais en argument), MISP_VERIFY_TLS (1 par défaut).
Bibliothèque standard uniquement (le manager n'a pas d'accès Internet pour pip).
"""
import argparse
import ipaddress
import json
import os
import ssl
import sys
import tempfile
import urllib.request

IP_TYPES = ["ip-src", "ip-dst", "ip-src|port", "ip-dst|port"]
DEFAULT_OUTPUT = "/var/ossec/etc/lists/misp-ioc-ip"


def fetch_misp(url, key, verify_tls, last):
    body = {"returnFormat": "json", "type": IP_TYPES, "to_ids": 1, "deleted": 0, "last": last}
    req = urllib.request.Request(
        url.rstrip("/") + "/attributes/restSearch",
        data=json.dumps(body).encode(),
        headers={"Authorization": key, "Accept": "application/json", "Content-Type": "application/json"},
        method="POST",
    )
    ctx = ssl.create_default_context()
    if not verify_tls:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        return json.load(resp)


def attributes(data):
    # restSearch : {"response": {"Attribute": [...]}} ; export d'événement : {"Event": {"Attribute": [...]}}
    if "response" in data:
        return data["response"].get("Attribute", [])
    if "Event" in data:
        return data["Event"].get("Attribute", [])
    return data.get("Attribute", [])


def cdb_key(value):
    ip = value.split("|", 1)[0].strip()  # ip-src|port -> ip
    net = ipaddress.ip_network(ip, strict=False)
    if net.version != 4:
        raise ValueError("IPv6 non géré par la liste")
    # Les IP privées sont gardées : dans le lab, les attaquants sont en 192.168.x.x
    if net.is_loopback or net.is_unspecified or net.is_multicast or net.is_link_local:
        raise ValueError("loopback/multicast/link-local, pas une IP d'attaquant")
    if net.prefixlen == 32:
        return str(net.network_address)
    if net.prefixlen in (8, 16, 24):
        octets = str(net.network_address).split(".")[: net.prefixlen // 8]
        return ".".join(octets) + "."
    raise ValueError(f"masque /{net.prefixlen} non convertible en préfixe")


def build(attrs):
    entries = {}
    for a in attrs:
        try:
            key = cdb_key(a["value"])
        except (ValueError, KeyError) as e:
            print(f"ignoré : {a.get('value')!r} ({e})", file=sys.stderr)
            continue
        entries.setdefault(key, f"misp_event_{a.get('event_id', 'na')}")
    return "".join(f"{k}:{v}\n" for k, v in sorted(entries.items()))


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--from-file", help="export JSON MISP local au lieu de l'API")
    p.add_argument("--output", default=DEFAULT_OUTPUT)
    p.add_argument("--last", default="30d", help="fenêtre MISP (défaut : 30d)")
    p.add_argument("--dry-run", action="store_true", help="affiche la liste sans l'écrire")
    args = p.parse_args()

    try:
        if args.from_file:
            with open(args.from_file) as f:
                data = json.load(f)
        else:
            url, key = os.environ.get("MISP_URL"), os.environ.get("MISP_KEY")
            if not url or not key:
                sys.exit("MISP_URL et MISP_KEY doivent être définies (ou utiliser --from-file)")
            data = fetch_misp(url, key, os.environ.get("MISP_VERIFY_TLS", "1") != "0", args.last)
    except (OSError, ValueError) as e:
        print(f"erreur : {e}", file=sys.stderr)
        return 1

    content = build(attributes(data))
    if args.dry_run:
        sys.stdout.write(content)
        return 0

    try:
        with open(args.output) as f:
            if f.read() == content:
                print(f"{args.output} inchangée ({content.count(chr(10))} entrées)")
                return 0
    except FileNotFoundError:
        pass

    # Écriture atomique dans le même dossier, droits wazuh:wazuh 660 conservés si lancé en root
    d = os.path.dirname(args.output) or "."
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".misp-ioc-ip.")
    with os.fdopen(fd, "w") as f:
        f.write(content)
    os.chmod(tmp, 0o660)
    if os.geteuid() == 0:
        import grp
        import pwd
        os.chown(tmp, pwd.getpwnam("wazuh").pw_uid, grp.getgrnam("wazuh").gr_gid)
    os.replace(tmp, args.output)
    print(f"{args.output} mise à jour ({content.count(chr(10))} entrées)")
    return 2


if __name__ == "__main__":
    sys.exit(main())
