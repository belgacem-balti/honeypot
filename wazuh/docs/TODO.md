# TODO — bloc Wazuh

- [ ] Repasser en Host-only (VMnet1, IP 192.168.220.131) avant la démo PFE
- [ ] MISP réel : attendre l'URL de l'instance et une clé API en lecture seule (fournies par le coéquipier MISP).
      Ensuite : /var/ossec/etc/misp.env (root:wazuh 640), timer horaire, redémarrage du manager seulement si misp_to_cdb.py sort avec le code 2.
- [x] Règles Cowrie 100101 à 100110 et MISP 100150 validées sur le manager (2026-10-15).
- [ ] Prochaine session : export des alertes vers le moteur ML et dashboard Wazuh.
