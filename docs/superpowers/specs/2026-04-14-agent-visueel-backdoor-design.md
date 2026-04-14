# Agent Visueel Backdoor — Design Spec

**Datum:** 2026-04-14  
**Status:** Goedgekeurd  
**Auteur:** Antjan + Claude  

---

## Probleemstelling

Agents kunnen het gedeployde frontend-werk niet zelfstandig visueel beoordelen. De twee blockers:

1. **Auth**: Agents kunnen niet autonoom authenticeren op productie — de huidige `PRODUCTION_SESSION_TOKEN` vereist handmatige sessie-ophaling en verloopt.
2. **Discoverability**: Agents weten niet dat ze de Playwright MCP kunnen gebruiken voor visuele inspectie.

Het doel is dat agents zelfstandig (zonder menselijke voorbereiding) kunnen inloggen, navigeren, screenshotten en beperkte acties uitvoeren — op zowel localhost als productie.

---

## Gekozen aanpak

**Agent Credentials Provider + Playwright MCP skill**

Een nieuwe NextAuth Credentials provider `agent-login` werkt in alle omgevingen (dev én prod), beveiligd door een `AGENT_SECRET` env var. Agents gebruiken de bestaande Playwright MCP om via deze provider in te loggen. Een nieuwe `visueel` skill geeft agents een kant-en-klaar stappenplan.

**Niet gekozen:**
- Screenshot API endpoint (server-side Playwright, te zwaar, geen interactiviteit)
- Token-roterende JWT auth (onnodige complexiteit)
- Volledig losse sandbox-database (vereist fundamentele Prisma-refactor, alleen met expliciete go van Antjan)

---

## Sectie 1: Authentication flow

### Agent-login provider

Een nieuwe NextAuth Credentials provider die in **alle omgevingen** werkt, anders dan de bestaande `dev-login` die alleen actief is bij `E2E_TEST=true`.

**Flow:**

```
Agent (via Playwright MCP browser)
  → GET  /api/auth/csrf
  → POST /api/auth/callback/agent-login
        body: { csrfToken, secret: AGENT_SECRET }
  → NextAuth valideert secret tegen process.env.AGENT_SECRET
  → Sessie aangemaakt: TC-rechten + isAgent: true + agentRunId (UUID)
  → Browser geauthenticeerd — agent kan navigeren, klikken, screenshotten
```

### AGENT_SECRET beheer

| Omgeving | Locatie |
|---|---|
| Lokaal | `.env.local` — handmatig door Antjan toe te voegen |
| Productie | Railway env var — handmatig door Antjan in te stellen |

- Agents lezen het secret via Bash: `echo $AGENT_SECRET`
- Nooit in git, nooit gelogd
- De skill instrueert agents expliciet hoe ze het secret ophalen

### Sessie-identiteit

De agent-sessie heeft dezelfde TC-rechten als een gewone TC-gebruiker, plus:

```typescript
session.user.isAgent = true
session.user.agentRunId = "uuid-v4"  // uniek per agent-sessie
```

Deze velden worden gebruikt voor audit-logging en cleanup.

---

## Sectie 2: Sandbox strategie

Agents kunnen beperkte mutaties uitvoeren. Om vervuiling van productiedata te voorkomen:

### TI Studio (werkindeling/werkbord)

Agents maken een nieuwe versie aan met naam `agent-[agentRunId]`. Ze raken nooit de gepubliceerde of actieve versie aan. De agent-versie wordt verwijderd in de cleanup-stap.

### Overige mutaties

Agents vermijden actief mutaties buiten TI Studio. In de praktijk zullen agents voornamelijk navigeren en screenshotten — zware mutaties zijn eerder localhost-werk waar de data toch reset-baar is.

Voor de initiële implementatie geldt: als een agent toch een mutatie doet buiten TI Studio (bijv. een scouting-notitie aanmaken), wordt dit gelogd via `logger.warn` maar **niet** automatisch opgeruimd. Uitbreiding naar getagde cleanup per tabel is een toekomstige stap die dan wél een database-migratie vereist.

### Volledig losse sandbox-database

Alleen inzetbaar met **expliciete toestemming van Antjan**. Vereist fundamentele aanpassing van de Prisma-client (van singleton naar per-request instantiatie) plus Railway provisioning en data-sync. Dit is geen standaard optie.

---

## Sectie 3: Cleanup endpoint

```
POST /api/agent/cleanup
Authorization: secret in request body

Body: {
  secret: string    // AGENT_SECRET
  agentRunId: string
}

Response: {
  ok: true
  deleted: {
    werkindelingVersions: number
    overigeMutaties: number
  }
}
```

**Wat het opruimt:**
- Alle werkindeling-versies met naam `agent-[agentRunId]`
- Alle overige rijen getagd met `agentRunId` (toekomstige uitbreiding)

Agents zijn **verplicht** om cleanup aan te roepen aan het einde van elke sessie. De `visueel` skill maakt dit afdwingbaar.

---

## Sectie 4: De `visueel` skill

Bestand: `.claude/skills/visueel/SKILL.md`

De skill geeft agents een verplicht stappenplan:

### Stap 1 — Authenticate
```bash
# Secret ophalen
AGENT_SECRET=$(grep AGENT_SECRET .env.local | cut -d= -f2)

# agentRunId genereren
AGENT_RUN_ID=$(uuidgen)
```
Via Playwright MCP:
- Navigeer naar `/api/auth/csrf` → lees csrfToken
- POST naar `/api/auth/callback/agent-login` met `{ csrfToken, secret }`
- Verifieer dat je niet redirect naar `/login`

### Stap 2 — Inspect
- Navigeer naar de relevante pagina('s)
- Screenshot desktop: viewport 1440×900
- Screenshot mobile: viewport 390×844
- Sla op als `e2e/screenshots/agent-[timestamp]-[pagina].png`
- Let op: console errors, layout breaks, lege states, loading spinners

### Stap 3 — Interact (optioneel)
- TI Studio: maak eerst een agent-versie aan (`agent-[agentRunId]`)
- Overige acties: worden automatisch getagd via sessie
- Nooit de gepubliceerde versie aanraken

### Stap 4 — Cleanup (verplicht)
```
POST /api/agent/cleanup
{ secret: AGENT_SECRET, agentRunId: AGENT_RUN_ID }
```
Verifieer dat de response `ok: true` is.

### Stap 5 — Rapporteer
- Geef bevindingen terug aan de aanroepende agent of gebruiker
- Voeg screenshot-paden toe zodat ze direct te openen zijn
- Meld eventuele console errors of visuele afwijkingen expliciet

---

## Bestanden

### Nieuw

| Bestand | Wat |
|---|---|
| `packages/auth/src/agent-provider.ts` | `agent-login` Credentials provider |
| `apps/web/src/app/api/agent/cleanup/route.ts` | Cleanup endpoint |
| `.claude/skills/visueel/SKILL.md` | Agent-skill voor visuele inspectie |

### Aangepast

| Bestand | Wat |
|---|---|
| `packages/auth/src/index.ts` | Agent-provider registreren in NextAuth config |
| `packages/auth/src/types.ts` | `isAgent` en `agentRunId` toevoegen aan Session type |
| `.claude/agents/e2e-tester.md` | `visueel` skill toevoegen |
| `.claude/agents/frontend.md` | `visueel` skill toevoegen |
| `.claude/agents/ux-designer.md` | `visueel` skill toevoegen |
| `.claude/agents/ontwikkelaar.md` | `visueel` skill toevoegen |

### Handmatige stappen (Antjan)

| Actie | Waar |
|---|---|
| `AGENT_SECRET=<sterk-random-secret>` toevoegen | `.env.local` |
| `AGENT_SECRET=<zelfde-waarde>` instellen | Railway env vars |

---

## Database-migraties

**Geen migraties nodig voor de initiële implementatie.** De TI Studio sandbox werkt via het bestaande naamveld van de werkindeling-versie tabel (`agent-[uuid]`). Overige mutaties worden in v1 alleen gelogd, niet getagd per rij.

Wanneer in een latere fase per-rij cleanup wenselijk wordt voor andere tabellen (scouting, evaluatie), vereist dat een aparte migratie met een `agentRunId` kolom. Dat is buiten scope voor nu.

---

## Veiligheid

- `AGENT_SECRET` heeft minimaal 32 tekens (afdwingen in provider-code)
- De cleanup-endpoint valideert het secret vóór elke actie
- Agent-sessies hebben een kortere TTL dan normale sessies (bijv. 4 uur vs. 30 dagen)
- `isAgent: true` sessies worden gelogd via `logger.info` in development, `logger.warn` in productie
- Agents hebben **geen** schrijftoegang tot gebruikersbeheer, seizoensinstellingen of publiceer-acties
