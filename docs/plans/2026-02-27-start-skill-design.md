# Design: Start-skill voor agents

**Datum**: 2026-02-27
**Status**: goedgekeurd

## Doel

Een `shared/start` skill die elke agent bij opstarten doorloopt, zodat alle agents volledig op de hoogte zijn van het project. Gelaagd: basiscontext (iedereen) + domeincontext (op basis van agent's skills-lijst) + lichte dynamische context.

## Aanpak

Monolithische skill: één `skills/shared/start/SKILL.md` met alles inline. Geen aparte bestanden.

## Structuur van de skill

### Basislaag (elke agent)

**1. Vereniging & communicatie**
- c.k.v. Oranje Wit — korfbalvereniging uit Dordrecht (opgericht 1926, 100-jarig jubileum 2026)
- Adres: Nieuwe Noordpolderweg 5, 3312 AD Dordrecht
- Website: www.ckvoranjewit.nl | Motto: "Een leven lang!"
- Taal: Nederlands, informele toon, "c.k.v. Oranje Wit" (met punten)
- Privacy: nooit BSN/geboortedatum/adres in output

**2. De Oranje Draad (compact)**
- Formule: PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
- POP-ratio tabel per leeftijdsgroep (Blauw t/m Senioren)
- 5 toetsingsvragen bij teamindeling
- Seizoenscyclus: juni pre-season → augustus start

**3. Monorepo-structuur**
- Apps: monitor (Express, poort 4102), team-indeling (Next.js 16, poort 4100)
- Packages: database (Prisma), types (gedeeld)
- Rules: 5 bestanden (algemeen, data, knkv-regels, ow-voorkeuren, oranje-draad)
- Data: drielagenmodel (raw → verrijkt → aggregaties)

**4. Database (uitgebreid)**
- PostgreSQL op Railway (`shinkansen.proxy.rlwy.net:18957`, DB: `oranjewit`)
- Prisma = source of truth, 33 modellen in 3 groepen:
  - Competitie-data: SpelerSeizoen, CompetitieSpeler, CompetitieRonde
  - Monitor: Lid, Seizoen, Snapshot, LidSnapshot, OWTeam, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel
  - Team-Indeling: User, Speler, Staf, Blauwdruk, Pin, Concept, Scenario, Versie, Team, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam
- Lees/schrijf-verdeling per app
- Competitie-datamodel: SpelerSeizoen (1 per speler per seizoen) → CompetitieSpeler (1 per competitieperiode: veld_najaar, zaal, veld_voorjaar)

**5. Agent-hiërarchie**
- 8 agents, 3 niveaus
- korfbal (hoofd monitor) → spawns: data-analist, speler-scout, team-selector
- team-planner (hoofd TI) → spawns: regel-checker, adviseur; escalates-to: korfbal
- ontwikkelaar (dev) → escalates-to: korfbal
- Instructie: "Lees je eigen agent-bestand in `agents/{naam}.md`"

**6. Rules-verwijzing**
- Lees altijd: `rules/algemeen.md`
- Lees extra op basis van domein (zie domeinlaag)

### Domeinlaag (bepaald door agent's `skills:`-lijst)

**Monitor-agents** (skills bevatten `monitor/*`):
- Data-pipeline: Sportlink → snapshots → aggregaties → signalering
- Import-scripts: sync-telling.ts, import-veld-voorjaar.js, A2-import, Sportlink-import
- Competitie-data: 9375 records, 5 bronnen, 16 seizoenen dekking
- Extra rules: `rules/data.md`

**TI-agents** (skills bevatten `team-indeling/*`):
- Next.js 16 app: React 19, Tailwind CSS 4, NextAuth v5, dnd-kit
- Workflow: blauwdruk → concept → scenario → definitief
- App-poort: 4100
- Extra rules: `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`

**Brug-agents** (skills van beide domeinen):
- Beide domeinlagen laden

### Dynamische laag

De skill instrueert de agent om uit te voeren:
- `git log --oneline -5` (recente commits)
- `git status --short` (huidige staat)
- Huidige datum noteren

## Afdwinging — dubbele borging

### 1. Agent frontmatter
Nieuw veld `startup-skill: shared/start` in elke agent:
```yaml
startup-skill: shared/start
```

### 2. CLAUDE.md instructie
Toevoegen aan de Agents-sectie:
```
### Agent Startup
Bij het spawnen van een agent via de Task tool MOET eerst de `shared/start` skill worden
geladen. Dit is niet optioneel. De agent leest `skills/shared/start/SKILL.md` als eerste actie.
```

## Skill-frontmatter

```yaml
name: start
description: Projectcontext laden voor elke agent. Geeft basiskennis (structuur, DB, Oranje Draad) plus domein-specifieke context op basis van de agent's skills-lijst.
user-invocable: false
allowed-tools: Read, Bash, Glob
```

## Bestanden die worden aangemaakt/gewijzigd

| Bestand | Actie |
|---|---|
| `skills/shared/start/SKILL.md` | **Nieuw** — de start-skill |
| `agents/*.md` (8 bestanden) | **Wijzig** — voeg `startup-skill: shared/start` toe |
| `CLAUDE.md` | **Wijzig** — voeg Agent Startup instructie toe |
