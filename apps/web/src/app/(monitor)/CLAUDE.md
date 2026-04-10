# (monitor) — Verenigingsmonitor domein

## Wat
Dashboards en analyses op ledendata, cohorten, competitie en retentie. Read-only domein.

## Styling
- Light mode — monitor-specifieke Tailwind classes
- Geen dark mode styling nodig

## Datamodel (lees-tabellen)
| Tabel | Wat |
|---|---|
| `leden` | Alle leden, met `rel_code` als identifier |
| `speler_seizoenen` | VIEW — korfballeeftijd, categorie, team per seizoen |
| `competitie_spelers` | Speelminuten, goals, wedstrijden |
| `cohort_seizoenen` | Cohort-retentie per seizoen |

- **Schrijft NIET** naar teamindeling-tabellen (`scenario_teams`, `plaatsingen`, etc.)
- Queries staan in `apps/web/src/lib/monitor/queries/`

## Patronen
- Alle data-fetching via Server Components of Server Actions
- `speler_seizoenen` is een VIEW — nooit droppen, nooit via Prisma migreren
- Signaleringen (doorstroom, retentie) via `src/lib/teamindeling/doorstroom-signalering.ts`

## Submappen
| Map | Inhoud |
|---|---|
| `monitor/dashboard/` | Hoofd-KPI's en signaleringen |
| `monitor/spelers/` | Spelerprofiel en historiek |
| `monitor/retentie/` | Retentie-analyse per cohort |
| `monitor/samenstelling/` | Teamsamenstelling overzicht |
| `monitor/projecties/` | Prognoses komend seizoen |
