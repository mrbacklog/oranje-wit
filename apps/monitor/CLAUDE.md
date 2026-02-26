# Verenigingsmonitor — c.k.v. Oranje Wit

Express API + statische HTML dashboards voor ledenbeheer en analyse.

## Stack
- **Backend**: Express.js (Node.js)
- **Frontend**: HTML5 + Chart.js (statische bestanden in `public/`)
- **Database**: PostgreSQL via `pg` (directe queries, geen ORM)
- **Deploy**: Railway

## API Routes

| Endpoint | Bestand | Doel |
|---|---|---|
| `/api/per-geboortejaar` | `routes/aggregaties.js` | Ledenaantal per geboortejaar |
| `/api/per-kleur` | `routes/aggregaties.js` | Ledenaantal per kleur |
| `/api/per-team` | `routes/aggregaties.js` | Ledenaantal per team |
| `/api/instroom-uitstroom` | `routes/verloop.js` | Instroom/uitstroom trends |
| `/api/signalering` | `routes/signalering.js` | Alerts per seizoen |
| `/api/streefmodel` | `routes/model.js` | Streefmodel projecties |
| `/api/categorie-mapping` | `routes/model.js` | A/B categorie mapping |
| `/api/teams-register` | `routes/teams.js` | Teams per seizoen |
| `/health` | `server.js` | Health check (Railway) |

## Dashboards

- `public/verenigingsmonitor.html` — Hoofddashboard (6 tabs)
- `public/monitor-config.json` — Configuratie (endpoints, seizoen)

## Railway Deploy

- Config: `railway.json`
- Start: `node api/server.js`
- Health check: `/health`
- Root directory: `apps/monitor` (instellen in Railway dashboard)

## Data-pipeline scripts (in `scripts/js/`)

| Script | Doel |
|---|---|
| `bereken-verloop.js` | Individueel ledenverloop per seizoenspaar |
| `bereken-cohorten.js` | Cohort-aggregatie over alle seizoenen |
| `genereer-signalering.js` | Signalering met alerts per seizoen |
| `vul-teams-json.js` | Teamregister beheer |
| `export-voor-teamindeling.js` | Export voor Team-Indeling import |
| `migreer-naar-db.js` | Eenmalige JSON → DB import |
