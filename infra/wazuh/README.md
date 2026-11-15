# Wazuh Integration with TaskFlow Honeypot AI & Threat Intelligence

This integration connects Wazuh alerts directly to the Honeypot AI Analyzer powered by:
- **Groq LLM** (`openai/gpt-oss-20b`) for SOC reasoning and incident summarization
- **AbuseIPDB v2** for IP reputation and abuse confidence score
- **AlienVault OTX** for active threat pulses and IOC tags

## Installation on Wazuh Manager

1. Copy the integration script to Wazuh's integrations folder:
   ```bash
   sudo cp infra/wazuh/custom-threat-analyzer.py /var/ossec/integrations/custom-threat-analyzer
   sudo chmod 750 /var/ossec/integrations/custom-threat-analyzer
   sudo chown root:ossec /var/ossec/integrations/custom-threat-analyzer
   ```

2. Add the `<integration>` block to `/var/ossec/etc/ossec.conf`:
   ```xml
   <ossec_config>
     <integration>
       <name>custom-threat-analyzer</name>
       <hook_url>http://<BACKEND_HOST_OR_INGRESS>:5000/api/security/analyze</hook_url>
       <level>5</level>
       <alert_format>json</alert_format>
     </integration>
   </ossec_config>
   ```

3. Restart the Wazuh Manager:
   ```bash
   sudo systemctl restart wazuh-manager
   ```

Whenever an alert of level 5 or above fires, Wazuh will automatically forward the alert JSON to your backend for real-time AI and threat analysis!
