# DevSecOps Pipeline Testing Guide

## Current State: ⚠️ VULNERABLE

This branch contains intentional security vulnerabilities for DevSecOps pipeline testing.
See `VULNERABILITIES-ADDED.md` for a full catalog of added issues.

---

## Testing Scenario

### Phase 1: Vulnerable State (Current Branch)
- All vulnerabilities active
- Pipeline should FAIL security gates
- Scan results establish the baseline

### Phase 2: Remediation
- Fix each vulnerability category
- Re-run pipeline after each fix
- Verify scan results improve

### Phase 3: Secure State
- All critical/high findings resolved
- Pipeline passes all security gates
- SBOM generated and clean

---

## Quick Start

### 1. Run Trivy Scan (Secret Detection)
```bash
trivy fs . --scanners secret --severity HIGH,CRITICAL
```

### 2. Run Trivy Scan (Vulnerability Detection)
```bash
trivy fs . --scanners vuln
```

### 3. Run Trivy Scan (Misconfiguration)
```bash
trivy fs . --scanners misconfig
```

### 4. Build Insecure Docker Images
```bash
docker-compose -f docker-compose.insecure.yml build
```

### 5. Scan Docker Images
```bash
docker build -t honeypot-server:insecure -f server/Dockerfile.insecure ./server
trivy image honeypot-server:insecure
```

### 6. Run npm audit
```bash
cd server && npm audit
cd ../client && npm audit
```

---

## Pipeline Security Gates

The DevSecOps pipeline enforces these gates:

| Gate | Tool | Fail Condition |
|------|------|----------------|
| Secret Detection | Trivy | Any secret found |
| Dependency CVEs | Trivy/npm audit | CRITICAL/HIGH CVEs |
| Container Scan | Trivy | CRITICAL CVEs |
| Config Scan | Trivy | CRITICAL misconfigs |
| SAST | Semgrep | CRITICAL findings |
| License Check | Trivy | GPL in production |

---

## Branches

| Branch | Description |
|--------|-------------|
| `main` | Original clean application |
| `vulnerable-state` | Current - intentional vulnerabilities |
| `secure-state` | Fixed - after remediation (TBD) |

---

## Files Added in Vulnerable State

### New Files
- `server/src/config/secrets.js` - Hardcoded credentials
- `server/src/routes/vulnerable.js` - Injection vulnerabilities
- `server/src/utils/weak-crypto.js` - Weak cryptography
- `server/Dockerfile.insecure` - Insecure container config
- `server/debug.log` - Sensitive data in logs
- `client/Dockerfile.insecure` - Insecure container config
- `client/nginx.insecure.conf` - Missing security headers
- `docker-compose.insecure.yml` - Insecure orchestration
- `backup.sql` - Exposed database backup
- `kubernetes-secrets.yaml` - Plaintext K8s secrets
- `.env` - Hardcoded environment secrets
- `.env.production` - Production credentials
- `.git-secrets-example` - Example secret leakage

### Modified Files
- `server/package.json` - Added vulnerable dependencies
- `client/package.json` - Added vulnerable dependencies

---

## Security Tools Reference

### Trivy
```bash
# Install
brew install trivy  # macOS
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -  # Ubuntu

# Full scan
trivy fs . --scanners secret,vuln,misconfig --severity HIGH,CRITICAL

# Generate SARIF report (for GitHub Security tab)
trivy fs . --format sarif --output trivy-results.sarif

# Generate SBOM
trivy fs . --format cyclonedx --output sbom.json
```

### Gitleaks
```bash
# Scan for secrets in git history
gitleaks detect --source . -v
```

### OWASP Dependency Check
```bash
dependency-check --project honeypot --scan . --out ./reports
```

---

## Expected Findings Summary

When scanning this vulnerable state, you should see:

- 🔴 **CRITICAL**: 20+ findings
- 🟠 **HIGH**: 15+ findings  
- 🟡 **MEDIUM**: 10+ findings
- Total: **45+ security issues**

If your scanner finds fewer than 20 critical issues, check that:
1. Secret scanning is enabled (`--scanners secret`)
2. You are scanning from the repository root
3. Trivy rules are up to date (`trivy image --download-db-only`)
