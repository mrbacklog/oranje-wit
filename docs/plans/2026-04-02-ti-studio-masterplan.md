# TI-Studio Masterplan — 2 april 2026

**Doel van dit document**: één overzicht van de complete `/ti-studio` workspace — wat er staat, wat ontbreekt, en in welke volgorde gebouwd wordt.

**Bronnen samengevat**: navigatie-herstructurering (2026-04-02, v2), roadmap-totaaloverzicht (2026-03-29), werkindeling fase-1 plan (2026-03-29), what-if technisch ontwerp (2026-03-29).

**Laatste update**: navigatie-plan herzien op 2 april 2026 — structuur gewijzigd (zie sectie Conflicten).

---

## Architectuurplaatje (definitief)

```
/ti-studio/
├── /                        ← Dashboard (mijlpalen, scenario-status)
├── /indeling                ← Werkindeling-editor (redirect naar /scenarios/[id])
├── /opvolging               ← Werkbord: acties, besluiten, blockers    [ONTBREEKT]
├── /personen/               ← Spelers en staf (nieuw, aparte sectie)   [ONTBREEKT]
│   ├── /                    ← Redirect naar /personen/spelers
│   ├── /spelers             ← GezienOverzicht
│   └── /staf                ← Placeholder
├── /kaders/                 ← Strategische kaders (was: Blauwdruk-tabs) [ONTBREEKT]
│   └── /                    ← Besluiten + CategoriePanel + Pins + Uitgangspositie (één pagina)
├── /scenarios/[id]          ← Scenario-editor (fullscreen)
├── /vergelijk               ← Scenario-vergelijking
├── /rating                  ← Spelerscores beheren (actions aanwezig, page onzeker)
├── /pins/                   ← Pin-actions (geen eigen page)
├── /instellingen            ← Seizoenbeheer, mijlpalen, import
├── /design-system           ← Intern: token-showcase
└── /over                    ← Over-pagina
```

**Huidige sidebar** (wat er nu staat):
- Dashboard / Blauwdruk / Werkbord / Indeling

**Gewenste sidebar** (nav-herstructurering v2):
- Dashboard / Indeling / Opvolging / Personen / Kaders

---

## Status per pagina

### `/ti-studio` — Dashboard
**Bedoeling**: Cockpit-overzicht. Mijlpalen, scenario-status, werkbord-KPI's, actiepunten.

**Staat er al:**
- `MijlpalenTimeline` werkt
- `ScenarioStatus` werkt
- Seizoen-header correct

**Ontbreekt:**
- Werkbord-KPI's (placeholder: "beschikbaar na Werkbord-implementatie")
- Actiepunten-blok (placeholder)
- What-if status-samenvatting
- Design-tokens nog niet gebruikt — hardcoded `text-gray-900`, `border-gray-200`

---

### `/ti-studio/blauwdruk` — VERVALT (wordt redirect → `/ti-studio/kaders`)
**Staat er al:** Volledig werkende page met BlauwdrukTabs (6 tabs, alle data ingeladen).
**Actie**: Omzetten naar redirect in Task 6.

---

### `/ti-studio/werkbord` — VERVALT (wordt redirect → `/ti-studio/opvolging`)
**Staat er al:** WerkbordOverzicht met werkitems, stats, blockers — volledig werkend.
**Actie**: Omzetten naar redirect in Task 2.

---

### `/ti-studio/indeling` — Werkindeling-editor
**Bedoeling**: De primaire werkomgeving. Detecteert bestaande werkindeling → redirect naar editor. Anders: onboarding-wizard.

**Staat er al:**
- Werkindeling-check + redirect naar `/scenarios/[id]`
- Onboarding-flow via `NieuwScenarioWizard`
- `WhatIfPanel` en `WhatIfStartDialoog` zijn vandaag gebouwd
- What-if actions: `whatif-actions.ts`, `whatif-edit-actions.ts`, `whatif-impact-actions.ts`, `whatif-resolve-actions.ts`, `whatif-validatie-actions.ts`

**Ontbreekt:**
- What-if zijbalk (lijst van actieve what-ifs)
- What-if editor overlay (drie zones: actief/impact/ongeraakt) — UI-component
- Delta-visualisatie in WhatIfPanel
- Impact-panel (drawer met team-delta's) — W2 uit de roadmap
- Validatie-meldingen in editor — W3

---

### `/ti-studio/scenarios/[id]` — Scenario-editor
**Staat er al:**
- `ScenarioEditorFullscreen` — volledig werkend
- Preview-mode voor definitieve/gearchiveerde scenario's
- Pins, evaluatiescores, validatie, opmerking-popovers
- `SpelerRijIconen` (pin + gezien-stip + warnings) — vandaag gebouwd

**Ontbreekt:**
- What-if UI bovenop de editor (panels, zones, toolbar) — W1/W2
- Terugnavigatie naar `/ti-studio/indeling` (minor UX, staat nergens beschreven)

---

### `/ti-studio/opvolging` — Acties en besluiten [ONTBREEKT]
**Bedoeling**: Werkbord-content op een eigen pagina.
**Te bouwen**: Task 2. WerkbordOverzicht + refreshAction. Actions in `werkbord/actions.ts`.

---

### `/ti-studio/personen/` — Spelers en staf [ONTBREEKT]
**Bedoeling**: Dynamisch raadplegen tijdens het indelingsproces.

| Sub-pagina | Inhoud | Component |
|---|---|---|
| `/personen` | Redirect → `/personen/spelers` | — |
| `/personen/spelers` | Gezien-status per speler | GezienOverzicht |
| `/personen/staf` | Trainers/coaches (later) | EmptyState |

**Te bouwen**: Tasks 3-5.
Sub-navigatie: `PersonenSubNav` client-component (Spelers / Staf).

---

### `/ti-studio/kaders/` — Strategische kaders [ONTBREEKT]
**Bedoeling**: Vóór het indelingsproces raadplegen — statisch beleid.
**Inhoud op één pagina**: Besluiten + BlauwdrukVoortgang + CategoriePanel + Pins + Uitgangspositie.
**Te bouwen**: Task 6. Geen sub-navigatie — alles op de hoofdpagina.

---

### `/ti-studio/vergelijk` — Scenario-vergelijking
**Staat er al**: `ScenarioVergelijk` + `TeamDiff`, page bestaat. Geen openstaande issues.

---

### `/ti-studio/rating` — Spelersscores
**Staat er al**: actions (`rating/actions.ts`). Geen `page.tsx` gevonden in de codebase.
**Aandachtspunt**: Mogelijk dode route of ontbrekende implementatie. Controleren.

---

### `/ti-studio/instellingen` — Beheeropties
**Staat er al**: `SeizoenBeheer`, `MijlpaalBeheer`, `ImportBeheer` — volledig werkend.

---

## Openstaande bouwblokken (prioriteit)

### Blok A: Navigatie-herstructurering (direct, geen afhankelijkheden)
Volledig uitgeschreven in `docs/superpowers/plans/2026-04-02-ti-studio-navigatie-herstructurering.md`.
8 uitvoerbare taken (task 8 ontbreekt in de nummering van het plan — dat is geen fout, het plan springt van 7 naar 9).

| Task | Wat | Afhankelijk van |
|---|---|---|
| 1 | TISidebar hernoemd: Indeling / Opvolging / Personen / Kaders | — |
| 2 | `/opvolging` page + `/werkbord` redirect | Task 1 |
| 3 | `/personen/` layout + PersonenSubNav + redirect | Task 1 |
| 4 | `/personen/spelers` page — GezienOverzicht | Task 3 |
| 5 | `/personen/staf` page — EmptyState | Task 3 |
| 6 | `/kaders` page + KadersTeamsClient + `/blauwdruk` redirect | Task 1 |
| 7 | BlauwdrukTabs verwijderen + TypeScript check | Tasks 2-6 klaar |
| 9 | E2E tests bijwerken | Task 7 |

Tasks 2, 3 en 6 kunnen parallel na Task 1. Tasks 4 en 5 kunnen parallel na Task 3.

### Blok B: What-if UI (parallel met Blok A, onafhankelijk)
What-if actions bestaan al. UI ontbreekt.

1. What-if zijbalk in de editor
2. Editor overlay — drie zones
3. Delta-visualisatie in WhatIfPanel
4. Impact-panel (W2) — drawer met team-delta's

### Blok C: Dashboard opwaardering (na Blok A)
1. Werkbord-KPI's — via bestaande `werkbord/actions.ts`
2. Actiepunten-blok — top-3 open BLOCKERs
3. What-if statusoverzicht
4. Design-tokens vervangen voor hardcoded Tailwind kleuren

### Blok D: Overige roadmap-items
- W3: Validatie + acties (pin-validatie, kader-validatie) — na W2
- W4: Mobile UX-uitbouw — onafhankelijk
- W5: Signaal/actiesysteem — brainstorm nodig
- W6: Autorisatie scope-model — na W4
- W7: Studio dark-mode migratie — onafhankelijk, parallel uitvoerbaar

---

## Conflicten en onduidelijkheden

### 1. Structuurwijziging navigatie-plan (opgelost)
De eerste versie van het plan (ten tijde van de eerste analyse) gebruikte een andere routing:
- Spelers en Staf zaten onder `/kaders/spelers` en `/kaders/staf`
- Kaders had vier sub-pagina's: Kaders / Spelers / Staf / Teams

De huidige versie (v2) heeft dit herzien:
- Spelers en Staf zitten onder `/personen/spelers` en `/personen/staf` — aparte sidebar-sectie
- Kaders is één pagina zonder sub-navigatie: besluiten + categorieën + pins + uitgangspositie op één scroll

Dit lost het eerder gesignaleerde conflict op. Er is geen dubbelzinnigheid meer.

### 2. BlauwdrukVoortgang callback (bekend, geaccepteerd)
`BlauwdrukVoortgang.onNavigeerNaarTab()` wordt een no-op op de kaders-pagina. De knop in de voortgangswidget doet dan niks. Staat expliciet gemarkeerd als buiten scope in het plan. Toekomstige taak: refactor naar route-links.

### 3. Dashboard design-tokens
Dashboard gebruikt hardcoded Tailwind kleuren (`text-gray-900`, `border-gray-200`, `border-dashed`). Valt op als eerste pagina. Hoort bij W7 maar kan eerder opgepakt als kleine clean-up.

### 4. `/ti-studio/rating` — status onbekend
Geen `page.tsx` gevonden. Mogelijk: (a) nooit gebouwd, (b) verwijderd, (c) verborgen via andere route. Controleren vóór Blok D.

### 5. Task-nummering springt van 7 naar 9
Het plan heeft geen Task 8 — de nummering springt direct van Task 7 (BlauwdrukTabs verwijderen) naar Task 9 (E2E). Dit is waarschijnlijk een redactionele keuze (Task 8 was de vroegere Kaders › Teams pagina die nu is samengevoegd in Task 6). Geen functioneel probleem.

---

## Aanbeveling: bouwvolgorde

```
NU (Blok A — één sessie, geen afhankelijkheden):
┌─────────────────────────────────────────────────────────────┐
│  Navigatie-herstructurering (tasks 1-9)                     │
│  Resultaat: werkende studio met Indeling/Opvolging/          │
│  Personen/Kaders. Redirects voor oude bookmarks.            │
└─────────────────────────────────────────────────────────────┘

PARALLEL (onafhankelijk van Blok A):
┌─────────────────────────────────────────────────────────────┐
│  Blok B: What-if UI                                         │
│  Zijbalk + editor overlay + delta-visualisatie              │
└─────────────────────────────────────────────────────────────┘

NA BLOK A:
┌─────────────────────────────────────────────────────────────┐
│  Blok C: Dashboard opwaarderen met echte KPI-data           │
└─────────────────────────────────────────────────────────────┘

DAARNA (sequentieel):
  W2 impact-panel → W3 validatie → W4 mobile → W6 autorisatie
  W7 dark-mode kan altijd parallel
```

### Sessie-prompts

**Sessie 1 — Blok A (navigatie):**
"Implementeer `docs/superpowers/plans/2026-04-02-ti-studio-navigatie-herstructurering.md` task voor task. Voer de taken sequentieel uit: eerst Task 1 (sidebar), dan Tasks 2/3/6 parallel, dan Tasks 4/5 (na Task 3), dan Task 7, dan Task 9. Commit na elke taak zoals beschreven."

**Sessie 2 — Blok B (what-if UI):**
"Bouw de what-if zijbalk en editor overlay in `ScenarioEditorFullscreen`. De actions staan al in `ti-studio/indeling/whatif-*.ts`. Voeg een paneel toe links in de editor met een lijst van actieve what-ifs. Elk what-if toont status (OPEN/BESLISBAAR/TOEGEPAST) en een activeerknop. Bij activeren toont de editor drie zones (actief/impact/ongeraakt) via een overlay op de teamkaarten."

**Sessie 3 — Blok C (dashboard):**
"Vervang de twee placeholder-blokken op `/ti-studio` door echte data. Blok 1: werkbord-KPI's via `werkbord/actions.ts` (getWerkitemStats). Blok 2: top-3 open BLOCKERs. Vervang tegelijk hardcoded Tailwind kleuren (`text-gray-900`, `border-gray-200`) door design-tokens (`var(--text-primary)`, `var(--border-default)`)."

---

## Gaten (nergens beschreven, maar nodig)

1. **Terugnavigatie vanuit editor** — `/ti-studio/scenarios/[id]` heeft geen "terug naar Indeling"-knop. Gebruiker zit vast in fullscreen.
2. **Wizard cancel-flow** — `/ti-studio/indeling` toont de onboarding-wizard als er geen werkindeling is. Wat gebeurt er als de wizard gecanceld wordt? Staat nergens beschreven.
3. **Sidebar actieve state voor sub-routes** — TISidebar markeert geen parent-item als actief wanneer je op een sub-route zit (`/personen/spelers` → "Personen" in sidebar). AppShell beperking, buiten scope maar zichtbaar voor gebruiker.
4. **`/ti-studio/rating`** — actions aanwezig, page niet. Opruimen of afmaken?
