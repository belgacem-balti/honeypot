require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 8080);
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ABUSEIPDB_KEY = process.env.ABUSEIPDB_API_KEY;
const OTX_KEY = process.env.OTX_API_KEY;
const WAZUH_ALERT_MIN_LEVEL = Number(process.env.WAZUH_ALERT_MIN_LEVEL || 5);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory alert store
const incidents = [];
const MAX_INCIDENTS = 300;

// SSE Client Connections for Real-Time Streaming
let sseClients = [];

function broadcastToClients(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (_err) {
      // client connection closed
    }
  });
}

// Keep-alive heartbeat for SSE every 25 seconds
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(': keepalive\n\n');
    } catch (_err) {}
  });
}, 25000);

/**
 * Threat Intelligence: AbuseIPDB
 */
async function checkAbuseIPDB(ip) {
  if (!ip || ip === '127.0.0.1' || ip === 'localhost') {
    return { score: 0, totalReports: 0, country: 'LOCAL', isp: 'Internal', isWhitelisted: true };
  }

  try {
    const url = new URL('https://api.abuseipdb.com/api/v2/check');
    url.searchParams.append('ipAddress', ip);
    url.searchParams.append('maxAgeInDays', '90');

    const res = await fetch(url.toString(), {
      headers: {
        Key: ABUSEIPDB_KEY,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const json = await res.json();
      const d = json.data || {};
      return {
        score: d.abuseConfidenceScore || 0,
        totalReports: d.totalReports || 0,
        country: d.countryCode || 'Unknown',
        isp: d.isp || 'Unknown',
        isWhitelisted: Boolean(d.isWhitelisted),
        usageType: d.usageType || 'Unknown'
      };
    }
  } catch (err) {
    console.error('AbuseIPDB error:', err.message);
  }
  return { score: 0, totalReports: 0, country: 'Unknown', isp: 'Unknown' };
}

/**
 * Threat Intelligence: AlienVault OTX
 */
async function checkAlienVaultOTX(ip) {
  if (!ip || ip === '127.0.0.1' || ip === 'localhost') {
    return { pulseCount: 0, tags: [] };
  }

  try {
    const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`, {
      headers: {
        'X-OTX-API-KEY': OTX_KEY,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      const pulseInfo = data.pulse_info || {};
      const pulses = pulseInfo.pulses || [];
      const tags = Array.from(new Set(pulses.flatMap((p) => p.tags || []))).slice(0, 8);
      return {
        pulseCount: pulseInfo.count || 0,
        tags,
        references: pulses.slice(0, 3).map((p) => p.name)
      };
    }
  } catch (err) {
    console.error('AlienVault OTX error:', err.message);
  }
  return { pulseCount: 0, tags: [], references: [] };
}

/**
 * Groq LLM SOC Reasoning
 */
async function analyzeWithGroq(logText, ip, threatIntel, ruleInfo = {}) {
  try {
    const prompt = `You are a Senior Autonomous SOC Analyst supervising Wazuh SIEM alerts.
Evaluate this security alert enriched with real-time threat intelligence.
Classify the attack, evaluate the true risk level, summarize what the attacker did, and give actionable defense instructions.

Respond strictly in valid JSON format:
{
  "threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "attack_type": "SQL Injection" | "Brute-force / Credential Stuffing" | "Reconnaissance / Probe" | "Command Execution / RCE" | "Malware Staging" | "Benign / False Positive",
  "confidence": number (0 to 100),
  "summary": "Concise 1-2 sentence executive explanation",
  "technical_details": "Key indicators, parameters, or patterns noticed",
  "mitre_technique": "e.g. T1110 (Brute Force), T1190 (Exploit Public-Facing App), T1059 (Command Line)",
  "recommended_action": "Firewall block IP / Rate-limit / Isolate container / Monitor"
}`;

    const userPayload = JSON.stringify({
      log: logText || 'Security event observed by Wazuh agent',
      source_ip: ip,
      wazuh_rule: ruleInfo,
      threat_intelligence: {
        abuseipdb: threatIntel.abuseipdb,
        alienvault_otx: threatIntel.alienvault_otx
      }
    });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userPayload }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) return JSON.parse(content);
    }
  } catch (err) {
    console.error('Groq LLM analysis error:', err.message);
  }

  // Resilient heuristic fallback
  const abuseScore = threatIntel?.abuseipdb?.score || 0;
  let level = 'LOW';
  if (abuseScore > 75 || ruleInfo.level >= 10) level = 'CRITICAL';
  else if (abuseScore > 40 || ruleInfo.level >= 7) level = 'HIGH';
  else if (abuseScore > 10 || ruleInfo.level >= 5) level = 'MEDIUM';

  return {
    threat_level: level,
    attack_type: ruleInfo.description || 'Suspicious Traffic',
    confidence: Math.max(abuseScore, 65),
    summary: `Observed security event from ${ip} evaluated with ${abuseScore}% abuse confidence.`,
    technical_details: `Triggered by rule ${ruleInfo.id || 'N/A'} (Level ${ruleInfo.level || 'N/A'})`,
    mitre_technique: 'T1190',
    recommended_action: level === 'CRITICAL' || level === 'HIGH' ? 'Block IP at firewall' : 'Monitor session'
  };
}

/**
 * Ingestion Handler for Wazuh & Webhooks
 */
async function processIncident(rawEvent, source = 'wazuh-siem') {
  let ip = rawEvent.ip || rawEvent.srcip || rawEvent.src_ip;
  let log = rawEvent.log || rawEvent.full_log || rawEvent.message;
  let ruleInfo = {
    id: rawEvent.ruleId || rawEvent.rule_id,
    level: rawEvent.level,
    description: rawEvent.description
  };

  // Extract from Wazuh native alert JSON structure
  const alert = rawEvent.alert || rawEvent;
  if (alert.rule) {
    ruleInfo = {
      id: alert.rule.id || ruleInfo.id,
      level: alert.rule.level || ruleInfo.level,
      description: alert.rule.description || ruleInfo.description
    };
  }
  if (alert.data) {
    ip = ip || alert.data.srcip || alert.data.src_ip || alert.data.remote_addr;
  }
  if (!log) {
    log = alert.full_log || alert.rule?.description || 'Wazuh SIEM Security Event';
  }

  // Normalize IP
  if (!ip) ip = '127.0.0.1';

  // 1. Concurrent Threat Intel Lookup
  const [abuseipdb, alienvault_otx] = await Promise.all([
    checkAbuseIPDB(ip),
    checkAlienVaultOTX(ip)
  ]);

  const threatIntel = { abuseipdb, alienvault_otx };

  // 2. Groq LLM Inference
  const aiAnalysis = await analyzeWithGroq(log, ip, threatIntel, ruleInfo);

  const incident = {
    id: `soc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    source,
    ip,
    log,
    rule: ruleInfo,
    threatIntel,
    aiAnalysis
  };

  // Save in memory
  incidents.unshift(incident);
  if (incidents.length > MAX_INCIDENTS) incidents.pop();

  // Dynamic broadcast to all connected dashboard browsers!
  broadcastToClients('new_alert', incident);

  return incident;
}

// ── REST API ROUTES ──

// Real-Time SSE Stream for Standalone Dashboard
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('event: connected\ndata: {"status":"streaming"}\n\n');

  const clientId = Date.now();
  const clientObj = { id: clientId, res };
  sseClients.push(clientObj);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Dynamic Wazuh Alert Ingestion Webhook
app.post('/api/wazuh', async (req, res) => {
  try {
    const raw = req.body;
    // Check level filter
    const alertLevel = raw.rule?.level || raw.level || 5;
    if (alertLevel < WAZUH_ALERT_MIN_LEVEL) {
      return res.status(200).json({ status: 'ignored', message: 'Below alert level threshold' });
    }

    const incident = await processIncident(raw, 'wazuh-agent');
    res.status(201).json({ status: 'processed', incidentId: incident.id, aiAnalysis: incident.aiAnalysis });
  } catch (err) {
    console.error('Wazuh webhook ingestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch Incident History
app.get('/api/alerts', (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), MAX_INCIDENTS);
  res.json({
    status: 'ok',
    count: incidents.length,
    alerts: incidents.slice(0, limit)
  });
});

// Fetch SOC Metrics
app.get('/api/stats', (req, res) => {
  const critical = incidents.filter((i) => i.aiAnalysis?.threat_level === 'CRITICAL').length;
  const high = incidents.filter((i) => i.aiAnalysis?.threat_level === 'HIGH').length;
  const medium = incidents.filter((i) => i.aiAnalysis?.threat_level === 'MEDIUM').length;
  const low = incidents.filter((i) => i.aiAnalysis?.threat_level === 'LOW').length;

  res.json({
    status: 'ok',
    totalAlerts: incidents.length,
    activeStreamClients: sseClients.length,
    breakdown: { critical, high, medium, low },
    threatFeeds: {
      groqLLM: 'Active (openai/gpt-oss-20b)',
      abuseIPDB: 'Active (v2)',
      alienvaultOTX: 'Active (OTX v1)'
    }
  });
});

// Trigger a Test Alert from Simulator
app.post('/api/test', async (req, res) => {
  try {
    const sample = {
      ip: req.body.ip || '185.220.101.5',
      log: req.body.log || 'GET /api/search?q=1%27%20OR%201=1--%20UNION%20SELECT%20password%20FROM%20users-- HTTP/1.1 500',
      ruleId: req.body.ruleId || 100104,
      level: req.body.level || 10,
      description: req.body.description || 'Honeypot SQL Injection Extraction Probe'
    };
    const incident = await processIncident(sample, 'soc-simulator');
    res.json({ status: 'ok', incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  AI SOC Analyst Standalone Dashboard Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 Wazuh Ingestion Hook: http://localhost:${PORT}/api/wazuh`);
  console.log(`⚡ Real-Time SSE Stream: http://localhost:${PORT}/api/stream`);
  console.log(`=======================================================`);
});
