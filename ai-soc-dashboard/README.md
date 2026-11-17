# Autonomous AI SOC Analyst Dashboard (Standalone)

A dedicated, isolated Cybersecurity SOC Dashboard that dynamically catches alerts from Wazuh SIEM, enriches them in real time using **AbuseIPDB** and **AlienVault OTX**, and applies **Groq LLM** (`openai/gpt-oss-20b`) for autonomous incident reasoning and remediation advice.

## Features
- **Completely Isolated**: Runs independently of the main application on port `8080`.
- **Dynamic Wazuh Catcher**: Receives native Wazuh alert JSON via `/api/wazuh`.
- **Real-Time Streaming**: Uses Server-Sent Events (SSE) `/api/stream` to instantly display alerts in the browser without reloading.
- **Dual Threat Feeds**: Real-time AbuseIPDB confidence score + AlienVault OTX pulses.
- **Groq AI SOC Reasoning**: Structured attack classification, MITRE ATT&CK technique, executive summary, and firewall mitigation commands.
- **Built-in Threat Simulator**: Test the entire pipeline anytime with simulated SQLi, SSH brute-force, or reconnaissance probes.

## Quick Start

### Option 1: Run with Node.js
```bash
cd ai-soc-dashboard
npm start
```
The dashboard will be available at: **http://localhost:8080**

### Option 2: Run in Docker
```bash
cd ai-soc-dashboard
docker compose up -d --build
```

## Connecting Wazuh Manager

1. Copy the integration script to your Wazuh Manager:
   ```bash
   sudo cp wazuh/custom-threat-analyzer.py /var/ossec/integrations/custom-threat-analyzer
   sudo chmod 750 /var/ossec/integrations/custom-threat-analyzer
   sudo chown root:ossec /var/ossec/integrations/custom-threat-analyzer
   ```

2. Add this integration block inside `<ossec_config>` in `/var/ossec/etc/ossec.conf`:
   ```xml
   <ossec_config>
     <integration>
       <name>custom-threat-analyzer</name>
       <hook_url>http://127.0.0.1:8080/api/wazuh</hook_url>
       <level>5</level>
       <alert_format>json</alert_format>
     </integration>
   </ossec_config>
   ```

3. Restart the Wazuh Manager:
   ```bash
   sudo systemctl restart wazuh-manager
   ```
