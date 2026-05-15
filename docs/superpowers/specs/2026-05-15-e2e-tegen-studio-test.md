# E2E Infrastructuur tegen studio-test.ckvoranjewit.app

**Datum**: 2026-05-15
**Status**: Geïmplementeerd
**App**: `apps/ti-studio-v2`
**Test-omgeving**: `studio-test.ckvoranjewit.app`

---

## Architectuur — 3 lagen

```
Laag 1: Auth setup
  studio-test-auth.setup.ts
    → Basic Auth headers instellen
    → CSRF-token ophalen via /api/auth/csrf
    → POST /api/auth/callback/agent-login (agent-provider)
    → __ow_agent_run_id cookie zetten
    → storage state opslaan in e2e/.auth/studio-test.json

Laag 2: Tests
  e2e/ti-studio-v2/werkbord-dragdrop.spec.ts (en toekomstige specs)
    → beforeAll: agentRunId lezen uit studio-test.json cookies
    → tests draaien met Basic Auth + auth session
    → elke verplaatsSpeler() mutatie wordt gelogd via AgentMutatie (DB)

Laag 3: Cleanup
  afterAll → POST /api/agent/cleanup { secret, agentRunId }
    → query AgentMutatie WHERE agentRunId AND rolledBackAt IS NULL
    → voor elke mutatie: voer inverse uit (verplaatsSpelerInternal)
    → update rolledBackAt = now()
    → response: { ok: true, rolledBack: N }
```

## Hoe te runnen — lokaal

Vereiste env vars:

```bash
STUDIO_TEST_URL=https://studio-test.ckvoranjewit.app
STUDIO_TEST_BASIC_AUTH_USER=tcv2
STUDIO_TEST_BASIC_AUTH_PASS=<zie Railway service 2f40fe63>
STUDIO_TEST_AGENT_SECRET=<zie Railway service vars>
```

Uitvoeren:

```bash
STUDIO_TEST_BASIC_AUTH_USER=tcv2 \
STUDIO_TEST_BASIC_AUTH_PASS=... \
STUDIO_TEST_AGENT_SECRET=... \
pnpm exec playwright test \
  --project=studio-test-auth-setup \
  --project=ti-studio-v2-remote \
  --headed \
  --workers=1
```

Verwacht resultaat:
- `studio-test-auth-setup` slaagt
- Drag-drop tests skippen (PDND-blokker — zie hieronder)
- `drop zonder rechten` test slaagt (structurele verificatie)
- afterAll cleanup roept `/api/agent/cleanup` aan

## Hoe te runnen — CI

Via GitHub Actions workflow `.github/workflows/e2e-studio-test.yml`:

- **On-demand**: GitHub Actions → "E2E tegen studio-test" → "Run workflow"
- **Nightly**: Automatisch dagelijks om 04:00 UTC

Secrets worden geladen vanuit GitHub repository secrets:
- `STUDIO_TEST_BASIC_AUTH_USER`
- `STUDIO_TEST_BASIC_AUTH_PASS`
- `STUDIO_TEST_AGENT_SECRET`

Playwright-rapport wordt geüpload als artifact (14 dagen bewaard).

## Playwright-projecten

| Project | testDir | baseURL | Authenticatie |
|---|---|---|---|
| `studio-test-auth-setup` | `e2e/studio-test-auth.setup.ts` | n.v.t. (setup) | Basic Auth + agent-login |
| `ti-studio-v2-remote` | `e2e/ti-studio-v2/` | `studio-test.ckvoranjewit.app` | studio-test.json storage state |

## Database — AgentMutatie model

Tabel `agent_mutaties` (Prisma migratie `20260515110918_agent_mutaties_toevoegen`):

```prisma
model AgentMutatie {
  id           String    @id @default(cuid())
  agentRunId   String
  type         String    // "speler_verplaats"
  payload      Json
  inverse      Json
  createdAt    DateTime  @default(now())
  rolledBackAt DateTime?

  @@index([agentRunId])
  @@map("agent_mutaties")
}
```

Migratie is additief — geen drops, geen wijzigingen aan bestaande tabellen.

## Cleanup-endpoint

`POST https://studio-test.ckvoranjewit.app/api/agent/cleanup`

```json
{
  "secret": "<AGENT_SECRET>",
  "agentRunId": "<uuid>"
}
```

Handmatige verificatie (zonder mutaties):
```bash
curl -X POST https://studio-test.ckvoranjewit.app/api/agent/cleanup \
  -H "Authorization: Basic <base64(tcv2:pass)>" \
  -H "Content-Type: application/json" \
  -d '{"secret":"<secret>","agentRunId":"00000000-0000-0000-0000-000000000000"}' \
  | jq .
# Verwacht: {"ok":true,"rolledBack":0}
```

## PDND-Playwright-blokker

**Erratum 2026-05-15**: Drag-drop tests (pool→team, team→team, team→pool, persist) skippen in
headless Playwright. Oorzaak: PDND (Pragmatic Drag and Drop) gebruikt pointer events die in
Chromium headless niet correct worden afgevuurd bij `dragTo()`.

Referentie: `docs/superpowers/specs/2026-05-13-drag-drop-library-research.md`

Gevolg:
- In CI: drag-drop tests worden geskipped (geen falen)
- Lokaal met `--headed`: zou kunnen werken, maar niet gegarandeerd
- Oplossing: later via Playwright `mouse.move()` + `dispatchEvent` patroon, of visuele tests

Tests die WEL draaien in headless (en dus CI):
- `drop zonder rechten` — structurele verificatie (altijd groen)
- Toekomstige layout/redirect/auth tests

## Uitbreiding — toekomstige mutatie-types

Het `AgentMutatie.type` veld is extensible. Voeg nieuwe types toe door:

1. Type toevoegen aan server action (bijv. `"team_aanmaken"`)
2. Inverse uitwerken in het cleanup-endpoint (`route.ts` switch-statement)
3. `verplaatsSpelerInternal`-patroon volgen: internal helper zonder audit,
   server action wrapt die met audit-logging

Geen schema-wijziging nodig voor nieuwe mutatie-types.
