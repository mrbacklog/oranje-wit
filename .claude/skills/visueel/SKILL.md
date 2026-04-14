---
name: visueel
description: Agent visuele inspectie via Playwright MCP. Authenticeer autonoom via agent-login provider, navigeer naar pagina's, maak screenshots, test drag-drop/formulieren en ruim op. Werkt op localhost en productie.
---

# Visueel — Agent Visuele Inspectie

Gebruik deze skill wanneer je frontend-werk visueel wilt beoordelen via Playwright MCP. Verplicht stappenplan — sla geen stap over.

## Vereisten

- Playwright MCP is beschikbaar (`mcp__plugin_playwright_playwright`)
- `AGENT_SECRET` is geconfigureerd in de omgeving (lokaal in `.env.local`, productie in Railway)

---

## Stap 1 — Authenticate

Lees het AGENT_SECRET via Bash:

```bash
# Lokaal (dev)
AGENT_SECRET=$(grep '^AGENT_SECRET=' .env.local 2>/dev/null | cut -d= -f2-)
# Of via shell omgeving
echo $AGENT_SECRET
```

Sla ook een agentRunId op voor deze sessie:

```bash
AGENT_RUN_ID=$(uuidgen 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
echo "AgentRunId: $AGENT_RUN_ID"
```

Gebruik Playwright MCP om in te loggen:

1. Navigeer naar `/api/auth/csrf`
2. Lees de `csrfToken` uit de JSON response
3. POST naar `/api/auth/callback/agent-login` met body:
   ```
   csrfToken=<waarde>&secret=<AGENT_SECRET>
   ```
   Content-Type: `application/x-www-form-urlencoded`
4. Verifieer dat de browser NIET redirect naar `/login`

Bij fout: controleer of `AGENT_SECRET` correct is ingesteld en minimaal 32 tekens lang.

---

## Stap 2 — Inspect

Navigeer naar de pagina's die je wilt beoordelen.

**Screenshots standaard:**
- Desktop: viewport 1440×900
- Mobile: viewport 390×844

Sla op als `e2e/screenshots/agent-<timestamp>-<paginanaam>.png`

**Let op bij elke pagina:**
- Console errors (toon ze expliciet in je rapport)
- Layout breaks of overflow
- Lege states die gevuld zouden moeten zijn
- Loading spinners die blijven draaien
- Ontbrekende afbeeldingen of iconen

---

## Stap 3 — Interact (optioneel)

Als je TI Studio werkbord of indeling wilt testen:

1. Maak een nieuwe werkindeling aan met naam `agent-<AGENT_RUN_ID>`
2. Werk uitsluitend in deze versie
3. Raak de gepubliceerde of actieve versie **nooit** aan

Andere mutaties buiten TI Studio worden gelogd maar niet automatisch opgeruimd. Beperk mutaties buiten TI Studio tot het minimum.

---

## Stap 4 — Cleanup (VERPLICHT)

Roep altijd de cleanup aan, ook als je geen TI Studio versies hebt aangemaakt:

```bash
curl -s -X POST <BASE_URL>/api/agent/cleanup \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"$AGENT_SECRET\", \"agentRunId\": \"$AGENT_RUN_ID\"}"
```

Verifieer dat de response `"ok": true` bevat.

| Omgeving | Base URL |
|---|---|
| Lokaal | `http://localhost:3000` |
| Productie | `https://www.ckvoranjewit.app` |

---

## Stap 5 — Rapporteer

Geef je bevindingen terug aan de aanroepende agent of gebruiker:

- Lijst van bezochte pagina's
- Screenshot-paden (relatief vanuit repo root)
- Eventuele console errors per pagina
- Visuele afwijkingen of problemen
- Of cleanup succesvol was
