# Monitoring & Incident Response

## Health Endpoints

| Endpoint | URL | Wat het checkt |
|---|---|---|
| Hoofd | https://www.ckvoranjewit.app/api/health | App + database |
| Scouting | https://www.ckvoranjewit.app/api/scouting/health | App + database |

### Response formaat
```json
{
  "status": "ok | degraded",
  "app": "oranje-wit",
  "version": "git-sha",
  "timestamp": "ISO",
  "checks": {
    "database": { "status": "ok | error", "latencyMs": 12 }
  }
}
```

- HTTP 200 = gezond
- HTTP 503 = database onbereikbaar -> Railway herstart automatisch

## Uptime Monitoring opzetten

### Optie 1: UptimeRobot (gratis)
1. Maak account op https://uptimerobot.com
2. Voeg HTTP(s) monitor toe: `https://www.ckvoranjewit.app/api/health`
3. Interval: 5 minuten
4. Alert contacts: TC-emailadressen
5. Keyword monitoring: check op `"status":"ok"` in response body

### Optie 2: Cloudflare Health Checks
1. Ga naar Cloudflare Dashboard -> ckvoranjewit.app -> Traffic -> Health Checks
2. Voeg check toe op `/api/health`
3. Verwacht HTTP 200
4. Notificatie via Cloudflare email

## Bij downtime

### Stap 1: Diagnose
```bash
# Health check handmatig
curl -s https://www.ckvoranjewit.app/api/health | jq .

# Direct Railway backend testen (bypass Cloudflare)
curl -s https://ckvoranjewitapp-production.up.railway.app/api/health | jq .
```

### Stap 2: Railway Dashboard
1. Ga naar https://railway.com -> project Oranje Wit
2. Check deployment status en logs
3. "Redeploy" knop voor herstart van laatste deploy
4. "Rollback" knop om naar vorige versie te gaan

### Stap 3: Database
1. Check of de PostgreSQL service draait in Railway
2. Bekijk database logs
3. Check disk usage en connection count

### Stap 4: Cloudflare
1. Check of de Worker draait: Cloudflare Dashboard -> Workers
2. Bekijk Worker analytics voor error rates

## CI/CD Pipeline

**CI (GitHub Actions)** doet kwaliteitscontrole:
1. **Quality**: typecheck, lint, format, unit tests
2. **Build**: Next.js production build
3. **E2E**: Playwright tests

**Deploy (Railway auto-deploy)** doet de deployment:
- Railway bouwt en deployt automatisch bij elke push naar main
- Health check via `/api/health` (geconfigureerd in `railway.json`)
- Bij crash: Railway herstart automatisch (restart policy: ON_FAILURE)
- Rollback: via Railway Dashboard "Rollback" knop

De deployment en CI zijn ontkoppeld: CI controleert de code, Railway deployt.

## Logs bekijken

Railway bewaart logs tijdelijk. Bekijk ze via:
- Railway Dashboard -> Service -> Logs tab
- Productie-logs zijn JSON-lines (structured logging)

Zoek op:
- `"level":"error"` -- fouten
- `"level":"warn"` -- waarschuwingen
- `Health check database fout` -- DB-problemen
