# Roadmap: Team-Indeling platform — Totaaloverzicht

**Datum**: 2026-03-29
**Doel**: Overzicht van alle resterende werkzaamheden, agent-teamtoewijzingen en handshakes.

---

## Wat is af (sessie 28-29 maart)

| Onderdeel | Status | Commits |
|---|---|---|
| Desktop/mobile split — route rename | Klaar | 4 commits |
| Mobile route group + MobileShell | Klaar | 2 commits |
| Portaal twee tegels + componentstructuur | Klaar | 2 commits |
| Rules, CLAUDE.md, agent-scheiding | Klaar | 2 commits |
| Mobile placeholder pagina's (8 pages) | Klaar | 3 commits |
| Werkindeling fase 1 — Prisma + guards + actions | Klaar | 4 commits |
| Werkindeling fase 1 — startscherm + wizard | Klaar | 2 commits |
| Werkindeling fase 1 — navigatie + mobile views | Klaar | 3 commits |
| Design specs (3), technisch ontwerp, UX-spec, domeinreview | Klaar | 5 commits |

**Totaal: 34 commits, 507 tests groen, build groen.**

---

## Resterende werkstromen (7 stuks)

### W1: What-if fase 2 — basis CRUD

**Spec**: `docs/specs/2026-03-29-what-if-model-design.md` sectie 2, 5
**Technisch ontwerp**: `docs/plans/2026-03-29-what-if-technisch-ontwerp.md` fase 2
**UX-spec**: `docs/design/2026-03-29-what-if-ux-spec.md` sectie 2, 3, 4

| Wat | Detail |
|---|---|
| Prisma modellen | WhatIf, WhatIfTeam, WhatIfTeamSpeler, WhatIfTeamStaf, Werkitem.whatIfId |
| Server actions | createWhatIf, getWhatIf(s), addSpelerToWhatIfTeam, moveSpeler, pasWhatIfToe, verwerpWhatIf |
| Snapshot-logica | kopieerTeamsNaarWhatIf(), mergeWhatIfNaarWerkindeling() |
| UI: start-dialoog | Vraag + team-checkboxen + afhankelijkheid |
| UI: editor overlay | Drie zones (actief/impact/ongeraakt), WhatIfToolbar |
| UI: zijbalk | What-if lijst met status-iconen |
| UI: afsluiknoppen | Toepassen/bewaren/verwerpen |
| Delta-berekening | berekenWhatIfDelta() client-side |
| Stale-detectie | basisVersieNummer check |

**Afhankelijk van**: niets (werkindeling fase 1 is af)
**Blokkeert**: W2, W3, W5

---

### W2: What-if fase 3 — impact-panel en auto-meenemen

**Spec**: `docs/specs/2026-03-29-what-if-model-design.md` sectie 2.2, 2.3
**UX-spec**: `docs/design/2026-03-29-what-if-ux-spec.md` sectie 3.5

| Wat | Detail |
|---|---|
| Impact-panel UI | Drawer met team-delta's, samenvatting, validatie-meldingen |
| Auto-meenemen | Bij drag van speler uit impact-team → team wordt actief |
| Ketenoverzicht | Domino-effect visualisatie |
| Staf-impact (Gap 1) | Impact-panel toont ook staf-bezetting per team |
| Selectie-paren (Gap 2) | Teams in SelectieGroep worden als paar meegenomen |

**Afhankelijk van**: W1
**Blokkeert**: W3

---

### W3: What-if fase 4+5 — validatie en acties

**Spec**: `docs/specs/2026-03-29-what-if-model-design.md` sectie 3, 4
**Domeinreview**: `docs/reviews/2026-03-29-what-if-domeinreview.md` sectie 3

| Wat | Detail |
|---|---|
| Pin-validatie | Controleer of gepinde spelers/staf op hun plek staan |
| Blauwdruk-kader-validatie | Aantal teams, teamgrootte-targets |
| Toelichting bij afwijking | Verplicht invulveld, vastleggen als BlauwdrukBesluit |
| Harde fouten blokkeren | Toepassen disabled bij KNKV-overtreding |
| Acties bij what-ifs | Werkitem-koppeling, toewijzing, deadline |
| What-if status automatisch | OPEN → WACHT_OP_ANTWOORDEN → BESLISBAAR |
| Afhankelijkheden | What-if B hangt af van what-if A |
| Oranje Draad-laag (domeinreview) | Informatief signaal: retentierisico, sociale cohesie |

**Afhankelijk van**: W1 + W2
**Blokkeert**: niets (verfijning)

---

### W4: Mobile UX-uitbouw

**Spec**: `docs/specs/2026-03-28-teamindeling-scheiding-design.md` sectie 2, 5
**UX-spec**: nog te maken (wireframes per pagina)

| Wat | Detail |
|---|---|
| UX-wireframes | 8 mobile pagina's (dashboard, teams, spelers, scenarios, staf + detail-pagina's) |
| Echte componenten | Vervang inline-styles door design system componenten |
| MobileSpelerKaart hergebruik | Uit bestaand `scenario/mobile/` |
| TeamCarousel hergebruik | Swipeable team-overzicht |
| Lege werkindeling toestand (Gap 3) | UX voor editor met 0-5 teams |
| Bottom navigation | Mobile-specifieke nav (Teams, Spelers, Indeling) |
| E2E tests | Playwright tests per mobile pagina |

**Afhankelijk van**: W1 (werkindeling data), UX-wireframes
**Blokkeert**: W6

---

### W5: Signaal- en actiesysteem

**Spec**: `docs/specs/2026-03-28-teamindeling-scheiding-design.md` sectie 8

| Wat | Detail |
|---|---|
| **Nog geen design** | Eigen brainstorm-ronde nodig |
| Speler-statussen | Stabiel → signaal → actie → gevolg |
| Domino-ketens | Doelgroep-overstijgende effecten zichtbaar maken |
| Uitvragen | TC vraagt coördinatoren om input over spelers |
| Statusmodel | Welke statussen, welke overgangen |
| Integratie met what-ifs | Signalen triggeren what-if suggesties |

**Afhankelijk van**: W1 (werkindeling), brainstorm nodig
**Blokkeert**: niets (additioneel)

---

### W6: Autorisatie scope-model

**Spec**: `docs/specs/2026-03-28-teamindeling-scheiding-design.md` sectie 3

| Wat | Detail |
|---|---|
| Prisma modellen | TIScope, TIScopeRegel, TIScopeToewijzing, ScenarioDeling |
| scopeFilter() | Prisma where-clause op basis van gebruiker-scope |
| magScenarioZien() | Expliciet delen van scenario's/what-ifs |
| Beheer-pagina | `/beheer/teamindeling/` — scopes aanmaken, regels toevoegen, gebruikers toewijzen |
| Rolhierarchie | TC_LID, COORDINATOR, TRAINER, VIEWER |
| Mobile filtering | Alle queries gefilterd op scope |

**Afhankelijk van**: W4 (mobile moet er zijn om te filteren)
**Blokkeert**: niets (beveiliging)

---

### W7: Studio dark-mode migratie

**Spec**: `docs/specs/2026-03-28-teamindeling-scheiding-design.md` (thema wordt straks dark)

| Wat | Detail |
|---|---|
| 554+ hardcoded Tailwind kleuren | Vervangen door design tokens |
| teamindeling.css | Omzetten van light-only naar dark-first |
| `data-theme="light"` → `data-theme="dark"` | In studio layout |
| Visual regression tests | Snapshot tests bijwerken |

**Afhankelijk van**: niets (kan parallel)
**Blokkeert**: niets (cosmetisch)

---

## Volgorde en afhankelijkheden

```
           W7 (dark-mode)
           ║ (parallel, onafhankelijk)
           ║
W1 ────────╬──── W4 (mobile UX) ──── W6 (autorisatie)
(what-if   ║
 basis)    ║
  │        ║
  ▼        ║
W2 ────────╝
(impact)
  │
  ▼
W3 (validatie + acties)

W5 (signaal/actie) ← eigen brainstorm, kan starten zodra W1 af is
```

---

## Agent-teamtoewijzingen

### `/team-ux` → W4 (Mobile UX-uitbouw) + W7 (Studio dark-mode)

| Agent | Rol |
|---|---|
| **ux-designer** (lead) | Wireframes 8 mobile pagina's, dark-mode plan studio |
| **frontend** | Implementatie componenten, Tailwind migratie |
| **ontwikkelaar** | Handshake: data-interface, server actions die mobile nodig heeft |

**Deliverables:**
1. UX-wireframes per mobile pagina (`docs/design/`)
2. Mobile componenten in `components/teamindeling/mobile/`
3. Dark-mode migratie-plan voor studio
4. E2E tests per pagina

**Handshake met:** team-beheer (autorisatie-UI), product-owner (goedkeuring wireframes)

---

### `/team-release` → W1 (What-if basis CRUD)

| Agent | Rol |
|---|---|
| **ontwikkelaar** (lead) | Prisma modellen, server actions, merge-logica |
| **e2e-tester** | E2E tests voor what-if workflow |
| **deployment** | Deploy naar Railway na implementatie |

**Deliverables:**
1. Prisma migratie (4 nieuwe modellen)
2. Server actions in `ti-studio/werkindeling/actions.ts`
3. Snapshot-logica in `lib/teamindeling/db/whatif-snapshot.ts`
4. Delta-berekening in `lib/teamindeling/whatif/delta.ts`
5. What-if types in `lib/teamindeling/whatif/types.ts`

**Handshake met:** team-ux (UI-componenten voor start-dialoog, editor overlay, zijbalk)

---

### `/team-beheer` → W6 (Autorisatie scope-model)

| Agent | Rol |
|---|---|
| **ontwikkelaar** (lead) | Prisma modellen, scopeFilter(), Beheer-UI |
| **regel-checker** | Scope-validatie, rolhierarchie |
| **e2e-tester** | E2E tests voor scope-filtering |
| **korfbal** | Domeinvalidatie: welke scopes zijn realistisch? |

**Deliverables:**
1. Prisma migratie (TIScope, TIScopeRegel, TIScopeToewijzing)
2. `scopeFilter()` en `magScenarioZien()` in `lib/teamindeling/`
3. Beheer-pagina `/beheer/teamindeling/`
4. Mobile queries gefilterd op scope

**Handshake met:** team-ux (mobile moet scopes respecteren), team-release (what-ifs delen via ScenarioDeling)

---

### `/team-seizoensindeling` → W3 (Validatie + acties) + W5 (Signaal/actie brainstorm)

| Agent | Rol |
|---|---|
| **team-planner** (lead) | Workflow what-if validatie, signaal/actie-model |
| **adviseur** | Oranje Draad-laag, spelersadvies in impact-panel |
| **regel-checker** | Pin-validatie, blauwdruk-kader-checks |
| **data-analist** | Retentiedata koppelen aan what-if impact |

**Deliverables:**
1. Pin-validatie in `lib/teamindeling/whatif/pin-validatie.ts`
2. Blauwdruk-kader-validatie
3. Toelichting-flow bij afwijkingen
4. **Brainstorm**: signaal/actie-systeem design spec
5. Oranje Draad informatieve laag in impact-panel

**Handshake met:** team-release (what-if actions moeten validatie aanroepen), team-ux (validatie-meldingen in UI)

---

### `/team-kwaliteit` → Cross-cutting

| Agent | Rol |
|---|---|
| **ontwikkelaar** (lead) | Code quality, gedeelde laag extraheren |
| **e2e-tester** | Regressie-tests hele platform |
| **regel-checker** | KNKV-regel coverage check |
| **deployment** | Health checks na elke deploy |

**Deliverables:**
1. Gedeelde laag extraheren (`src/lib/teamindeling/queries/`, `actions/`)
2. E2E test suite voor alle routes (mobile + studio)
3. CI quality gate bijwerken

**Handshake met:** alle teams (code review op elke feature-branch)

---

## Handshake-matrix

Welk team levert wat aan welk ander team:

```
                    team-ux    team-release    team-beheer    team-seizoensindeling
team-ux              —          UI-componenten   —              —
                                voor what-if
                                editor

team-release        type-       —               ScenarioDeling  what-if actions
                    contracten                  model           met validatie-hooks
                    (WhatIfData,
                    TeamDelta)

team-beheer          —          scopeFilter()    —              scope-data voor
                                voor mobile                     validatie-context

team-seizoens-       —          validatie-       —               —
indeling                        functies voor
                                toepassen-flow
```

---

## Fasering en planning

### Fase A: Direct starten (geen afhankelijkheden)

| Werkstroom | Team | Kan nu starten |
|---|---|---|
| **W1**: What-if basis CRUD | `/team-release` | Ja — spec, technisch ontwerp en UX-spec zijn klaar |
| **W4**: Mobile UX wireframes | `/team-ux` | Ja — placeholder pagina's staan, UX moet wireframes maken |
| **W7**: Studio dark-mode | `/team-ux` | Ja — onafhankelijk van alles |

### Fase B: Na W1 (what-if basis klaar)

| Werkstroom | Team | Start zodra |
|---|---|---|
| **W2**: Impact-panel + auto-meenemen | `/team-release` | W1 klaar |
| **W5**: Signaal/actie brainstorm | `/team-seizoensindeling` | W1 klaar (nodig als context) |

### Fase C: Na W2 + W4 (impact + mobile klaar)

| Werkstroom | Team | Start zodra |
|---|---|---|
| **W3**: Validatie + acties | `/team-seizoensindeling` | W1 + W2 klaar |
| **W6**: Autorisatie scope-model | `/team-beheer` | W4 klaar (mobile moet er zijn) |

### Fase D: Doorlopend

| Werkstroom | Team | Wanneer |
|---|---|---|
| **Kwaliteit**: code review, E2E, gedeelde laag | `/team-kwaliteit` | Na elke fase |

---

## Voortgangs-tracking

Per werkstroom wordt voortgang bijgehouden via:
1. **Spec** (goedgekeurd design) → ligt er al voor W1-W4, W6, W7
2. **Plan** (implementatieplan) → ligt er voor W1, rest moet geschreven
3. **Commits** → tracked via git log
4. **Tests** → groen houden, 507 is baseline

### Status per werkstroom

| # | Werkstroom | Spec | Plan | Code | Tests |
|---|---|---|---|---|---|
| W1 | What-if basis | Klaar | Te schrijven | — | — |
| W2 | Impact-panel | Klaar (in W1 spec) | — | — | — |
| W3 | Validatie + acties | Klaar (in W1 spec) | — | — | — |
| W4 | Mobile UX | Deels (wireframes nodig) | — | Placeholders klaar | — |
| W5 | Signaal/actie | Niet gestart | — | — | — |
| W6 | Autorisatie | Klaar | — | — | — |
| W7 | Dark-mode | Klaar (in scheiding-spec) | — | — | — |
