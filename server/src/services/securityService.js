let redisClient = null;
let publishEvent = null;
try {
  const redisConfig = require('../config/redis');
  redisClient = redisConfig.getClient ? redisConfig.getClient() : null;
} catch (_e) {
  // Standalone mode without redis
}
try {
  const queueConfig = require('../config/queue');
  publishEvent = queueConfig.publish;
} catch (_e) {
  // Standalone mode without queue
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ABUSEIPDB_KEY = process.env.ABUSEIPDB_API_KEY;
const OTX_KEY = process.env.OTX_API_KEY;

// Fallback in-memory store for security incidents if redis is down
const inMemoryIncidents = [];
const MAX_STORED_INCIDENTS = 100;

/**
 * Query AbuseIPDB for IP reputation and abuse score
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
      method: 'GET',
      headers: {
        Key: ABUSEIPDB_KEY,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data || {};
      return {
        score: data.abuseConfidenceScore || 0,
        totalReports: data.totalReports || 0,
        country: data.countryCode || 'Unknown',
        isp: data.isp || 'Unknown',
        isWhitelisted: Boolean(data.isWhitelisted),
        usageType: data.usageType || 'Unknown',
        lastReportedAt: data.lastReportedAt || null
      };
    }
    return { error: `AbuseIPDB returned status ${res.status}` };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Query AlienVault OTX for threat pulses and IOC tags
 */
async function checkAlienVaultOTX(ip) {
  if (!ip || ip === '127.0.0.1' || ip === 'localhost') {
    return { pulseCount: 0, tags: [] };
  }

  try {
    const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`, {
      method: 'GET',
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
        references: pulses.slice(0, 3).map((p) => ({ name: p.name, author: p.author_name }))
      };
    }
    return { error: `OTX returned status ${res.status}`, pulseCount: 0, tags: [] };
  } catch (error) {
    return { error: error.message, pulseCount: 0, tags: [] };
  }
}

/**
 * Query Groq LLM (gpt-oss-20b or qwen3.8-27b) for intelligent SOC reasoning
 */
async function analyzeWithGroq(logText, ip, threatIntel) {
  try {
    const prompt = `You are a Senior SOC Security Analyst. Analyze this security/honeypot log event enriched with Threat Intelligence.
Evaluate if this traffic is malicious, determine the attack category, and recommend immediate defensive actions.

Respond strictly in valid JSON format with the following fields:
{
  "threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "attack_type": "Brute-force" | "SQL Injection" | "Port Scan / Recon" | "Honeypot Probe" | "Web Exploit" | "Legitimate / Benign",
  "confidence": number (between 0 and 100),
  "summary": "Clear, concise 1-2 sentence explanation of what happened",
  "technical_details": "Key evidence, indicators, or suspicious payload parameters",
  "recommended_action": "Firewall block / IP ban / Monitor / None"
}`;

    const userPayload = JSON.stringify({
      log: logText || 'Incoming HTTP request to honeypot decoy endpoint',
      source_ip: ip,
      abuseipdb_reputation: threatIntel.abuseipdb,
      alienvault_otx_pulses: threatIntel.alienvault_otx
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
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (rawContent) {
        return JSON.parse(rawContent);
      }
    } else {
      const errorText = await res.text();
      console.error('Groq API Error:', res.status, errorText);
    }
  } catch (error) {
    console.error('Failed to analyze with Groq:', error.message);
  }

  // Graceful rule-based fallback if Groq is temporarily unreachable
  const abuseScore = threatIntel?.abuseipdb?.score || 0;
  let level = 'LOW';
  if (abuseScore > 75) level = 'CRITICAL';
  else if (abuseScore > 40) level = 'HIGH';
  else if (abuseScore > 15) level = 'MEDIUM';

  return {
    threat_level: level,
    attack_type: level === 'CRITICAL' ? 'Malicious IP Traffic' : 'Suspicious Traffic',
    confidence: Math.max(abuseScore, 60),
    summary: `Traffic from IP ${ip} assessed via threat intelligence score (${abuseScore}% abuse confidence).`,
    technical_details: `Identified by AbuseIPDB with ${threatIntel?.abuseipdb?.total_reports || 0} reports.`,
    recommended_action: level === 'CRITICAL' || level === 'HIGH' ? 'Block IP at edge firewall' : 'Monitor traffic'
  };
}

/**
 * Main analysis handler: gathers threat intel, runs AI inference, and saves incident
 */
async function processSecurityEvent({ ip, log, source, ruleId, level }) {
  const targetIp = ip || '127.0.0.1';
  const logMessage = log || 'Suspicious request observed on honeypot';

  // 1. Fetch threat intelligence concurrently
  const [abuseipdb, alienvault_otx] = await Promise.all([
    checkAbuseIPDB(targetIp),
    checkAlienVaultOTX(targetIp)
  ]);

  const threatIntel = { abuseipdb, alienvault_otx };

  // 2. Perform Groq LLM reasoning
  const aiAnalysis = await analyzeWithGroq(logMessage, targetIp, threatIntel);

  const incident = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    ip: targetIp,
    log: logMessage,
    source: source || 'wazuh-agent',
    ruleId: ruleId || null,
    wazuhLevel: level || null,
    threatIntel,
    aiAnalysis
  };

  // 3. Store incident
  await saveIncident(incident);

  // 4. Optionally publish to RabbitMQ queue for worker / notification processing
  if (publishEvent) {
    try {
      await publishEvent('security.incident', {
        type: 'security.incident',
        payload: {
          incidentId: incident.id,
          ip: incident.ip,
          threatLevel: aiAnalysis.threat_level,
          attackType: aiAnalysis.attack_type,
          summary: aiAnalysis.summary
        }
      });
    } catch (_e) {
      // Non-blocking queue publish
    }
  }

  return incident;
}

async function saveIncident(incident) {
  inMemoryIncidents.unshift(incident);
  if (inMemoryIncidents.length > MAX_STORED_INCIDENTS) {
    inMemoryIncidents.pop();
  }

  if (redisClient) {
    try {
      const key = 'security:incidents';
      await redisClient.lpush(key, JSON.stringify(incident));
      await redisClient.ltrim(key, 0, MAX_STORED_INCIDENTS - 1);
    } catch (_e) {
      // In-memory fallback is already populated
    }
  }
}

async function getRecentIncidents(limit = 20) {
  if (redisClient) {
    try {
      const items = await redisClient.lrange('security:incidents', 0, limit - 1);
      if (items && items.length > 0) {
        return items.map((item) => JSON.parse(item));
      }
    } catch (_e) {
      // Fallback to inMemory
    }
  }
  return inMemoryIncidents.slice(0, limit);
}

async function getSecurityStats() {
  const incidents = await getRecentIncidents(MAX_STORED_INCIDENTS);
  const total = incidents.length;
  const critical = incidents.filter((i) => i.aiAnalysis?.threat_level === 'CRITICAL').length;
  const high = incidents.filter((i) => i.aiAnalysis?.threat_level === 'HIGH').length;
  const medium = incidents.filter((i) => i.aiAnalysis?.threat_level === 'MEDIUM').length;
  const low = incidents.filter((i) => i.aiAnalysis?.threat_level === 'LOW').length;

  return {
    totalAnalyzed: total,
    threatCounts: { critical, high, medium, low },
    activeKeys: {
      groq: Boolean(GROQ_API_KEY),
      abuseipdb: Boolean(ABUSEIPDB_KEY),
      alienvault: Boolean(OTX_KEY)
    },
    models: {
      llm: 'Groq (openai/gpt-oss-20b)',
      threatFeeds: ['AbuseIPDB v2', 'AlienVault OTX']
    }
  };
}

module.exports = {
  checkAbuseIPDB,
  checkAlienVaultOTX,
  analyzeWithGroq,
  processSecurityEvent,
  getRecentIncidents,
  getSecurityStats
};
