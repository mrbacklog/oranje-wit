# TI Studio Release Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Valideer de TI Studio werkindeling-app vóór release via drie waves: smoke test + code audit + P0-triage (Wave 1), E2E tests schrijven + P0-fixes (Wave 2), en volledige verificatierun (Wave 3).

**Architecture:** Drie opeenvolgende waves met parallelle agents per wave. Wave 1 levert bevindingen, Wave 2 bouwt daarop voort, Wave 3 verifieert het geheel. Tussen waves beoordeelt de coördinerende agent de resultaten en neemt go/no-go beslissingen.

**Tech Stack:** Next.js 16, Playwright, Vitest, Prisma, pnpm workspaces

---

## Bestanden die dit plan aanmaakt

| Bestand | Aangemaakt door |
|---|---|
| `e2e/ti-studio/drag-drop.spec.ts` | Wave 2, Agent 5 |
| `e2e/ti-studio/versie-cyclus.spec.ts` | Wave 2, Agent 5 |
| `e2e/ti-studio/memo.spec.ts` | Wave 2, Agent 5 |
| `e2e/ti-studio/validatie.spec.ts` | Wave 2, Agent 5 |
| `e2e/ti-studio/personen-werkbord.spec.ts` | Wave 2, Agent 5 |
| `e2e/ti-studio/smoke-report.md` | Wave 1, Agent 2 |
| `e2e/ti-studio/code-audit-report.md` | Wave 1, Agent 1 |
| `e2e/ti-studio/p0-triage.md` | Wave 1, Agent 3 |
| Vitest unit tests in `__tests__/` per component | Wave 1, Agent 4 |

---

## Task 1: Voorbereiding

**Files:**
- Read: `playwright.config.ts`
- Read: `e2e/auth.setup.ts`
- Read: `src/components/ti-studio/werkbord/TiStudioShell.tsx`
- Read: `src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

- [ ] **Stap 1: Verifieer dat de e2e auth state bestaat**

```bash
ls e2e/.auth/user.json
```

Als het bestand ontbreekt: run `pnpm exec playwright test --project=setup` en wacht tot het klaar is.

- [ ] **Stap 2: Check dat de dev server bereikbaar is**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ti-studio
```

Verwacht: `200` of `307`. Als de server niet draait: `pnpm dev:web` in de achtergrond starten en wachten tot poort 3000 bereikbaar is.

- [ ] **Stap 3: Maak de output-map aan**

```bash
mkdir -p e2e/ti-studio
```

- [ ] **Stap 4: Lees de bekende P0-backlog**

Lees `C:\Users\Antjan\.claude\projects\c--Users-Antjan-oranje-wit\memory\project_ti-studio-werkbord-backlog.md` voor de volledige P0–P3 lijst. Dit is de input voor Wave 1 Agent 3.

- [ ] **Stap 5: Commit voorbereiding**

```bash
git add e2e/ti-studio/
git commit -m "chore(ti-studio): maak e2e/ti-studio map aan voor release audit"
```

---

## Task 2: Wave 1 — Dispatch 4 parallelle agents

Dispatch alle vier agents in één bericht (parallel). Wacht tot alle vier gereed zijn voor Task 3.

- [ ] **Stap 1: Dispatch Agent 1 — Code Audit**

Type: `feature-dev:code-reviewer`

Prompt:
```
Je doet een code audit van de TI Studio werkindeling-app in de monorepo c:\Users\Antjan\oranje-wit.

Scope — lees ALLE bestanden in:
- src/components/ti-studio/werkbord/ (25+ componenten)
- src/app/(teamindeling-studio)/ti-studio/ (pages + API)
- src/app/api/ti-studio/ (route handlers)
- Zoek naar server actions voor ti-studio: grep -r "ti-studio\|werkindeling\|TiStudio" src/app --include="*.ts" -l

Check per bestand:
1. TypeScript: zijn er 'any' casts op kritische grenzen (DB→component, API→state)?
2. Auth guards: elke POST/PUT/DELETE route heeft guardTC() of requireTC(). Ontbrekende guards = kritisch.
3. API contract: klopt het type dat /api/ti-studio/indeling/[versieId] returnt met wat TiStudioShell verwacht?
4. SSE stream: is /api/ti-studio/indeling/[versieId]/stream/route.ts correct geïmplementeerd (proper cleanup, geen leak)?
5. Error handling: geen lege catch blocks, altijd logger.warn/error.
6. Data flow: speler uit SpelersPoolDrawer → drop → TiStudioShell state → PUT /api → DB. Traceer dit pad volledig.

Output: sla op als e2e/ti-studio/code-audit-report.md met:
- ## Kritisch (moet gefixed voor release)
- ## Waarschuwing (tech debt, niet blokkerend)
- ## Info (observaties)

Per bevinding: bestandspad:regelnummer, beschrijving, ernst.
```

- [ ] **Stap 2: Dispatch Agent 2 — Playwright Smoke Test**

Type: `e2e-tester`

Prompt:
```
Je voert een Playwright smoke test uit van de TI Studio in c:\Users\Antjan\oranje-wit.

VEREIST: dev server draait op http://localhost:3000. Check eerst: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 — als niet 200/307, stop en meld.

Auth setup: e2e/.auth/user.json bestaat al (gecreëerd door auth.setup.ts). Playwright config staat in playwright.config.ts. Gebruik storageState: './e2e/.auth/user.json' in je tests.

Schrijf een Playwright script dat de volgende 5 flows doorloopt als echte gebruiker. Maak screenshots na elke kritische stap. Sla screenshots op in e2e/screenshots/smoke/.

Flow 1 — Drag & drop:
1. Ga naar /ti-studio/indeling
2. Wacht tot de werkbord-pagina geladen is (zoek naar een TeamKaart)
3. Open de SpelersPool drawer (zoek de knop)
4. Sleep een spelerkaart naar een team (als drag/drop niet werkt: noteer exact de foutmelding)
5. Klik opslaan
6. Herlaad de pagina
7. Controleer: speler staat nog in het team

Flow 2 — Versie-cyclus:
1. Ga naar /ti-studio/indeling
2. Maak een kleine wijziging (sleep een speler)
3. Klik opslaan
4. Controleer: geen foutmelding, succesmelding of indicator zichtbaar

Flow 3 — Memo:
1. Ga naar /ti-studio/memo
2. Maak een nieuw memo aan
3. Bewerk de titel
4. Sluit/archiveer het memo
5. Controleer: memo verdwenen of gearchiveerd

Flow 4 — Validatie:
1. Ga naar /ti-studio/indeling
2. Open de ValidatieDrawer (zoek de knop in de toolbar)
3. Controleer: validatieresultaten zichtbaar (groen/oranje/rood indicators)

Flow 5 — Personen + werkbord koppeling:
1. Ga naar /ti-studio/personen/spelers
2. Pin een speler (klik de pin-knop)
3. Ga naar /ti-studio/indeling
4. Open de SpelersPool drawer
5. Controleer: gepinde speler zichtbaar in de "Gepind" sectie

Output: sla op als e2e/ti-studio/smoke-report.md met per flow:
- ✅ PASS / ❌ FAIL
- Exacte foutmelding als FAIL
- Screenshot-pad
- Welke stap faalde

Schrijf een spec bestand `e2e/ti-studio/smoke.spec.ts` en run het met:
`pnpm exec playwright test e2e/ti-studio/smoke.spec.ts --project=web --reporter=list`
```

- [ ] **Stap 3: Dispatch Agent 3 — P0-triage**

Type: general-purpose

Prompt:
```
Je doet een P0-triage voor de TI Studio werkindeling-app in c:\Users\Antjan\oranje-wit.

Lees eerst:
- memory bestand: C:\Users\Antjan\.claude\projects\c--Users-Antjan-oranje-wit\memory\project_ti-studio-werkbord-backlog.md
- src/components/ti-studio/werkbord/TiStudioShell.tsx (hoofdstate)
- src/components/ti-studio/werkbord/TeamKaart.tsx
- src/components/ti-studio/werkbord/WerkbordCanvas.tsx (voor canvas panning)
- src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx
- src/components/ti-studio/werkbord/ValidatieDrawer.tsx (als het bestaat)

Beoordeel elk P0-item uit de backlog op drie criteria:
1. BLOKKEREND: voorkomt dagelijks TC-gebruik zonder workaround?
2. WORKAROUND: is er een tijdelijke werkwijze?
3. COMPLEXITEIT: klein (< 1u), middel (1-4u), groot (> 4u)

P0-backlog items:
1. Kaartformaat auto-update na drop (viertal→achtal bij ≥5 spelers) — TiStudioShell.tsx
2. Validatielogica V/M-balans per team in ValidatieDrawer
3. Toast bij opslaan succes/fout — TiStudioShell.tsx
4. Speler-duplicaat blokkeren met UI-feedback

Sla ook de P1-items op in het rapport (zonder diepgaande analyse).

Output: sla op als e2e/ti-studio/p0-triage.md met:
## P0-items
| Item | Blokkerend? | Workaround | Complexiteit | Advies |
|---|---|---|---|---|
...

## P1-items (korte scan)
...

## Aanbeveling
Wat moet er gefixed voor release? Wat kan erna?
```

- [ ] **Stap 4: Dispatch Agent 4 — Unit test scan**

Type: general-purpose (met schrijftoegang)

Prompt:
```
Je schrijft gerichte Vitest unit tests voor de business logic in de TI Studio werkindeling-app in c:\Users\Antjan\oranje-wit.

Lees eerst deze bestanden:
- src/components/ti-studio/werkbord/TiStudioShell.tsx
- src/lib/ti-studio/ (als de map bestaat, anders grep naar helperfuncties in TiStudioShell)
- src/components/ti-studio/werkbord/TeamKaart.tsx

Identificeer pure functies en state-transformaties die GEEN React-rendering nodig hebben om te testen. Voorbeelden: een functie die bepaalt of een speler al in een team zit, kaartformaat-berekening (viertal/zestal/achtal op basis van spelersaantal), validatieberekening.

Schrijf Vitest unit tests ALLEEN voor:
- Pure functies (input → output, geen side effects)
- State-reducers of state-transformaties
- Validatielogica (als die als losse functie bestaat)

NIET testen: React componenten, API calls, database queries.

Locatie: maak tests naast de bronbestanden aan als `*.test.ts` (niet `.tsx` tenzij JSX nodig is).

Testpatroon:
- Importeer de functie direct
- describe/it blocks, geen test.each tenzij echt nuttig
- Minimale setup, geen mocks tenzij absoluut noodzakelijk

Run na het schrijven: pnpm test -- --reporter=verbose
Verwacht: alle nieuwe tests groen.

Output: rapporteer welke functies je getest hebt en welke je NIET kon testen (omdat ze verstrengeld zijn met React/DB) — dat zijn kandidaten voor toekomstige refactoring.
```

---

## Task 3: Wave 1 — Resultaten verwerken

Wacht tot alle vier Wave 1 agents klaar zijn. Lees dan hun rapporten.

- [ ] **Stap 1: Lees de vier rapporten**

```bash
cat e2e/ti-studio/code-audit-report.md
cat e2e/ti-studio/smoke-report.md
cat e2e/ti-studio/p0-triage.md
```

- [ ] **Stap 2: Maak een Wave 1 samenvatting**

Schrijf een kort beslissingsoverzicht (max 20 regels) naar `e2e/ti-studio/wave1-beslissing.md`:

```markdown
# Wave 1 Beslissing — [datum]

## Go/No-Go per flow (uit smoke-report)
- Drag & drop: ✅/❌
- Versie-cyclus: ✅/❌
- Memo: ✅/❌
- Validatie: ✅/❌
- Personen + werkbord: ✅/❌

## Kritische code issues (uit code-audit)
[lijst van kritische items]

## P0-blockers (uit p0-triage)
[lijst van blokkerende items met complexiteit]

## Wave 2 scope
E2E tests schrijven voor flows: [alleen de ✅ flows]
P0-fixes uitvoeren voor: [alleen blokkerende items]
```

- [ ] **Stap 3: Stop-beslissing**

Als meer dan 3 van de 5 flows FALEN in de smoke test: stop, rapporteer aan Antjan met de wave1-beslissing. Dit is te veel om door te gaan — fundamentele fix nodig vóór Wave 2.

Als 0-2 flows falen: ga door naar Task 4.

- [ ] **Stap 4: Commit Wave 1 rapporten**

```bash
git add e2e/ti-studio/
git commit -m "docs(ti-studio): Wave 1 audit rapporten — code audit + smoke test + P0-triage"
```

---

## Task 4: Wave 2 — Dispatch 2 parallelle agents

Start beide agents tegelijk. Wacht tot beide gereed zijn voor Task 5.

- [ ] **Stap 1: Dispatch Agent 5 — E2E tests schrijven**

Type: `e2e-tester`

Gebruik als input de smoke-report.md (welke flows ✅ zijn) en schrijf stabiele Playwright-tests.

Prompt (pas [GESLAAGDE_FLOWS] aan op basis van wave1-beslissing.md):
```
Je schrijft Playwright E2E tests voor de TI Studio in c:\Users\Antjan\oranje-wit.

Schrijf ALLEEN tests voor de flows die de smoke test (e2e/ti-studio/smoke-report.md) gehaald heeft.
Voor gefaalde flows: schrijf een test.skip met een TODO-comment waarin staat wat er mis ging.

Conventies (volg bestaande tests in e2e/):
- import { test, expect } from "@playwright/test"
- storageState is geconfigureerd via playwright.config.ts (project "web")
- baseURL is http://localhost:3000
- Gebruik getByRole, getByLabel, getByText — geen CSS selectors
- Timeout per test: 60_000ms
- GOTO_OPTS: { waitUntil: "domcontentloaded", timeout: 45_000 }

Schrijf de volgende testbestanden:

e2e/ti-studio/drag-drop.spec.ts
- Test: "speler slepen naar team blijft bewaard na reload"
  1. goto /ti-studio/indeling
  2. Wacht op TeamKaart
  3. Open SpelersPool
  4. Drag speler naar team (gebruik page.dragAndDrop of mouse.move)
  5. Klik opslaan
  6. page.reload()
  7. Expect: speler naam zichtbaar in team

e2e/ti-studio/versie-cyclus.spec.ts
- Test: "opslaan toont succes-feedback"
  1. goto /ti-studio/indeling
  2. Maak wijziging (sleep speler)
  3. Klik opslaan-knop
  4. Expect: geen error dialog, succes-indicator zichtbaar

e2e/ti-studio/memo.spec.ts
- Test: "nieuw memo aanmaken en archiveren"
  1. goto /ti-studio/memo
  2. Klik "Nieuw memo" of equivalente knop
  3. Vul een titel in
  4. Archiveer/sluit het memo
  5. Expect: memo niet meer zichtbaar in actieve lijst

e2e/ti-studio/validatie.spec.ts
- Test: "validatiedrawer opent en toont resultaten"
  1. goto /ti-studio/indeling
  2. Zoek en klik de validatie-knop
  3. Expect: drawer zichtbaar met minstens één validatie-indicator

e2e/ti-studio/personen-werkbord.spec.ts
- Test: "gepinde speler verschijnt in pool drawer"
  1. goto /ti-studio/personen/spelers
  2. Klik pin-knop van eerste speler
  3. goto /ti-studio/indeling
  4. Open SpelersPool drawer
  5. Expect: speler zichtbaar in gepinde sectie

Run na het schrijven: pnpm exec playwright test e2e/ti-studio/ --project=web
Verwacht: alle ✅-tests groen, ⏭️-tests skipped (niet rood).
```

- [ ] **Stap 2: Dispatch Agent 6 — P0-fixes**

Type: general-purpose (met schrijftoegang), isolation: worktree

Prompt (pas [P0_BLOCKERS] aan op basis van p0-triage.md):
```
Je fixt de blokkerende P0-items voor de TI Studio in c:\Users\Antjan\oranje-wit.

Input: lees e2e/ti-studio/p0-triage.md — fix ALLEEN de items gemarkeerd als "Blokkerend: ja".

Voor elk blokkerend item:

ITEM: Toast bij opslaan succes/fout
- Bestand: src/components/ti-studio/werkbord/TiStudioShell.tsx
- Fix: voeg een eenvoudige toast toe na succesvolle PUT naar /api/ti-studio/indeling/[versieId]
- Gebruik: packages/ui heeft mogelijk een Toast-component, anders een simpele <div> met tijdelijke CSS-klasse
- Pattern: kijk eerst of er al een toast/notification systeem is in de app (grep "toast\|Toast\|notification" src/ -r --include="*.tsx" -l)

ITEM: Speler-duplicaat blokkeren
- Bestand: src/components/ti-studio/werkbord/TiStudioShell.tsx
- Fix: blokkeer de drop-actie als de speler al in het doelteam zit, toon visuele feedback
- Pattern: in de drop-handler, check of speler.id al in team.spelers staat

ITEM: Kaartformaat auto-update (alleen als p0-triage dit blokkerend markeert)
- Bestand: src/components/ti-studio/werkbord/TiStudioShell.tsx of TeamKaart.tsx
- Fix: herbereken kaartformaat (viertal/zestal/achtal) na elke drop op basis van spelersaantal

ITEM: Validatielogica V/M-balans (alleen als p0-triage dit blokkerend markeert)
- Bestand: src/components/ti-studio/werkbord/ValidatieDrawer.tsx
- Fix: implementeer daadwerkelijke V/M-balans berekening per team

Werkwijze per fix:
1. Lees het bestand volledig
2. Maak minimale, gerichte wijziging
3. Controleer TypeScript: pnpm tsc --noEmit
4. Commit per item: git commit -m "fix(ti-studio): [item naam]"

Rapporteer welke items je gefixed hebt en welke je niet kon fixen (met reden).
```

---

## Task 5: P0-fixes mergen naar release branch

- [ ] **Stap 1: Review de P0-fix commits**

Vraag de worktree-output van Agent 6 op. Controleer: zijn de TypeScript checks gepasseerd? Zijn er nieuwe fouten?

- [ ] **Stap 2: Cherry-pick of merge de fixes**

```bash
# Haal de branch naam op uit de worktree output van Agent 6
# Merge de fixes naar de huidige release branch
git merge <worktree-branch-naam> --no-ff -m "fix(ti-studio): P0-fixes voor release — toast + duplicaat blokkeren"
```

- [ ] **Stap 3: Verifieer TypeScript na merge**

```bash
pnpm tsc --noEmit
```

Verwacht: geen fouten. Als er fouten zijn: fix ze voor je verdergaat.

---

## Task 6: Wave 3 — Verificatie

- [ ] **Stap 1: Run alle nieuwe E2E tests**

```bash
pnpm exec playwright test e2e/ti-studio/ --project=web --reporter=list
```

Verwacht: alle niet-skipped tests groen. Bij rode tests: noteer welke falen, fix of skip met duidelijk TODO.

- [ ] **Stap 2: Run alle unit tests**

```bash
pnpm test -- --reporter=verbose
```

Verwacht: alle tests groen inclusief de nieuwe unit tests van Wave 1 Agent 4.

- [ ] **Stap 3: Run de volledige E2E suite (regressiecheck)**

```bash
pnpm exec playwright test --project=web --reporter=dot
```

Verwacht: geen nieuwe failures ten opzichte van de main branch baseline.

- [ ] **Stap 4: Maak release-rapport**

Schrijf `e2e/ti-studio/release-rapport.md`:

```markdown
# TI Studio Release Rapport — [datum]

## Kritische flows status
| Flow | Smoke test | E2E test |
|---|---|---|
| Drag & drop | ✅/❌ | ✅/⏭️/❌ |
| Versie-cyclus | ✅/❌ | ✅/⏭️/❌ |
| Memo | ✅/❌ | ✅/⏭️/❌ |
| Validatie | ✅/❌ | ✅/⏭️/❌ |
| Personen + werkbord | ✅/❌ | ✅/⏭️/❌ |

## P0-items status
| Item | Blokkerend? | Gefixed? |
|---|---|---|
...

## Resterende bekende issues (P1-P3)
[lijst uit p0-triage.md]

## Release advies
GO / NO-GO — reden
```

- [ ] **Stap 5: Commit alles**

```bash
git add e2e/ti-studio/ 
git commit -m "docs(ti-studio): release rapport + E2E tests + unit tests"
```

---

## Task 7: Release beslissing aan Antjan

- [ ] **Stap 1: Presenteer het release-rapport**

Stuur de inhoud van `e2e/ti-studio/release-rapport.md` naar Antjan met:
- Samenvatting in 3-5 zinnen
- Expliciet GO of NO-GO advies
- Als NO-GO: exact wat er nog moet

- [ ] **Stap 2: Als GO — geef door aan product-owner voor release**

Antjan → product-owner → `/team-release release ti-studio`

---

## Go/No-Go Criteria

| Criterium | GO | NO-GO |
|---|---|---|
| Smoke test flows | ≥ 4/5 groen | < 4/5 groen |
| Kritische code issues | Geen (of gefixed) | Onopgeloste auth-gaps of data corruption risico |
| P0-blockers | Alle gefixed of met workaround | Eén of meer onopgelost zonder workaround |
| TypeScript | Geen nieuwe fouten | Nieuwe fouten na P0-fixes |
| Regressie E2E | Geen nieuwe failures | Nieuwe failures in bestaande suite |
