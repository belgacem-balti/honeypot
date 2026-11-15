#!/usr/bin/env python3
"""
Wazuh Custom Integration: AI & Threat Intelligence Analyzer
Integrates Wazuh alerts with TaskFlow Honeypot Security Analyzer (Groq LLM + AbuseIPDB + AlienVault OTX)

Usage:
  This script is called automatically by Wazuh's integratord daemon:
  custom-threat-analyzer.py <alert_file> <user> <api_key> <hook_url>
"""

import sys
import json
import urllib.request
import urllib.error

def main():
    if len(sys.argv) < 2:
        print("Usage: custom-threat-analyzer.py <alert_file> [user] [api_key] [hook_url]")
        sys.exit(1)

    alert_file = sys.argv[1]
    hook_url = sys.argv[4] if len(sys.argv) > 4 else "http://localhost:5000/api/security/analyze"

    try:
        with open(alert_file, "r") as f:
            alert_json = json.load(f)
    except Exception as e:
        print(f"Error reading alert file: {e}")
        sys.exit(1)

    # Extract relevant fields
    rule = alert_json.get("rule", {})
    data = alert_json.get("data", {})
    src_ip = data.get("srcip") or data.get("src_ip")
    full_log = alert_json.get("full_log") or rule.get("description", "Security alert triggered")

    # Only process if there is a source IP or relevant log
    payload = {
        "source": "wazuh-agent",
        "ruleId": rule.get("id"),
        "level": rule.get("level"),
        "ip": src_ip,
        "log": full_log,
        "alert": alert_json
    }

    try:
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            hook_url,
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            result = response.read().decode("utf-8")
            print(f"Wazuh -> Honeypot AI Analysis successful: {result}")
    except Exception as e:
        print(f"Error forwarding alert to {hook_url}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
