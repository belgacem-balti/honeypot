# Intentional Vulnerabilities Added for DevSecOps Testing

> **⚠️ WARNING**: This repository is in **VULNERABLE STATE** for DevSecOps pipeline testing.
> These vulnerabilities are intentional and serve as test cases for security scanning tools.
> **DO NOT deploy this to any real environment.**

## Purpose

This document catalogs all intentional security issues added to create a "before" state
for the DevSecOps pipeline testing scenario. The pipeline should detect all issues listed
here, and then a "fixed" state will demonstrate remediation.

---

## Category 1: Hardcoded Secrets

| File | Secret Type | Risk Level |
|------|-------------|------------|
| `server/src/config/secrets.js` | Database URL with password | 🔴 CRITICAL |
| `server/src/config/secrets.js` | JWT Secret | 🔴 CRITICAL |
| `server/src/config/secrets.js` | AWS Access Keys | 🔴 CRITICAL |
| `server/src/config/secrets.js` | Stripe Live Key | 🔴 CRITICAL |
| `server/src/config/secrets.js` | GitHub Token | 🔴 CRITICAL |
| `.env` | Multiple secrets in plain text | 🔴 CRITICAL |
| `.env.production` | Production credentials | 🔴 CRITICAL |
| `server/Dockerfile.insecure` | ENV secrets in Dockerfile | 🔴 CRITICAL |
| `kubernetes-secrets.yaml` | Plaintext K8s secrets | 🔴 CRITICAL |
| `.git-secrets-example` | Example committed secrets | 🔴 CRITICAL |

**Detected by**: Trivy secret scanning, gitleaks, git-secrets, GitHub Secret Scanning

---

## Category 2: Vulnerable Dependencies

### Server (server/package.json)

| Package | Version | CVE | Description |
|---------|---------|-----|-------------|
| axios | 0.21.1 | CVE-2021-3749 | ReDoS vulnerability |
| jsonwebtoken | 8.5.1 | CVE-2022-23529 | Improper Restriction of Security Token Assignment |
| lodash | 4.17.19 | N/A | Prototype pollution |
| minimist | 1.2.5 | CVE-2021-44906 | Prototype pollution |
| node-serialize | 0.0.4 | N/A | Remote Code Execution via deserialization |
| js-yaml | 3.13.0 | CVE-2019-6286 | Denial of Service |

### Client (client/package.json)

| Package | Version | CVE | Description |
|---------|---------|-----|-------------|
| axios | 0.21.1 | CVE-2021-3749 | ReDoS vulnerability |
| lodash | 4.17.15 | N/A | Prototype pollution |
| serialize-javascript | 3.1.0 | CVE-2020-7660 | XSS via serialization |

**Detected by**: Trivy, npm audit, Snyk, OWASP Dependency Check

---

## Category 3: Code Vulnerabilities

### server/src/routes/vulnerable.js

| Vulnerability | Endpoint | Risk Level |
|---------------|----------|------------|
| Command Injection | POST /api/vulnerable/ping | 🔴 CRITICAL |
| Path Traversal | GET /api/vulnerable/file | 🔴 CRITICAL |
| SQL Injection | GET /api/vulnerable/user | 🔴 CRITICAL |
| Insecure Deserialization (eval) | POST /api/vulnerable/deserialize | 🔴 CRITICAL |
| Sensitive Data Exposure | GET /api/vulnerable/config | 🟠 HIGH |
| SSRF | GET /api/vulnerable/fetch | 🟠 HIGH |

### server/src/utils/weak-crypto.js

| Vulnerability | Function | Risk Level |
|---------------|----------|------------|
| MD5 password hashing | hashPasswordMD5() | 🔴 CRITICAL |
| SHA1 password hashing | hashPasswordSHA1() | 🟠 HIGH |
| AES-ECB mode encryption | encryptDataWeak() | 🟠 HIGH |
| Hardcoded encryption key | encryptWithHardcodedKey() | 🔴 CRITICAL |
| Weak random (Math.random) | generateWeakToken() | 🟠 HIGH |
| Predictable session IDs | generateSessionId() | 🟠 HIGH |

**Detected by**: SonarQube, Semgrep, CodeQL, SAST tools

---

## Category 4: Docker/Container Vulnerabilities

### server/Dockerfile.insecure

| Issue | Risk Level |
|-------|------------|
| Node.js 14.15.0 (EOL, multiple CVEs) | 🔴 CRITICAL |
| Running as root | 🟠 HIGH |
| World-writable permissions (chmod 777) | 🟠 HIGH |
| Hardcoded secrets in ENV | 🔴 CRITICAL |
| Unnecessary tools (nmap, netcat, ssh) | 🟡 MEDIUM |
| No HEALTHCHECK | 🟡 MEDIUM |

### client/Dockerfile.insecure

| Issue | Risk Level |
|-------|------------|
| Using `latest` tag (unpredictable) | 🟡 MEDIUM |
| Running as root | 🟠 HIGH |
| Debug tools in production image | 🟡 MEDIUM |
| No multi-stage optimization | 🟡 MEDIUM |

### docker-compose.insecure.yml

| Issue | Risk Level |
|-------|------------|
| Privileged containers | 🔴 CRITICAL |
| Host filesystem mounted (/:/host-root:rw) | 🔴 CRITICAL |
| Docker socket exposed | 🔴 CRITICAL |
| Database port exposed (5432) | 🟠 HIGH |
| Debug port exposed (9229) | 🟠 HIGH |
| No resource limits | 🟡 MEDIUM |
| Redis without password | 🟠 HIGH |
| Old PostgreSQL (v11) | 🟡 MEDIUM |

**Detected by**: Trivy config scanning, Hadolint, Docker Bench for Security

---

## Category 5: Nginx Misconfiguration

### client/nginx.insecure.conf

| Missing Header / Issue | Attack Vector | Risk Level |
|------------------------|---------------|------------|
| No X-Frame-Options | Clickjacking | 🟠 HIGH |
| No X-Content-Type-Options | MIME sniffing | 🟡 MEDIUM |
| No Content-Security-Policy | XSS | 🟠 HIGH |
| No X-XSS-Protection | XSS | 🟡 MEDIUM |
| No HSTS | Downgrade attacks | 🟠 HIGH |
| server_tokens on | Info disclosure | 🟡 MEDIUM |
| autoindex on | Directory listing | 🟠 HIGH |
| CORS wildcard (*) | Cross-origin attacks | 🟠 HIGH |
| nginx_status exposed | Info disclosure | 🟡 MEDIUM |

**Detected by**: Mozilla Observatory, SecurityHeaders.com, Nikto, OWASP ZAP

---

## Category 6: Sensitive Files Exposed

| File | Content | Risk Level |
|------|---------|------------|
| `backup.sql` | DB dump with user data and API keys | 🔴 CRITICAL |
| `server/debug.log` | Passwords and secrets in logs | 🔴 CRITICAL |
| `kubernetes-secrets.yaml` | K8s secrets in plaintext | 🔴 CRITICAL |
| `.env` | Production credentials | 🔴 CRITICAL |
| `.env.production` | Production credentials | 🔴 CRITICAL |

**Detected by**: Trivy secret scanning, gitleaks, custom git hooks

---

## Scanning Commands

To scan this vulnerable state with Trivy:

```bash
# Filesystem scan (secrets + vulnerabilities)
trivy fs . --scanners secret,vuln,misconfig

# Docker image scan
trivy image --dockerfile server/Dockerfile.insecure .

# Specific secret scan
trivy fs . --scanners secret --severity HIGH,CRITICAL

# Config misconfig scan
trivy fs . --scanners misconfig

# Full report with SARIF output
trivy fs . --format sarif --output trivy-results.sarif
```

---

## Expected Scan Results

- **Secrets detected**: 20+
- **Vulnerable dependencies**: 9+
- **Container misconfigurations**: 15+
- **Code vulnerabilities**: 12+
- **Total findings**: 50+

---

## Remediation Path

After testing with the vulnerable state, the "fixed" state will:
1. Remove all hardcoded secrets → use environment variables + secrets manager
2. Update all dependencies to latest patched versions
3. Replace vulnerable code patterns with secure alternatives
4. Harden Dockerfiles (non-root user, minimal base image)
5. Add security headers to nginx configuration
6. Remove sensitive files from repository
