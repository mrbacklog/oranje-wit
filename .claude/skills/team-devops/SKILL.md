---
name: team-devops
description: Start het DevOps-team voor observatie en monitoring. Health checks, CI status, infrastructure issues, DNS/SSL troubleshooting. GEEN deploys — die gaan via /team-release.
disable-model-invocation: true
argument-hint: "<opdracht: health-check | ci-status | troubleshoot | dx>"
---

# Agent Team: DevOps (Monitoring & Observatie)

Start dit team voor **observatie, monitoring en infrastructure troubleshooting**. Niet voor deploys — die gaan via `/team-release`.

## ⛔ Dit team deployt NIET

Deploys (patch of release) gaan altijd via `/team-release`. Dit team observeert en triageert.

## Team samenstelling

### Lead: devops
- Health checks uitvoeren op alle services
- CI status monitoren en failure analyseren
- Triageren: is het een platform-issue of code-issue?
- Rapporteert status en aanbevelingen

### Teammate 1: deployment
- Railway en Cloudflare troubleshooting
- DNS, SSL, custom domain issues
- Build-log analyse
- Environment variables

### Teammate 2: e2e-tester (optioneel)
- Post-deploy smoke tests (read-only, geen code-wijzigingen)
- Test-failures analyseren

## Modi

### Modus A: Health Check
```
/team-devops health-check
```
1. devops laadt `/health-check` (alle services, DB, DNS, SSL)
2. Bij rode items: spawnt `deployment` voor platform-issues
3. Rapporteert stoplicht-overzicht

### Modus B: CI Status
```
/team-devops ci-status
```
1. devops laadt `/ci-status` (recente GitHub Actions runs)
2. Bij failure: analyseert oorzaak (platform vs code)
3. Rapporteert met aanbeveling (fix code of escaleer naar PO)

### Modus C: Troubleshoot
```
/team-devops troubleshoot <beschrijving>
```
1. devops triageert het probleem
2. Spawnt `deployment` voor platform/DNS/Railway issues
3. Rapporteert bevindingen en aanbevelingen

## Deploy-flow ter referentie

Voor deploy-beslissingen:

```
Antjan of PO → /team-release <patch|release> <scope>
```

Zie `/team-release` voor de volledige deploy-workflow.

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is: voer health-check + ci-status uit en rapporteer.
