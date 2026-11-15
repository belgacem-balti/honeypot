// Honeypot telemetry: one JSON line per request on stdout, prefixed by
// {"honeypot":"taskflow" so log shippers can filter it from other output.
// Consumed by Wazuh (see wazuh/README.md). Field names avoid Wazuh's static
// fields (url, status, id, user) so they stay addressable as data.<field>.

const MAX_FIELD = 512;

const SIGNATURES = [
  { attack: 'sqli', severity: 'high', re: /('|%27)\s*(or|and|union|;|--)|union(\s|\+|%20)+select|\b(pg_sleep|sleep|benchmark)\s*\(|information_schema|\bor\s+1\s*=\s*1|--\s*$/i },
  { attack: 'xss', severity: 'medium', re: /<script|%3cscript|javascript:|on(error|load)\s*=/i },
  { attack: 'path_traversal', severity: 'medium', re: /\.\.(\/|\\|%2f|%5c)|\/etc\/passwd/i },
  { attack: 'cmd_injection', severity: 'high', re: /(;|\||`|\$\()\s*(cat|id|whoami|uname|wget|curl|bash|sh)\b/i },
];

const SCANNER_UA = /sqlmap|nikto|nmap|masscan|gobuster|dirbuster|dirb|wfuzz|ffuf|nuclei|zgrab|hydra|burp|acunetix|nessus|openvas|wpscan/i;

// Decoy endpoints that no legitimate client of the UI ever calls.
const TRAPS = [
  { re: /^\/api\/(debug|config)\b/, attack: 'recon', severity: 'medium' },
  { re: /^\/api\/backup\//, attack: 'data_exfiltration', severity: 'high' },
  { re: /^\/api\/admin\//, attack: 'admin_access', severity: 'high' },
  { re: /^\/api\/auth\/check-email/, attack: 'user_enumeration', severity: 'low' },
  { re: /^\/api\/auth\/reset-password/, attack: 'account_takeover', severity: 'high' },
  { re: /\/(\.env|\.git|wp-admin|wp-login|phpmyadmin|server-status|actuator)\b/i, attack: 'recon', severity: 'medium' },
];

const truncate = (value) => {
  if (value === undefined || value === null) return undefined;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return str.length > MAX_FIELD ? `${str.slice(0, MAX_FIELD)}…` : str;
};

const classify = (req, haystack) => {
  for (const sig of SIGNATURES) {
    if (sig.re.test(haystack)) return sig;
  }
  if (SCANNER_UA.test(req.get('user-agent') || '')) return { attack: 'scanner', severity: 'medium' };
  for (const trap of TRAPS) {
    if (trap.re.test(req.path)) return trap;
  }
  return null;
};

const telemetry = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const body = req.body && Object.keys(req.body).length ? req.body : undefined;
    let haystack = req.originalUrl;
    try { haystack = decodeURIComponent(req.originalUrl); } catch (_) { /* malformed encoding is itself suspicious; keep raw */ }
    if (body) haystack += ` ${JSON.stringify(body)}`;

    let match = classify(req, haystack);
    if (!match && req.path === '/api/auth/login' && res.statusCode >= 400) {
      match = { attack: 'auth_failure', severity: 'low' };
    }
    if (!match && res.statusCode === 404) {
      match = { attack: 'probe', severity: 'low' };
    }

    const event = {
      honeypot: 'taskflow',
      timestamp: new Date().toISOString(),
      srcip: req.ip,
      method: req.method,
      path: truncate(req.path),
      query: truncate(Object.keys(req.query).length ? req.query : undefined),
      http_status: res.statusCode,
      duration_ms: Number(process.hrtime.bigint() - start) / 1e6,
      user_agent: truncate(req.get('user-agent')),
      referer: truncate(req.get('referer')),
      // Credentials and payloads are the intelligence a decoy exists to capture.
      username: truncate(body && body.email),
      password: truncate(body && body.password),
      body: truncate(body),
      attack: match ? match.attack : 'none',
      severity: match ? match.severity : 'info',
    };

    process.stdout.write(`${JSON.stringify(event)}\n`);
  });

  next();
};

module.exports = { telemetry };
