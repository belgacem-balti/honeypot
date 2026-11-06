# DevSecOps Pipeline Demo Report

**Project:** TaskFlow honeypot (`belgacem-balti/honeypot`)  
**Repo:** https://github.com/belgacem-balti/honeypot  
**Actions:** https://github.com/belgacem-balti/honeypot/actions  
**Date:** 6 November 2026

This document is a script for screenshots, a short demo video, and a written report. The application is a honeypot: scanners are supposed to find problems.

## 1. What to show (2–3 minute video)

| Time | Scene | Where | What to say |
| --- | --- | --- | --- |
| 0:00 | Repo overview | GitHub code tab | Full-stack TaskFlow app with GitHub Actions + Jenkins |
| 0:20 | Workflow files | `.github/workflows/` | Four workflows: CI, security, deploy, SBOM |
| 0:40 | Hardened Docker | `server/Dockerfile.hardened` | Non-root user, healthcheck, multi-stage build |
| 1:00 | Secret leak bait | `docker-compose.insecure.yml` | Intentional hardcoded secrets for Gitleaks |
| 1:20 | Actions run | Actions → **CI Pipeline** | Jobs `security-scan` then `build-and-test` |
| 1:50 | Job logs | Expand Gitleaks, Trivy, tests | Tools ran; reports uploaded as artifacts |
| 2:10 | Artifacts | Run summary → Artifacts | Download `security-scan-results`, `image-scan-results` |
| 2:30 | Local tests | Terminal: `npm run test:all` | 4 server + 4 client tests, no database required |

## 2. Screenshot checklist

1. GitHub repo home with README.
2. **Actions** tab showing the latest **CI Pipeline** run (green or yellow is expected; this honeypot does not fail on known CVEs).
3. `security-scan` job log: Gitleaks step + Trivy filesystem steps.
4. `build-and-test` job log: `npm test` (server + client) and Docker build of `Dockerfile.hardened`.
5. Artifacts list on the run page.
6. File view of `.github/workflows/ci.yml` (hardened Dockerfiles, Trivy `exit-code: "0"`).
7. File view of `PIPELINE.md`.
8. Optional local: `docker compose config` (after filling `.env`) with no hardcoded passwords.
9. Optional Jenkins: Blue Ocean / classic stage view of the `Jenkinsfile` (if Jenkins is running).

## 3. Pipeline stages (for the written report)

| # | Stage | Tool | Output you can screenshot |
| --- | --- | --- | --- |
| 1 | Checkout | git | Start of each job |
| 2 | Secrets | Gitleaks 8.18.2 | Step log; allowlist skips `node_modules` |
| 3 | Dependencies | npm audit, Trivy fs | JSON artifacts |
| 4 | SAST | Semgrep | `semgrep-results.json` |
| 5 | Tests | Jest, Vitest | Test summary in the log |
| 6 | Build | Docker Buildx | `Dockerfile.hardened` |
| 7 | Image scan | Trivy image | `trivy-image-*.json` |
| 8 | SBOM | Trivy CycloneDX | `sbom-*.json` |
| 9 | Gate | Informational | Honeypot does not fail on CRITICAL |
| 10 | Push | GHCR | Skipped on pull requests |
| 11 | DAST | OWASP ZAP 2.14.0 | `security.yml` weekly / manual |

## 4. How to watch live logs after push

1. Open https://github.com/belgacem-balti/honeypot/actions
2. Click the newest **CI Pipeline** run on `main`.
3. Click **Security Scans**, then each step.
4. Click **Build & Test** for tests and image builds.
5. Scroll to **Artifacts** at the bottom of the run summary.

If Actions never starts: **Settings → Actions → General** must allow workflows. The first run needs `GITHUB_TOKEN` (automatic). Deploy and ZAP need `JWT_SECRET`, `DATABASE_URL`, and `POSTGRES_PASSWORD`.

## 5. Local commands for extra footage

```bash
cd honeypot
npm run test:all
python -m yamllint .github/workflows/*.yml
# After copying .env.example to .env and filling values:
docker compose config
```

## 6. Honest results to put in the report

- **Tests:** server auth (mocked Prisma) 4/4; client TaskCard 4/4.
- **YAML:** workflows pass yamllint with `.yamllint.yaml`.
- **Secrets in git:** real `.env` is gitignored. Demo files (`docker-compose.insecure.yml`, `kubernetes-secrets.yaml`, `.git-secrets-example`) are planted findings.
- **Vulnerabilities:** axios, jsonwebtoken, lodash, etc. are pinned old on purpose (`VULNERABILITIES-ADDED.md`). Trivy/npm audit **will** report CRITICAL/HIGH. CI records them instead of failing so the demo can finish.
- **Gitleaks full disk scan** of `node_modules` is slow; CI uses git history so those folders are not scanned.

## 7. Suggested report outline (copy into Word/PDF)

1. Introduction — honeypot vs production posture  
2. Architecture — client, server, Postgres, two pipelines  
3. Controls — Gitleaks, Trivy, Semgrep, npm audit, ZAP, SBOM  
4. Evidence — Actions screenshots + artifact files  
5. Findings — planted secrets, known CVEs, missing coverage  
6. Limitations — informational security gate, no live Jenkins in this push  
7. Conclusion — pipeline is runnable; app is still insecure by design  
