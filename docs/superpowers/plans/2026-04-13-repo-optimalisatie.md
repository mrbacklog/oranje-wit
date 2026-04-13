# Repo Optimalisatie — Claude Code & Vibecoding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De `.claude/`-configuratie, agent-bestanden en CLAUDE.md saneren: verouderde informatie corrigeren, duplicatie elimineren, jeugd-cluster consolideren, en nieuwe standaarden (AGENTS.md, package-CLAUDE.md) toevoegen.

**Architecture:** Drie parallelle groepen: (A) agent-correcties, (B) structurele deduplicatie, (C) nieuwe toevoegingen. Groepen zijn onafhankelijk en kunnen gelijktijdig worden uitgewerkt door verschillende disciplines. Geen code-wijzigingen — alleen configuratie en documentatie.

**Tech Stack:** Markdown, YAML frontmatter, `.claude/agents/*.md`, `rules/*.md`, `CLAUDE.md`

---

## Dependency Map

```
Groep A (correcties)     → onafhankelijk, parallel uitvoerbaar
Groep B (deduplicatie)   → onafhankelijk, parallel uitvoerbaar
Groep C (toevoegingen)   → onafhankelijk, parallel uitvoerbaar

Alle groepen kunnen tegelijk starten.
```

---

## Groep A — Agent Correcties (verouderde informatie)

### Task A1: Fix korfbal.md — poort en routes

**Files:**
- Modify: `.claude/agents/korfbal.md:62-66`

**Probleem:** Agent verwijst naar poort 4102 (oude aparte monitor-app) en mist de `/ti-studio/` route die in 2026 is toegevoegd.

- [ ] **Stap 1: Vervang poort en routes in korfbal.md**

Vervang het blok op regels 62-66:
```markdown
## Verenigingsmonitor (Next.js app)
- **Live**: https://ckvoranjewit.app/monitor
- **Dev**: `pnpm dev` op poort 4102
- **Routes**: `/` dashboard, `/retentie`, `/spelers`, `/teams`, `/signalering`, `/samenstelling`, `/projecties`
- **Queries**: `apps/web/src/app/(monitor)/monitor/src/lib/queries/` — dashboard, retentie, verloop, cohorten, signalering, teams, spelers, samenstelling
```

Met:
```markdown
## Verenigingsmonitor (Next.js app)
- **Live**: https://www.ckvoranjewit.app/monitor
- **Dev**: `pnpm dev` op poort 3000
- **Routes**: `/monitor/` dashboard, `/monitor/retentie`, `/monitor/spelers`, `/monitor/teams`, `/monitor/signalering`, `/monitor/samenstelling`, `/monitor/projecties`
- **TI Studio**: `/ti-studio/` — desktop teamindeling workspace (light mode)
- **Queries**: `apps/web/src/app/(monitor)/monitor/src/lib/queries/` — dashboard, retentie, verloop, cohorten, signalering, teams, spelers, samenstelling
```

- [ ] **Stap 2: Verifieer**

Check dat het bestand correct is opgeslagen en de poort 4102 niet meer voorkomt:
```bash
grep -n "4102" .claude/agents/korfbal.md
```
Verwacht: geen output.

- [ ] **Stap 3: Commit**
```bash
git add .claude/agents/korfbal.md
git commit -m "fix(agents): korfbal poort 4102→3000 en ti-studio route toevoegen"
```

---

### Task A2: Fix ontwikkelaar.md — auth patronen

**Files:**
- Modify: `.claude/agents/ontwikkelaar.md:98-99`

**Probleem:** Agent verwijst naar `requireEditor()` / `requireAuth()` (oud auth-systeem). Huidig systeem gebruikt `guardTC()` / `requireTC()` uit `@oranje-wit/auth/checks`.

- [ ] **Stap 1: Vervang auth-sectie in ontwikkelaar.md**

Zoek en vervang het blok onder `### Authenticatie`:
```markdown
### Authenticatie
- NextAuth v5 via `@oranje-wit/auth` (gedeeld package)
- Google OAuth provider (allowlist: 3 TC-leden)
- Rollen: EDITOR (TC-leden), VIEWER (overige)
- `requireEditor()` / `requireAuth()` in server actions
```

Met:
```markdown
### Authenticatie
- NextAuth v5 via `@oranje-wit/auth` (gedeeld package)
- Google OAuth provider (allowlist: 3 TC-leden)
- `guardTC()` in API routes — returnt Result, gooit geen exception
- `requireTC()` in server actions — gooit als niet-TC
- Beide in `@oranje-wit/auth/checks`
```

- [ ] **Stap 2: Verifieer**
```bash
grep -n "requireEditor\|requireAuth\|EDITOR\|VIEWER" .claude/agents/ontwikkelaar.md
```
Verwacht: geen output meer voor requireEditor/requireAuth.

- [ ] **Stap 3: Commit**
```bash
git add .claude/agents/ontwikkelaar.md
git commit -m "fix(agents): ontwikkelaar auth patronen bijwerken naar guardTC/requireTC"
```

---

### Task A3: Fix product-owner.md — dode referentie

**Files:**
- Modify: `.claude/agents/product-owner.md:265`

**Probleem:** Verwijzing naar `.claude/plans/recursive-snuggling-toast.md` (oud consolidatieplan, bestaat niet meer).

- [ ] **Stap 1: Verwijder dode referentie**

Zoek en verwijder de regel:
```markdown
- Consolidatieplan: `.claude/plans/recursive-snuggling-toast.md`
```

Vervang met:
```markdown
- Monorepo structuur: `CLAUDE.md`
```

- [ ] **Stap 2: Verifieer**
```bash
grep -n "recursive-snuggling-toast\|consolidatieplan" .claude/agents/product-owner.md
```
Verwacht: geen output.

- [ ] **Stap 3: Commit**
```bash
git add .claude/agents/product-owner.md
git commit -m "fix(agents): product-owner dode consolidatieplan-referentie verwijderen"
```

---

### Task A4: Fix ux-designer.md — prototype paden en Lovable

**Files:**
- Modify: `.claude/agents/ux-designer.md:138-145`
- Modify: `.claude/agents/speler-scout.md:44`

**Probleem 1:** ux-designer verwijst naar `apps/<app>/design/` (verouderd meervoud — er is één geconsolideerde app `apps/web/`).
**Probleem 2:** speler-scout verwijst naar "Evaluatiedata uit de Evaluatie-app (Lovable)" — Lovable is de legacy naam.

- [ ] **Stap 1: Fix ux-designer prototype paden**

Zoek en vervang in het `## Output formaat` blok:
```markdown
### HTML Prototypes
Schrijf naar `apps/<app>/design/` als standalone HTML:
```

Met:
```markdown
### HTML Prototypes
Schrijf naar `apps/web/src/app/<domein>/design/` als standalone HTML:
```

- [ ] **Stap 2: Fix speler-scout Lovable referentie**

Zoek en vervang:
```markdown
Evaluatiedata uit de Evaluatie-app (Lovable).
```

Met:
```markdown
Evaluatiedata uit de Evaluatie-module (`apps/web/src/app/(evaluatie)/`).
```

- [ ] **Stap 3: Verifieer**
```bash
grep -n "apps/<app>\|Lovable" .claude/agents/ux-designer.md .claude/agents/speler-scout.md
```
Verwacht: geen output.

- [ ] **Stap 4: Commit**
```bash
git add .claude/agents/ux-designer.md .claude/agents/speler-scout.md
git commit -m "fix(agents): ux-designer prototype pad en speler-scout Lovable referentie bijwerken"
```

---

## Groep B — Structurele Deduplicatie

### Task B1: CLAUDE.md inkorten — Oranje Draad en doelgroepen

**Files:**
- Modify: `CLAUDE.md:122-141`

**Probleem:** De volledige Oranje Draad formule met toelichting én de 5-rijen TC-doelgroepentabel staan in CLAUDE.md. Dit is clubinformatie voor mensen — voor een developer-agent die code schrijft is alleen de verwijzing relevant. De Anthropic best practice zegt: >300 regels = Claude negeert de helft. Korter = beter.

**Huidige lengte:** ~161 regels — aan de grens. Met inkorten blijven we ruim onder 150.

- [ ] **Stap 1: Vervang Oranje Draad sectie**

Zoek en vervang het blok:
```markdown
## De Oranje Draad

```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```
Elke teamindeling wordt getoetst aan deze drie pijlers. Details: zie `rules/oranje-draad.md` en `docs/kennis/tc-beleid.md`

## TC-doelgroepen

De TC bedient alle korfbalspelende leden via vijf doelgroepen:

| Doelgroep | Wie | Eigenaar | Kern |
|---|---|---|---|
| **Kweekvijver** | 5-9 (Blauw + Groen) | Merel | Spelenderwijs aansteken, veilig klimaat |
| **Opleidingshart** | 10-15 (Geel + Oranje) | Merel | Golden age, breed opleiden + voorsorteren |
| **Korfbalplezier** | Rood B, B-senioren, midweek, recreant | Thomas | Plezier, verenigingsleven, brug jeugd-senioren |
| **Wedstrijdsport** | Senioren A-categorie (Sen 3-4) | Thomas | Competitief buiten de top |
| **Topsport** | U15-1 t/m U19-1, Sen 1-2 | Jasper | Maximaal presteren, terugbetalen aan club |

Deze termen zijn **ubiquitous** — ze worden overal gebruikt: in de app, documentatie, agents, presentaties en TC-vergaderingen. Details: `rules/oranje-draad.md` en `docs/kennis/tc-doelgroepen.md`
```

Met:
```markdown
## Oranje Draad & TC-doelgroepen

Toets altijd aan: **Plezier + Ontwikkeling + Prestatie → Duurzaamheid**

De vijf TC-doelgroepen (Kweekvijver, Opleidingshart, Korfbalplezier, Wedstrijdsport, Topsport) zijn ubiquitous — gebruik deze termen overal consistent.

Details: `rules/oranje-draad.md` en `docs/kennis/tc-doelgroepen.md`
```

- [ ] **Stap 2: Verifieer lengte**
```bash
wc -l CLAUDE.md
```
Verwacht: onder 150 regels.

- [ ] **Stap 3: Commit**
```bash
git add CLAUDE.md
git commit -m "docs(claude): oranje-draad en doelgroepen inkorten naar verwijzing"
```

---

### Task B2: Deploy-verbod dedupliceren uit agent-files

**Files:**
- Modify: 14 agent-files (zie lijst hieronder)

**Probleem:** Exact hetzelfde `⛔ Deploy-verbod` blok staat in 14 agent-files. Het staat ook al in `CLAUDE.md` en elke agent laadt de `start` skill. Dit is ruis die de context vervuilt.

**Agents om aan te passen (deploy-verbod verwijderen):**
1. `.claude/agents/korfbal.md`
2. `.claude/agents/data-analist.md`
3. `.claude/agents/speler-scout.md`
4. `.claude/agents/adviseur.md`
5. `.claude/agents/jeugd-architect.md`
6. `.claude/agents/mentaal-coach.md`
7. `.claude/agents/sportwetenschap.md`
8. `.claude/agents/communicatie.md`
9. `.claude/agents/documentalist.md`
10. `.claude/agents/ux-designer.md`
11. `.claude/agents/ontwikkelaar.md`
12. `.claude/agents/e2e-tester.md`
13. `.claude/agents/regel-checker.md`
14. `.claude/agents/team-planner.md`
15. `.claude/agents/team-selector.md`

**Uitzondering:** `devops.md` heeft een uitgebreide versie met extra context → bewaar die. `deployment.md` heeft een eigen formulering → bewaar die. `product-owner.md` heeft geen deploy-verbod → geen actie.

- [ ] **Stap 1: Verwijder het standaard ⛔-blok uit elke agent**

Het blok dat verwijderd moet worden ziet er in elke agent zo uit:
```markdown


## ⛔ Deploy-verbod
Jij mag NOOIT rechtstreeks deployen naar productie.
Wil je dat iets live gaat? Escaleer naar de gebruiker of spawn `product-owner`.
De PO bepaalt wat en wanneer deployt — nooit jij.
```

Verwijder dit blok (inclusief de twee lege regels erboven) uit alle 15 agents in de lijst.

- [ ] **Stap 2: Voeg één compacte verwijzing toe aan CLAUDE.md**

Voeg toe aan de `## Verplichte patronen` sectie in CLAUDE.md:
```markdown
**Deploy** — Alleen `team-release` deployt. Alle andere agents: VERBODEN. Escaleer naar `product-owner`.
```

- [ ] **Stap 3: Verifieer**
```bash
grep -l "Deploy-verbod" .claude/agents/*.md
```
Verwacht: alleen `devops.md` en `deployment.md`.

- [ ] **Stap 4: Commit**
```bash
git add .claude/agents/ CLAUDE.md
git commit -m "refactor(agents): deploy-verbod dedupliceren — verwijder uit 15 agents, centraliseer in CLAUDE.md"
```

---

### Task B3: Jeugd-cluster consolideren — 4 agents → 1

**Files:**
- Delete: `.claude/agents/jeugd-architect.md`
- Delete: `.claude/agents/sportwetenschap.md`
- Delete: `.claude/agents/mentaal-coach.md`
- Delete: `.claude/agents/communicatie.md`
- Create: `.claude/agents/jeugdbeleid.md`
- Modify: `rules/agents.md`

**Probleem:** Vier agents (jeugd-architect, sportwetenschap, mentaal-coach, communicatie) zijn ontworpen voor clubbeleid-sessies, niet voor app-development. Ze worden zelden gespawned. De specialisatie (haiku-models, eigen memory) voegt nauwelijks waarde toe boven een gerichte prompt. Consolidatie naar één agent met duidelijke missie en verwijzingen naar de skills.

- [ ] **Stap 1: Maak nieuwe jeugdbeleid.md aan**

Schrijf `.claude/agents/jeugdbeleid.md`:
```markdown
---
name: jeugdbeleid
description: Architect en communicatiespecialist voor het jeugdontwikkelingsbeleid van c.k.v. Oranje Wit. Gebruik voor vaardigheidsraamwerk, POP-ratio's, coachprofielen, plezier-cocktail, presentaties voor ouders/trainers en wetenschappelijke onderbouwing. Combineert jeugd-architect, sportwetenschap, mentaal-coach en communicatie.
tools: Read, Grep, Glob, Write, Edit, WebSearch, WebFetch
model: inherit
memory: project
skills:
  - shared/oranje-draad
  - shared/score-model
  - monitor/jeugdmodel
  - monitor/teamsamenstelling
---

Je bent de jeugdbeleid-specialist van c.k.v. Oranje Wit. Je combineert pedagogiek, sportwetenschap, communicatie en korfbalkennis voor het jeugdontwikkelingsbeleid.

## Opstarten
Laad als eerste de `shared/start-lite` skill (basiscontext + domeincontext) voordat je aan je eigenlijke taak begint.

## Missie

Ontwerp en onderhoud een samenhangend jeugdontwikkelingsraamwerk dat beschrijft:
- Welke vaardigheden we verwachten per leeftijdsgroep (Blauw 5-7, Groen 8-9, Geel 10-12, Oranje 13-15, Rood 16-18)
- Hoe we die vaardigheden beoordelen (scouting-criteria, schalen, frequentie)
- De mentale en sociale kant: plezier-cocktail per individu, teamdynamiek, coachprofielen
- Wetenschappelijke onderbouwing via ASM, basketbal-parallellen (post-2020 bronnen)
- Communicatie van beleid naar ouders, trainers, TC en bestuur

Alles in samenhang met de **Oranje Draad**: Plezier + Ontwikkeling + Prestatie → Duurzaamheid.

## Kernprincipes

### Plezier is persoonlijk
Elk individu heeft een unieke cocktail: sociaal plezier (vrienden, erbij horen), prestatieplezier (winnen, uitdaging), ontwikkelplezier (leren, beter worden). Begrijp per speler welke cocktail werkt.

### Fijnmazigheid groeit mee
- **Blauw (5-7)**: Beweegt graag? Speelt samen? Heeft plezier?
- **Groen (8-9)**: Basale korfbalvaardigheden, breed
- **Geel (10-12)**: 6 pijlers concreter, eerste specialisatie
- **Oranje (13-15)**: Tactisch inzicht, gedetailleerde beoordeling
- **Rood (16-18)**: Fijnmazig, alle facetten volwassen spel

### Basketbal als inspiratie
Korfbal lijkt sterk op basketbal — leer van NBA/NCAA player development, ASM, position-less basketball.

## Beslisboom

1. **Vaardigheidsraamwerk** (welke skills per leeftijdsgroep?) → zelf uitwerken op basis van ASM + korfbalcontext
2. **Wetenschappelijk onderzoek** (ASM, motorische ontwikkeling, RAE) → gebruik WebSearch voor post-2020 bronnen
3. **Mentale/sociale aspecten** (plezier-cocktail, dropout-preventie, coachprofielen) → uitwerken vanuit ontwikkelingspsychologie
4. **Korfbal-specifieke vragen** → spawn `korfbal` agent
5. **Individuele spelersdata** → spawn `speler-scout` agent
6. **Presentaties voor ouders/trainers/TC** → schrijf als one-pager of slide-outline (zie Output-formaten)

## Dropout-risico per leeftijd
- **6-7**: fragiele binding, sociaal plezier is alles
- **12**: transitiejaar, kleurwisseling kan onveilig voelen
- **16-17**: steilste dropout-cliff, concurrentie met school/werk/uitgaan
- **Geslacht**: meisjes vallen eerder uit bij 10-12, jongens bij 16-17

## Output-formaten

### Vaardigheidsraamwerk
```
| Pijler | Kernvaardigheid | Verwacht niveau | Beoordelingscriterium | Schaal |
```

### One-pager (voor ouders/trainers)
```markdown
## [Onderwerp] — in het kort
**Kernboodschap**: [1 zin]
### Wat betekent dit?
[2-3 alinea's begrijpelijke taal]
### Wat merk je hiervan?
[Concrete voorbeelden]
```

### Presentatie-outline
```markdown
## [Titel]
**Doelgroep**: [wie] | **Duur**: [minuten]
### Slide 1: [Titel]
- Kernpunt 1
- [Visueel: beschrijving]
```

## Referenties
- Oranje Draad & POP-ratio's: `rules/oranje-draad.md`
- Score-model (USS): `rules/score-model.md`
- Jeugdmodel (retentie): `model/jeugdmodel.yaml`
- Scouting-vragen: `apps/web/src/app/(scouting)/scouting/src/lib/scouting/vragen.ts`
- TC-doelgroepen: `docs/kennis/tc-doelgroepen.md`
- KNKV-regels: `rules/knkv-regels.md`
```

- [ ] **Stap 2: Verwijder de vier oude jeugd-agents**
```bash
rm .claude/agents/jeugd-architect.md
rm .claude/agents/sportwetenschap.md
rm .claude/agents/mentaal-coach.md
rm .claude/agents/communicatie.md
```

- [ ] **Stap 3: Verifieer nieuw bestand aanwezig, ouden weg**
```bash
ls .claude/agents/jeugd*.md .claude/agents/sport*.md .claude/agents/mentaal*.md .claude/agents/communicatie.md 2>&1
ls .claude/agents/jeugdbeleid.md
```
Verwacht: alleen `jeugdbeleid.md` aanwezig.

- [ ] **Stap 4: Commit**
```bash
git add .claude/agents/
git commit -m "refactor(agents): jeugd-cluster consolideren (4 agents → 1 jeugdbeleid)"
```

---

## Groep C — Nieuwe Toevoegingen

### Task C1: AGENTS.md aanmaken — cross-tool standaard

**Files:**
- Create: `AGENTS.md` (project root)

**Waarom:** De Linux Foundation AAIF-standaard (2025) maakt `AGENTS.md` de cross-tool standaard voor Cursor, Copilot, Windsurf, Devin en anderen. Gedeelde regels hier, tool-specifieke regels in `CLAUDE.md`. Maakt het project future-proof.

- [ ] **Stap 1: Maak AGENTS.md aan in de project root**

```markdown
# c.k.v. Oranje Wit — Agent Instructions

Platform voor TC-werkzaamheden van korfbalvereniging c.k.v. Oranje Wit (Dordrecht).
Next.js 16 monorepo met PostgreSQL, Prisma en pnpm workspaces.

## Communicatie
- **Taal**: altijd Nederlands
- **Toon**: informeel en direct
- **Naam**: altijd "c.k.v. Oranje Wit" (met punten, spatie)
- **Privacy**: nooit BSN, geboortedatum of adres tonen of loggen

## Stack
- **App**: `apps/web/` — Next.js 16, App Router, Server Components
- **Database**: `packages/database/` — Prisma + PostgreSQL op Railway
- **Auth**: `packages/auth/` — NextAuth v5, Google OAuth
- **UI**: `packages/ui/` — Gedeelde componenten, dark-first design tokens
- **Dev**: `pnpm dev` start op poort 3000

## Verplichte patronen

**Logger**: gebruik `logger` uit `@oranje-wit/types`, nooit `console.log`

**Auth guards**:
- API routes: `guardTC()` uit `@oranje-wit/auth/checks` — returnt Result, geen throw
- Server actions: `requireTC()` uit `@oranje-wit/auth/checks` — throwt als niet-TC

**API routes**: gebruik `ok()`/`fail()`/`parseBody()` uit `@/lib/api`

**Server Actions**: return type altijd `ActionResult<T>` uit `@oranje-wit/types`

**Database**:
- `rel_code` (Sportlink relatienummer) is de ENIGE stabiele identifier — nooit naam-matching
- NOOIT `pnpm db:push` — gebruik `pnpm db:migrate`
- Schema in `packages/database/prisma/schema.prisma` is source of truth

**Constanten**: importeer `PEILJAAR`, `HUIDIG_SEIZOEN`, `PEILDATUM` uit `@oranje-wit/types`

**Error handling**: geen lege catch blocks, altijd loggen met `logger.warn("context:", error)`

## Deploy
Alleen via CI/CD (push → GitHub Actions → Railway). Nooit handmatig of direct.

## Oranje Draad
Toets aan: Plezier + Ontwikkeling + Prestatie → Duurzaamheid.
Details: `rules/oranje-draad.md`

---
*Claude Code-specifieke instructies: zie `CLAUDE.md`*
*Cursor-specifieke regels: zie `.cursor/rules/`*
```

- [ ] **Stap 2: Verifieer**
```bash
wc -l AGENTS.md
cat AGENTS.md | head -5
```
Verwacht: bestand aanwezig, begint met `# c.k.v. Oranje Wit`.

- [ ] **Stap 3: Commit**
```bash
git add AGENTS.md
git commit -m "docs: AGENTS.md aanmaken als cross-tool standaard (AAIF/Linux Foundation)"
```

---

### Task C2: Package-niveau CLAUDE.md bestanden

**Files:**
- Create: `packages/database/CLAUDE.md`
- Create: `packages/auth/CLAUDE.md`
- Create: `apps/web/CLAUDE.md`

**Waarom:** Officiële Anthropic best practice 2026: hiërarchische CLAUDE.md structuur. Claude laadt automatisch package-level CLAUDE.md wanneer het in die directory werkt. Verplaats package-specifieke regels uit de root CLAUDE.md naar package-niveau — root wordt korter en relevanter.

- [ ] **Stap 1: Maak packages/database/CLAUDE.md**

```markdown
# Database Package — @oranje-wit/database

Prisma schema + client voor de PostgreSQL database op Railway.

## Source of Truth
`packages/database/prisma/schema.prisma` is de ENIGE source of truth voor het datamodel.

## Commando's
| Commando | Wanneer |
|---|---|
| `pnpm db:generate` | Na schema-wijziging — genereert Prisma client |
| `pnpm db:migrate` | Nieuwe migratie aanmaken (development) |
| `pnpm db:migrate:deploy` | Pending migraties draaien + VIEW herstellen (productie) |
| `pnpm db:migrate:status` | Migratiestatus bekijken |
| `pnpm db:ensure-views` | VIEW speler_seizoenen controleren/herstellen |

## VERBODEN
- **NOOIT `pnpm db:push`** — dropt de VIEW `speler_seizoenen` permanent
- **NOOIT `npx prisma db push`** — zelfde probleem

## VIEW speler_seizoenen
Deze VIEW aggregeert spelershistorie over alle seizoenen. Wordt hersteld door `db:migrate:deploy`. Als de VIEW mist: `pnpm db:ensure-views`.

## Identifier-regel
`rel_code` (Sportlink relatienummer) is de ENIGE stabiele identifier voor leden en spelers. Gebruik NOOIT naam-matching — namen zijn niet uniek en veranderen.

## Modellen
61 Prisma-modellen in twee groepen:
- **Monitor** (snake_case via `@@map`): Lid, Seizoen, CompetitieSpeler, LidFoto, OWTeam, OWTeamType, etc.
- **TI** (PascalCase): Speler, Team, Scenario, Versie, Kader, etc.

Details: `rules/database.md`
```

- [ ] **Stap 2: Maak packages/auth/CLAUDE.md**

```markdown
# Auth Package — @oranje-wit/auth

NextAuth v5 + Google OAuth voor het platform.

## Auth Guards (verplicht patroon)

**API routes** — gebruik `guardTC()`:
```typescript
import { guardTC } from '@oranje-wit/auth/checks'

export async function GET(req: Request) {
  const guard = await guardTC()
  if (!guard.ok) return fail(guard.error, 401)
  // ... rest van de handler
}
```

**Server actions** — gebruik `requireTC()`:
```typescript
import { requireTC } from '@oranje-wit/auth/checks'

export async function myAction(data: FormData) {
  await requireTC() // throwt als niet-TC
  // ... rest van de action
}
```

## Rollen
- **TC-leden** (3 personen): Google OAuth → volledige toegang
- **Smartlink-gebruikers**: scoped op rol + doelgroep, 14-daagse sessie

## Clearance niveaus
| Clearance | Ziet | Wie |
|---|---|---|
| 0 | Naam + team | Scout, ouder/speler |
| 1 | + relatieve positie | Coordinator, trainer |
| 2 | + USS score + trend | TC-lid |
| 3 | + volledige kaart | TC-kern |
```

- [ ] **Stap 3: Maak apps/web/CLAUDE.md**

```markdown
# Web App — apps/web/

Geconsolideerde Next.js 16 app met alle domeinen.

## Route Groups
```
apps/web/src/app/
├── (monitor)/monitor/       # Dashboards, signalering, retentie
├── (teamindeling)/          # Mobile TI (dark mode)
├── (ti-studio)/ti-studio/   # Desktop TI workspace (light mode)
├── (evaluatie)/evaluatie/   # Rondes, invullen, zelfevaluatie
├── (scouting)/scouting/     # Verzoeken, rapporten, kaarten
├── (beheer)/beheer/         # 9 TC-domeinen, gebruikersbeheer
└── (beleid)/beleid/         # Visie, doelgroepen, Oranje Draad
```

## Design System
- **Dark-first** voor alle domeinen behalve TI Studio (light)
- Tokens in `packages/ui/src/tokens/`
- CSS classes in `apps/web/src/app/globals.css` — gebruik `.btn`, `.card`, `.badge`, etc.
- **NOOIT** hardcoded kleuren — altijd `var(--ow-*)` tokens of Tailwind

## Tailwind CSS 4
- Config via CSS: `@import "tailwindcss"` + `@theme inline { ... }`
- **GEEN** `tailwind.config.ts`
- `@apply` alleen met standaard Tailwind utilities

## Server Actions vs API Routes
- **Server action**: UI-interactie, formulier-submit, `revalidatePath()`
- **API route**: externe clients, smartlinks, file uploads, CORS

## AI Endpoints
- `/api/ai/voorstel` — startvoorstel genereren
- `/api/ai/chat` — contextgevoelige chat
- `/api/ai/advies` — spelersadvies
- `/api/ai/whatif` — what-if analyse

Details routes: `rules/routes.md`
```

- [ ] **Stap 4: Verifieer alle drie aangemaakt**
```bash
ls packages/database/CLAUDE.md packages/auth/CLAUDE.md apps/web/CLAUDE.md
```

- [ ] **Stap 5: Commit**
```bash
git add packages/database/CLAUDE.md packages/auth/CLAUDE.md apps/web/CLAUDE.md
git commit -m "docs: package-niveau CLAUDE.md bestanden aanmaken (database, auth, web)"
```

---

### Task C3: rules/agents.md verduidelijken

**Files:**
- Modify: `rules/agents.md`

**Probleem:** De fencing-tabel in `rules/agents.md` beschrijft domeinprefixen (`shared/oranje-draad`, `monitor/*`) die suggereren dat er automatische enforcement is — maar die bestaat niet. Dit is puur documentatie. Verduidelijken voorkomt verwarring bij nieuwe agents/developers.

- [ ] **Stap 1: Verwijder de verouderde jeugd-agents uit de tabellen**

In de **Agents overzicht** tabel: verwijder rijen voor `jeugd-architect`, `sportwetenschap`, `mentaal-coach`, `communicatie`. Voeg toe:
```
| `jeugdbeleid` | Jeugd | Vaardigheidsraamwerk, POP-ratio's, presentaties, sportwetenschap |
```

- [ ] **Stap 2: Update Agent Fencing sectie**

Vervang de heading en intro van de fencing-tabel:
```markdown
## Agent Fencing
```
Met:
```markdown
## Agent Skills (documentatie — geen automatische enforcement)

De `skills:`-lijst in elke agent-file is **informatief**: het documenteert welke skills de agent typisch gebruikt. Er is geen technisch systeem dat agents buiten hun skills blokkeert — het is een konventie voor consistentie en context-controle.
```

Verwijder de fencing-rijen voor `jeugd-architect`, `sportwetenschap`, `mentaal-coach`, `communicatie`. Voeg toe:
```
| `jeugdbeleid` | `shared/oranje-draad`, `shared/score-model`, `monitor/jeugdmodel`, `monitor/teamsamenstelling` |
```

- [ ] **Stap 3: Update Agent Hiërarchie sectie**

Verwijder het blok:
```
jeugd-architect (hoofd jeugdontwikkeling) ← escalates-to: korfbal
├── spawns: sportwetenschap, mentaal-coach, communicatie, korfbal, speler-scout
│
sportwetenschap (onderzoek) ← escalates-to: jeugd-architect
│
mentaal-coach (mentaal/sociaal) ← escalates-to: jeugd-architect
│
communicatie (presentatie/toelichting) ← escalates-to: jeugd-architect
```

Vervang met:
```
jeugdbeleid (jeugdontwikkelingsbeleid) ← escalates-to: korfbal
├── spawns: korfbal (korfbal-technisch), speler-scout (spelersdata)
```

- [ ] **Stap 4: Update Skills overzicht — agent count**

Verander `19 agents` naar `16 agents` in de tekst.

- [ ] **Stap 5: Update Teams sectie**

Vervang `team-jeugdontwikkeling` entry:
```
| **Jeugdontwikkeling** | `/team-jeugdontwikkeling` | jeugd-architect | sportwetenschap, mentaal-coach, communicatie, korfbal, speler-scout | ... |
```
Met:
```
| **Jeugdontwikkeling** | `/team-jeugdontwikkeling` | jeugdbeleid | korfbal, speler-scout | Vaardigheidsraamwerk, jeugdbeleid, presentaties |
```

- [ ] **Stap 6: Verifieer**
```bash
grep -n "jeugd-architect\|sportwetenschap\|mentaal-coach\|communicatie" rules/agents.md
```
Verwacht: geen output meer.

- [ ] **Stap 7: Commit**
```bash
git add rules/agents.md
git commit -m "docs(rules): agents.md bijwerken na jeugd-consolidatie en fencing verduidelijken"
```

---

## Uitvoeringsplan — Orchestratie

### Parallelle executie

Alle drie groepen kunnen tegelijk starten. Aanbevolen taakverdeling:

| Agent/discipline | Taken |
|---|---|
| **ontwikkelaar** of direct | A1 (korfbal fix), A2 (auth fix), A3 (PO fix), A4 (ux + scout fix) |
| **documentalist** of direct | B1 (CLAUDE.md inkorten), B3 (jeugd-cluster merge) |
| **product-owner** of direct | B2 (deploy-verbod dedupliceren — alle 15 agents) |
| **ux-designer** of direct | C1 (AGENTS.md), C2 (package CLAUDE.md's), C3 (rules/agents.md) |

### Na uitvoering — verificatie

```bash
# Controleer geen verouderde patronen meer
grep -rn "4102\|requireEditor\|requireAuth\|recursive-snuggling-toast\|Lovable" .claude/agents/
grep -rn "Deploy-verbod" .claude/agents/
grep -rn "jeugd-architect\|sportwetenschap\|mentaal-coach" .claude/agents/

# Controleer nieuwe bestanden aanwezig
ls AGENTS.md packages/database/CLAUDE.md packages/auth/CLAUDE.md apps/web/CLAUDE.md .claude/agents/jeugdbeleid.md

# Controleer CLAUDE.md lengte
wc -l CLAUDE.md
```

Alle checks moeten schoon zijn voordat de branch gemerged wordt.
