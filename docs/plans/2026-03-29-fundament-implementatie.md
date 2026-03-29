# Fundament Implementatie Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CLAUDE.md trimmen naar ~150 regels, path-scoped rules toevoegen, skills opschonen en seizoenscyclus-skill bouwen.

**Architecture:** Verplaats detail-informatie uit CLAUDE.md naar 3 nieuwe path-scoped rules (database, agents, routes). Voeg paths: frontmatter toe aan 5 bestaande rules. Schoon skills op (verwijder deploy duplicaat, consolideer import/evaluatie). Maak een seizoenscyclus-skill die agents seizoenscontext geeft.

**Tech Stack:** Markdown (CLAUDE.md, rules, skills), YAML frontmatter, Claude Code agent-infrastructuur

**Spec:** `docs/specs/2026-03-29-fundament-design.md`

---

## File Map

### Nieuw aan te maken
- `rules/database.md` — Database-details verplaatst uit CLAUDE.md (61 modellen, rel_code, VIEW, data flow)
- `rules/agents.md` — Agent-hiërarchie en fencing verplaatst uit CLAUDE.md
- `rules/routes.md` — Route-tabel en navigatie verplaatst uit CLAUDE.md
- `.claude/skills/seizoenscyclus/SKILL.md` — Seizoenscontext-skill voor agents

### Te wijzigen
- `CLAUDE.md` — Trimmen van 485 naar ~150 regels
- `rules/knkv-regels.md` — paths: frontmatter toevoegen
- `rules/ow-voorkeuren.md` — paths: frontmatter toevoegen
- `rules/design-system.md` — paths: frontmatter toevoegen
- `rules/beheer.md` — paths: frontmatter toevoegen
- `rules/teamindeling-scheiding.md` — paths: frontmatter toevoegen
- `.claude/skills/start/SKILL.md` — Seizoenscontext laden toevoegen

### Te verwijderen
- `.claude/skills/deploy/SKILL.md` — Duplicaat van deployment

---

### Taak 1: rules/database.md aanmaken (path-scoped)

**Files:**
- Create: `rules/database.md`
- Read: `CLAUDE.md:1-485` (bron voor database-secties)
- Read: `packages/database/prisma/schema.prisma` (verificatie modellen)

- [ ] **Stap 1: Lees CLAUDE.md en identificeer alle database-secties**

Zoek naar deze secties in CLAUDE.md:
- "Database" hoofdsectie
- "Gedeelde PostgreSQL op Railway"
- "Tabelverdeling (61 modellen)"
- "Competitie-datamodel"
- "rel_code is de enige sleutel"
- "Lees/schrijf"
- "Data Flow"

- [ ] **Stap 2: Schrijf rules/database.md met paths: frontmatter**

```markdown
---
paths:
  - "packages/database/**"
  - "**/*.prisma"
  - "apps/web/src/lib/db/**"
  - "scripts/**"
---

# Database — PostgreSQL op Railway

## Verbinding
- **Host**: `shinkansen.proxy.rlwy.net:18957`
- **Database**: `oranjewit`
- **Schema**: `packages/database/prisma/schema.prisma` (source of truth)
- **Migraties**: `packages/database/prisma/migrations/`
- **VIEW**: `packages/database/prisma/views.sql` (buiten Prisma-beheer)
- **NOOIT** `db:push` gebruiken — dropt VIEW speler_seizoenen

## rel_code is de enige sleutel (KRITIEK)
[Kopieer volledige sectie uit CLAUDE.md]

## Tabelverdeling (61 modellen)
[Kopieer volledige tabel uit CLAUDE.md]

## Competitie-datamodel
[Kopieer uit CLAUDE.md]

## Lees/schrijf-verdeling
[Kopieer uit CLAUDE.md]

## Data Flow
[Kopieer diagram uit CLAUDE.md]
```

- [ ] **Stap 3: Verifieer dat paths: correct zijn**

Run: `ls packages/database/ apps/web/src/lib/db/ scripts/`
Verwacht: directories bestaan

- [ ] **Stap 4: Commit**

```bash
git add rules/database.md
git commit -m "rules: voeg path-scoped database.md toe"
```

---

### Taak 2: rules/agents.md aanmaken (path-scoped)

**Files:**
- Create: `rules/agents.md`
- Read: `CLAUDE.md` (agent-secties)
- Read: `.claude/agents/*.md` (frontmatter verificatie)

- [ ] **Stap 1: Lees CLAUDE.md en identificeer alle agent-secties**

Zoek naar:
- "Agents" tabel
- "Agent Fencing"
- "Agent Hiërarchie"
- "Agent Startup"
- "Agent Teams"

- [ ] **Stap 2: Schrijf rules/agents.md met paths: frontmatter**

```markdown
---
paths:
  - ".claude/agents/**"
  - ".claude/skills/**"
---

# Agents — Hiërarchie, Fencing & Teams

## Agents overzicht
[Kopieer agent-tabel uit CLAUDE.md — 19 agents]

## Agent Fencing
[Kopieer volledige fencing-tabel uit CLAUDE.md]

## Agent Hiërarchie
[Kopieer hiërarchie-diagram uit CLAUDE.md]

## Agent Startup
Bij het spawnen van een agent MOET eerst de `start` skill worden geladen.

## Agent Teams (11)
[Kopieer team-tabel uit CLAUDE.md]

## Namespace-conventie
Skills staan in `.claude/skills/<naam>/SKILL.md` (flat structuur).
Agent frontmatter verwijst met domeinprefixen (`shared/oranje-draad`).
Dit is documentatie-conventie, geen directory-structuur.
```

- [ ] **Stap 3: Commit**

```bash
git add rules/agents.md
git commit -m "rules: voeg path-scoped agents.md toe"
```

---

### Taak 3: rules/routes.md aanmaken (path-scoped)

**Files:**
- Create: `rules/routes.md`
- Read: `CLAUDE.md` (route-secties)
- Read: `packages/ui/src/navigation/manifest.ts` (navigatie-manifest)

- [ ] **Stap 1: Lees CLAUDE.md en identificeer route-secties**

Zoek naar:
- "Routes" tabel
- "Design System > Navigatie (VERPLICHT)"

- [ ] **Stap 2: Schrijf rules/routes.md met paths: frontmatter**

```markdown
---
paths:
  - "apps/web/src/app/**"
  - "packages/ui/src/navigation/**"
---

# Routes & Navigatie

## Route-tabel
[Kopieer route-tabel uit CLAUDE.md]

## Navigatie (VERPLICHT — geen afwijkingen)
**Single Source of Truth**: `packages/ui/src/navigation/manifest.ts`

[Kopieer navigatie-regels en 4+1 patroon uit CLAUDE.md]

[Kopieer domein-accent tabel uit CLAUDE.md]

Agents MOETEN `manifest.ts` raadplegen voor navigatiestructuur.
```

- [ ] **Stap 3: Commit**

```bash
git add rules/routes.md
git commit -m "rules: voeg path-scoped routes.md toe"
```

---

### Taak 4: Bestaande rules paths: frontmatter toevoegen

**Files:**
- Modify: `rules/knkv-regels.md` (regel 1)
- Modify: `rules/ow-voorkeuren.md` (regel 1)
- Modify: `rules/design-system.md` (regel 1)
- Modify: `rules/beheer.md` (regel 1)
- Modify: `rules/teamindeling-scheiding.md` (regel 1)

- [ ] **Stap 1: Voeg paths: frontmatter toe aan knkv-regels.md**

Voeg toe bovenaan het bestand (vóór de eerste regel):
```yaml
---
paths:
  - "apps/web/src/app/(teamindeling)/**"
  - "apps/web/src/app/(teamindeling-studio)/**"
  - "apps/web/src/components/teamindeling/**"
  - "apps/web/src/lib/teamindeling/**"
---
```

- [ ] **Stap 2: Voeg paths: frontmatter toe aan ow-voorkeuren.md**

Zelfde paths als knkv-regels.md:
```yaml
---
paths:
  - "apps/web/src/app/(teamindeling)/**"
  - "apps/web/src/app/(teamindeling-studio)/**"
  - "apps/web/src/components/teamindeling/**"
  - "apps/web/src/lib/teamindeling/**"
---
```

- [ ] **Stap 3: Voeg paths: frontmatter toe aan design-system.md**

```yaml
---
paths:
  - "packages/ui/**"
  - "apps/web/src/components/**"
  - "apps/web/src/app/**/globals.css"
---
```

- [ ] **Stap 4: Voeg paths: frontmatter toe aan beheer.md**

```yaml
---
paths:
  - "apps/web/src/app/(beheer)/**"
  - "apps/web/src/components/beheer/**"
  - "apps/web/src/lib/beheer/**"
---
```

- [ ] **Stap 5: Voeg paths: frontmatter toe aan teamindeling-scheiding.md**

```yaml
---
paths:
  - "apps/web/src/app/(teamindeling)/**"
  - "apps/web/src/app/(teamindeling-studio)/**"
  - "apps/web/src/components/teamindeling/**"
---
```

- [ ] **Stap 6: Commit**

```bash
git add rules/knkv-regels.md rules/ow-voorkeuren.md rules/design-system.md rules/beheer.md rules/teamindeling-scheiding.md
git commit -m "rules: voeg paths: frontmatter toe aan 5 bestaande rules"
```

---

### Taak 5: CLAUDE.md trimmen naar ~150 regels

**Files:**
- Modify: `CLAUDE.md` (van 485 → ~150 regels)

Dit is de grootste taak. De aanpak: verwijder secties die nu in rules/ staan en vervang ze door verwijzingen.

- [ ] **Stap 1: Lees huidige CLAUDE.md volledig**

Identificeer welke secties weg kunnen:
- "Database > Tabelverdeling" → nu in `rules/database.md`
- "Database > Competitie-datamodel" → nu in `rules/database.md`
- "Database > rel_code" details → nu in `rules/database.md`
- "Database > Lees/schrijf" → nu in `rules/database.md`
- "Agents" volledige tabel → nu in `rules/agents.md`
- "Agent Fencing" → nu in `rules/agents.md`
- "Agent Hiërarchie" → nu in `rules/agents.md`
- "Agent Startup" → nu in `rules/agents.md`
- "Agent Teams" → nu in `rules/agents.md`
- "Routes" tabel → nu in `rules/routes.md`
- "Design System" details → al in `rules/design-system.md`
- "Design System > Navigatie" → nu in `rules/routes.md`
- "Data Flow" diagram → nu in `rules/database.md`
- "Externe koppelingen" tabel → kan weg (staat in code)
- "Skills" secties → nu in `rules/agents.md`

- [ ] **Stap 2: Schrijf nieuwe compacte CLAUDE.md**

De nieuwe CLAUDE.md bevat alleen:
1. **Wat is dit** (3 regels)
2. **Structuur** (kort, ~15 regels)
3. **Commando's** (ongewijzigd, ~15 regels)
4. **Verplichte patronen** (logger, auth, API routes — kritiek, ~40 regels)
5. **Database kern** (5 regels + verwijzing naar rules/database.md)
6. **Communicatie** (5 regels)
7. **Verwijzingen** naar rules/ en docs/kennis/ (~10 regels)

Doel: ~150 regels. Alles wat verwijderd wordt staat nu in een rule of kennisdocument.

- [ ] **Stap 3: Verifieer regelcount**

Run: `wc -l CLAUDE.md`
Verwacht: 130-170 regels

- [ ] **Stap 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: trim CLAUDE.md van 485 naar ~150 regels"
```

---

### Taak 6: deploy skill verwijderen

**Files:**
- Delete: `.claude/skills/deploy/SKILL.md`

- [ ] **Stap 1: Verifieer dat geen agents naar `deploy` verwijzen**

Run: `grep -r "deploy" .claude/agents/ --include="*.md" | grep -v "deployment"`
Verwacht: geen matches op `shared/deploy` of `skills: deploy`

- [ ] **Stap 2: Verifieer dat `deployment` skill alles dekt**

Lees `.claude/skills/deployment/SKILL.md` en controleer dat het de functionaliteit van `deploy` bevat (release workflow, CI check, push).

- [ ] **Stap 3: Verwijder de deploy skill**

```bash
rm -rf .claude/skills/deploy/
```

- [ ] **Stap 4: Commit**

```bash
git add .claude/skills/deploy/
git commit -m "chore: verwijder deploy skill (duplicaat van deployment)"
```

---

### Taak 7: seizoenscyclus skill aanmaken

**Files:**
- Create: `.claude/skills/seizoenscyclus/SKILL.md`
- Read: `docs/kennis/seizoenscyclus.md` (bron)

- [ ] **Stap 1: Schrijf de seizoenscyclus skill**

```markdown
---
name: seizoenscyclus
description: Geeft seizoenscontext aan agents. Welke periode, welke mijlpalen, welke KNKV-deadlines. Gebruik bij elke taak die seizoensbewust moet zijn.
allowed-tools: Read, Glob
---

# Seizoenscyclus — Context voor agents

Deze skill geeft je de seizoenscontext zodat je werk past bij wat er nu speelt.

## Stap 1: Bepaal de huidige datum

Gebruik de huidige datum om te bepalen in welke periode het seizoen zit:

| Periode | Maanden | Kenmerk |
|---------|---------|---------|
| **Start** | aug - sep | "Vierkante wielen" — teams laten draaien |
| **Draaiend** | okt - feb | Op stoom — competitie en opleidingen |
| **Oogsten & Zaaien** | mrt - jun | Evaluaties + teamindeling volgend seizoen |

## Stap 2: Lees de seizoenscyclus

Lees `docs/kennis/seizoenscyclus.md` en zoek de huidige maand op in het maandoverzicht. Noteer:

1. Welke TC-activiteiten nu spelen
2. Welke KNKV-deadlines de komende 4 weken vallen
3. Welke activiteitenstromen nu het meest intensief zijn

## Stap 3: Pas je werk aan

Gebruik de seizoenscontext om:
- Prioriteiten te bepalen (wat is nu urgent?)
- Relevante domeinkennis te laden (evaluatie? teamindeling? roostering?)
- Te signaleren als een KNKV-deadline nadert

## Referenties

- Seizoenscyclus: `docs/kennis/seizoenscyclus.md`
- KNKV-regels: `docs/kennis/knkv-competitie.md`
- TC-organisatie: `docs/kennis/tc-organisatie.md`
- TC-beleid: `docs/kennis/tc-beleid.md`
```

- [ ] **Stap 2: Commit**

```bash
git add .claude/skills/seizoenscyclus/
git commit -m "feat: seizoenscyclus skill voor agents"
```

---

### Taak 8: start skill uitbreiden met seizoenscontext

**Files:**
- Modify: `.claude/skills/start/SKILL.md`

- [ ] **Stap 1: Lees huidige start skill**

Lees `.claude/skills/start/SKILL.md` en identificeer waar seizoenscontext toegevoegd moet worden.

- [ ] **Stap 2: Voeg seizoenscontext toe aan Stap 2 (Domeincontext)**

Voeg een nieuwe sectie toe na de bestaande domeincontext-instructies:

```markdown
### Seizoenscontext (altijd laden)

Ongeacht je domein, laad altijd de seizoenscontext:

1. Bepaal de huidige datum
2. Lees `docs/kennis/seizoenscyclus.md` en zoek de huidige maand
3. Noteer:
   - Welke periode: Start (aug-sep), Draaiend (okt-feb), of Oogsten & Zaaien (mrt-jun)
   - Welke TC-activiteiten nu spelen
   - Eerstvolgende KNKV-deadline
4. Gebruik deze context bij al je werk
```

- [ ] **Stap 3: Voeg kennisdocumenten toe aan Stap 2**

Voeg onder de domein-secties toe:

```markdown
### Altijd beschikbare kennisdocumenten

Alle agents hebben toegang tot:
- `docs/kennis/tc-beleid.md` — TC-positie, mandaat, Oranje Draad
- `docs/kennis/tc-organisatie.md` — TC-samenstelling, coördinatoren
- `docs/kennis/seizoenscyclus.md` — Jaarkalender, KNKV-deadlines
- `docs/kennis/knkv-competitie.md` — Competitieregels A/B-categorie
```

- [ ] **Stap 4: Commit**

```bash
git add .claude/skills/start/SKILL.md
git commit -m "feat: start skill uitgebreid met seizoenscontext en kennisdocs"
```

---

### Taak 9: Verificatie en CLAUDE.md update

**Files:**
- Read: `CLAUDE.md` (verificatie)
- Read: `rules/*.md` (verificatie paths:)

- [ ] **Stap 1: Verifieer CLAUDE.md regelcount**

Run: `wc -l CLAUDE.md`
Verwacht: 130-170 regels

- [ ] **Stap 2: Verifieer alle rules paths: frontmatter**

Run: `head -6 rules/database.md rules/agents.md rules/routes.md rules/knkv-regels.md rules/ow-voorkeuren.md rules/design-system.md rules/beheer.md rules/teamindeling-scheiding.md`
Verwacht: elke rule heeft `---` / `paths:` / paden / `---` bovenaan

- [ ] **Stap 3: Verifieer deploy skill verwijderd**

Run: `ls .claude/skills/deploy/ 2>/dev/null || echo "CORRECT: deploy skill verwijderd"`
Verwacht: "CORRECT: deploy skill verwijderd"

- [ ] **Stap 4: Verifieer seizoenscyclus skill bestaat**

Run: `cat .claude/skills/seizoenscyclus/SKILL.md | head -5`
Verwacht: frontmatter met name: seizoenscyclus

- [ ] **Stap 5: Verifieer skills-telling**

Run: `ls -d .claude/skills/*/SKILL.md | wc -l`
Verwacht: 39 (was 40, -1 deploy)

- [ ] **Stap 6: Update CLAUDE.md verwijzingen**

Controleer dat CLAUDE.md correct verwijst naar:
- `rules/database.md` voor database-details
- `rules/agents.md` voor agent-hiërarchie
- `rules/routes.md` voor routes en navigatie
- `docs/kennis/` voor domeinkennis

- [ ] **Stap 7: Final commit**

```bash
git add -A
git commit -m "docs: fundament implementatie compleet — CLAUDE.md getrimd, rules path-scoped, skills opgeschoond"
```
