#!/usr/bin/env python3
"""
Wazuh Integratord Hook for Autonomous AI SOC Dashboard
Dynamically catches alerts from Wazuh Manager and forwards to the standalone AI SOC Dashboard.

Usage:
  This script is called by Wazuh integratord:
  custom-threat-analyzer <alert_file> [user] [api_key] [hook_url]
"""

import sys
import json
import urllib.request
import urllib.error

def main():
    if len(sys.argv) < 2:
        print("Usage: custom-threat-analyzer <alert_file> [user] [api_key] [hook_url]")
        sys.exit(1)

    alert_file = sys.argv[1]
    hook_url = sys.argv[4] if len(sys.argv) > 4 else "http://127.0.0.1:8080/api/wazuh"

    try:
        with open(alert_file, "r") as f:
            alert_json = json.load(f)
    except Exception as e:
        print(f"Error reading Wazuh alert file {alert_file}: {e}")
        sys.exit(1)

    try:
        req_data = json.dumps(alert_json).encode("utf-8")
        req = urllib.request.Request(
            hook_url,
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            result = response.read().decode("utf-8")
            print(f"Forwarded alert to AI SOC Dashboard successfully: {result}")
    except Exception as e:
        print(f"Error forwarding alert to {hook_url}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
