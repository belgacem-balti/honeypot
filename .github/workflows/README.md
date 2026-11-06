# GitHub Actions Workflows Documentation

This directory contains GitHub Actions workflows for the TaskFlow Honeypot DevSecOps CI/CD pipeline.

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)

**Purpose:** Main continuous integration pipeline with security scans, builds, tests, and registry push.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` branch

**Jobs:**

#### Job 1: `security-scan`
Runs security checks before any build operations:
- **Stage 1:** Checkout code with full git history
- **Stage 2:** Secret detection with Gitleaks
- **Stage 3a:** npm audit for client and server dependencies
- **Stage 3b:** Trivy filesystem scans for client and server
- **Stage 4:** SAST with Semgrep (rulesets: p/javascript, p/react, p/nodejs, p/security-audit)

All scan results are uploaded as artifacts (30-day retention).

#### Job 2: `build-and-test`
Builds, tests, scans images, and pushes to registry (runs only if `security-scan` passes):
- Install dependencies and run unit tests
- **Stage 5:** Build Docker images for client and server
- **Stage 6:** Trivy image scans with CRITICAL/HIGH severity threshold
- **Stage 7:** Generate CycloneDX SBOMs
- **Stage 10:** Push images to GitHub Container Registry (GHCR) with commit SHA and latest tags

Image scan results and SBOMs are uploaded as artifacts (90-day retention).

**Fail Conditions:**
- Test failures
- Docker build failures

This repository is a honeypot. Gitleaks, npm audit, Trivy, and Semgrep still run and upload artifacts, but they do not fail the job on expected findings (`continue-on-error` / Trivy `exit-code: 0`). Set Trivy `exit-code` to `1` if you want a blocking gate.

**Images:** CI builds `client/Dockerfile.hardened` and `server/Dockerfile.hardened` (non-root, health checks, security headers).

---

### 2. Scheduled Security Scans (`security.yml`)

**Purpose:** Regular comprehensive security scanning including runtime DAST.

**Triggers:**
- Scheduled: Every Monday at 00:00 UTC (cron: `0 0 * * 1`)
- Manual: `workflow_dispatch`

**Jobs:**

#### Job 1: `trivy-repo-scan`
Full repository scan with SARIF upload to GitHub Security tab:
- Trivy filesystem scan of entire repository
- Results uploaded to GitHub Advanced Security (Code Scanning)

#### Job 2: `zap-scan`
Dynamic Application Security Testing (DAST):
- Deploy application with docker-compose
- Run OWASP ZAP 2.14.0 baseline scan against localhost
- Upload JSON and HTML reports as artifacts (30-day retention)
- Clean up: shutdown docker-compose

**Note:** ZAP scans are informational only and do not fail the workflow.

---

### 3. Deployment (`deploy.yml`)

**Purpose:** Deploy application to staging or production environments.

**Triggers:**
- Manual: `workflow_dispatch` with environment selection (staging/production)
- Automatic: On successful completion of CI Pipeline for `main` branch (deploys to staging)

**Deployment Steps:**
1. Create `.env` file from GitHub secrets
2. Pull latest images from registry
3. Deploy with `docker compose up -d`
4. Wait for services to initialize (20 seconds)
5. Health checks on `/api/health` and `/` endpoints
6. Smoke tests: registration and login API calls

**Environment Configuration:**
- `staging`: Automatic deployment after CI success
- `production`: Requires manual approval in GitHub UI

**Required Secrets:**
- `DATABASE_URL`
- `JWT_SECRET`
- `POSTGRES_PASSWORD`

---

### 4. SBOM Generation and Attestation (`sbom.yml`)

**Purpose:** Generate and attest Software Bill of Materials for released versions.

**Triggers:**
- Release published (tags matching `v*.*.*`)

**Steps:**
1. Login to GitHub Container Registry
2. Pull latest client and server images
3. Generate CycloneDX SBOMs using Trivy 0.50.1
4. Attest SBOMs using GitHub Attestations API (`actions/attest-sbom@v1`)
5. Upload SBOM artifacts

**Required Permissions:**
- `contents: write`
- `id-token: write`
- `attestations: write`

---

## Required GitHub Secrets

Configure these secrets in **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Required For | Example |
|-------------|-------------|--------------|---------|
| `GITHUB_TOKEN` | Automatic token (auto-provided) | All workflows | Auto-generated |
| `DOCKER_USERNAME` | Docker Hub username (optional) | None (using GHCR) | - |
| `DOCKER_PASSWORD` | Docker Hub token (optional) | None (using GHCR) | - |
| `JWT_SECRET` | JWT signing key | security.yml, deploy.yml | 64-char random hex |
| `DATABASE_URL` | PostgreSQL connection string | security.yml, deploy.yml | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_PASSWORD` | Database root password | deploy.yml | Strong random password |
| `TEST_DATABASE_URL` | Unused | Server Jest tests mock Prisma; no CI Postgres service is required | n/a |
| `TEST_JWT_SECRET` | Optional JWT for tests | ci.yml (tests fall back to a local dummy) | `test_secret_key` |
| `GITLEAKS_LICENSE` | Gitleaks Pro license (optional) | ci.yml | Pro license key |

**Generate JWT_SECRET:**
```bash
openssl rand -hex 64
```

---

## GitHub Environments

Configure in **Settings → Environments**:

### Staging Environment
- **Protection rules:** None (auto-deploy)
- **Secrets:** DATABASE_URL, JWT_SECRET, POSTGRES_PASSWORD (staging values)
- **URL:** http://staging.taskflow.local (if applicable)

### Production Environment
- **Protection rules:** 
  - Required reviewers (1+)
  - Wait timer (optional)
- **Secrets:** DATABASE_URL, JWT_SECRET, POSTGRES_PASSWORD (production values)
- **URL:** https://taskflow.example.com (if applicable)

---

## Tool Versions

All tools are pinned to specific versions for reproducibility:

| Tool | Version | Used In |
|------|---------|---------|
| Node.js | 20 | ci.yml (build/test) |
| Trivy | 0.50.1 | sbom.yml |
| Trivy Action | @master | ci.yml, security.yml |
| Gitleaks | 8.18.2 (via action v2) | ci.yml |
| Semgrep | v1 (via action) | ci.yml |
| OWASP ZAP | 2.14.0 | security.yml |
| Docker Buildx | v3 | ci.yml |
| GitHub Actions | v4 (checkout/upload) | All |

---

## Workflow Artifacts

### Retention Policies

| Artifact Type | Retention | Workflow |
|---------------|-----------|----------|
| Security scan results (npm audit, Trivy fs, Semgrep) | 30 days | ci.yml |
| Image scan results (Trivy image) | 90 days | ci.yml |
| SBOMs | 90 days | ci.yml, sbom.yml |
| ZAP scan reports | 30 days | security.yml |

### Artifact Naming

- `security-scan-results` — Contains npm-audit-*.json, trivy-fs-*.json, semgrep-results.json
- `image-scan-results` — Contains trivy-image-*.json, sbom-*.json
- `zap-scan-results` — Contains zap-report.json, zap-report.html
- `sboms` — Contains sbom-client.json, sbom-server.json

---

## Workflow Dependencies

```
ci.yml (security-scan) → ci.yml (build-and-test) → deploy.yml (staging)
                                                   ↓
                                              deploy.yml (production, manual)

ci.yml (on tag) → sbom.yml (on release)

security.yml (scheduled, independent)
```

---

## Local Testing

### Test with act (GitHub Actions locally)
```bash
# Install act: https://github.com/nektos/act
act -j security-scan
```

### Validate YAML syntax
```bash
# Install yamllint
pip install yamllint

# Validate all workflows
yamllint .github/workflows/*.yml
```

### Validate with actionlint
```bash
# Run actionlint in Docker
docker run --rm -v "${PWD}:/repo" rhysd/actionlint:latest -verbose /repo/.github/workflows/*.yml
```

---

## Troubleshooting

### Common Issues

**1. Gitleaks fails with secrets detected**
- Check `docker-compose.yml` for hardcoded passwords
- Ensure `.env` files are in `.gitignore`
- Run `git log -p | grep -E 'password|secret'` to find leaked secrets

**2. npm audit fails**
- Run `npm audit fix` locally
- Update vulnerable packages in `package.json`
- Re-run the pipeline

**3. Trivy image scan fails**
- Check Trivy output for specific CVEs
- Update base images in Dockerfiles (e.g., `node:20-alpine` to newer tag)
- Add CVEs to `.trivyignore` if risk is accepted (requires approval)

**4. Tests fail in CI but pass locally**
- Server tests mock Prisma and do not need Postgres
- `JWT_SECRET` is set in the workflow; a dummy fallback exists if `TEST_JWT_SECRET` is unset
- Review test logs in workflow artifacts

**5. Docker build fails**
- CI uses `client/Dockerfile.hardened` and `server/Dockerfile.hardened`
- Check for syntax errors in those Dockerfiles
- Ensure dependencies are correctly specified in `package.json`

**6. Deployment health checks fail**
- Increase wait time in `deploy.yml` (currently 20 seconds)
- Check service logs: `docker compose logs`
- Verify `DATABASE_URL` and `JWT_SECRET` are correctly set

---

## Security Best Practices

1. **Never commit secrets** — Use GitHub Secrets for all sensitive data
2. **Review Trivy findings** — Do not ignore CRITICAL vulnerabilities without team approval
3. **Update dependencies regularly** — Run `npm audit` and `npm update` monthly
4. **Rotate secrets** — Change JWT_SECRET and database passwords periodically
5. **Use branch protection** — Require CI to pass before merging to `main`
6. **Enable GitHub Advanced Security** — For SARIF uploads from Trivy and Semgrep
7. **Review DAST findings** — Weekly ZAP scans identify runtime vulnerabilities

---

## Contact

For questions about the CI/CD pipeline, contact the DevSecOps team or file an issue.
