# TaskFlow DevSecOps Pipeline

This repository includes two equivalent pipelines: GitHub Actions (`.github/workflows/`) and Jenkins (`Jenkinsfile`). Both build **hardened** images, scan for secrets and vulnerabilities, run unit tests, generate SBOMs, and can deploy with injected secrets.

This is a honeypot with intentional vulnerabilities. Scan tools are expected to report findings. CI records those reports as artifacts and does **not** fail the build on known honeypot CVEs.

## Pipelines at a glance

| Stage | GitHub Actions | Jenkins | Tool / version |
| --- | --- | --- | --- |
| 1. Checkout | `ci.yml` | Checkout | git |
| 2. Secret detection | Gitleaks Action v2 | Gitleaks **8.18.2** | `.gitleaks.toml` |
| 3. Dependency scan | npm audit + Trivy fs | npm audit + Trivy **0.50.1** | `.trivy.yaml` |
| 4. SAST | Semgrep Action v1 | Semgrep (Docker) | `p/javascript`, `p/react`, `p/nodejs`, `p/security-audit` |
| 5. Unit tests | Jest (server) + Vitest (client) | same | Prisma mocked in Jest |
| 6. Image build | `Dockerfile.hardened` | same | client nginx + server nodejs:1001 |
| 7. Image scan | Trivy image | Trivy image | CRITICAL/HIGH reported |
| 8. SBOM | CycloneDX | CycloneDX | Trivy |
| 9. Security gate | informational (`exit-code: 0`) | `FAIL_ON_CRITICAL=false` | set true for a blocking gate |
| 10. Registry push | GHCR (non-PR) | Docker Hub on `main` | |
| 11. Deploy / DAST | `deploy.yml` + `security.yml` ZAP **2.14.0** | Deploy + ZAP on `main` | |

Scheduled full-repo Trivy + ZAP live in `security.yml`. Release SBOM attestation lives in `sbom.yml`.

## Secrets

Never commit real credentials. Copy `.env.example` to `.env` for local Compose.

### GitHub Actions

Configure in **Settings → Secrets and variables → Actions**:

| Secret | Used by |
| --- | --- |
| `JWT_SECRET` | `security.yml`, `deploy.yml` |
| `DATABASE_URL` | `security.yml`, `deploy.yml` |
| `POSTGRES_PASSWORD` | `security.yml`, `deploy.yml` |
| `TEST_JWT_SECRET` | optional; server unit tests have a built-in fallback |
| `TEST_DATABASE_URL` | unused; server tests mock Prisma and do not need Postgres |
| `GITLEAKS_LICENSE` | optional Gitleaks Pro |
| `GITHUB_TOKEN` | provided automatically |

Create GitHub Environments named `staging` and `production`. Production should require reviewers.

### Jenkins

Create credentials:

- `docker-hub-credentials` (username/password)
- `jwt-secret`, `database-url`, `postgres-password` (secret text)

## Tests in CI

Server `auth.test.js` mocks `src/config/database` so Jest does **not** need a live Postgres instance. Set `JWT_SECRET` and `JWT_EXPIRES_IN` only. Coverage thresholds are 0 until more suites exist (70% remains the documented target).

Client tests use Vitest + Testing Library and do not need a browser.

E2E (`npx playwright test`) expects Compose already running on `http://localhost`.

## Local runs

```bash
cp .env.example .env
# fill POSTGRES_PASSWORD, DATABASE_URL, JWT_SECRET

npm run test:server
npm run test:client
npm run test:all

docker compose up -d
npx playwright test
docker compose down

# GitHub Actions locally (optional)
act -j security-scan
```

## Interpreting results

- **Gitleaks**: real secrets in app config fail the scan. `node_modules`, docs, and known honeypot fixtures are allowlisted in `.gitleaks.toml`.
- **Trivy**: JSON artifacts list CVEs. Ignore only with a dated reason in `.trivyignore`.
- **npm audit / Semgrep / ZAP**: informational in this honeypot; reports are archived.
- **Security gate**: Jenkins counts CRITICAL image CVEs. Set `FAIL_ON_CRITICAL=true` to block.

## Failure conditions (non-honeypot mode)

To make the pipeline fail-closed, set Trivy `exit-code: "1"` in `ci.yml` and `FAIL_ON_CRITICAL=true` in the Jenkinsfile. Gitleaks and npm audit currently use `continue-on-error` because this repo ships vulnerable packages on purpose.

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| Trivy timeout / DB download | Retry; timeout is 10m in `.trivy.yaml` |
| Gitleaks hangs | Confirm `node_modules/` is in the Gitleaks allowlist |
| npm audit fails | Expected here; reports still upload |
| Docker socket permission (Jenkins) | Run the agent user in the `docker` group |
| Compose missing env | Copy `.env.example` and set all three secrets |
| Windows Jenkins volume mounts | Use a Linux agent; `${WORKSPACE}:/repo` is the Linux form |

## Tool docs

- [Trivy](https://trivy.dev/)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [Semgrep](https://semgrep.dev/docs/)
- [OWASP ZAP](https://www.zaproxy.org/docs/)
