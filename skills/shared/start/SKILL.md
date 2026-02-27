---
name: start
description: Projectcontext laden voor elke agent. Geeft basiskennis (structuur, DB, Oranje Draad) plus domein-specifieke context.
user-invocable: false
allowed-tools: Read, Bash, Glob
---

# Start — Projectcontext voor agents

Deze skill wordt automatisch geladen bij het opstarten van elke agent. Je MOET alle stappen hieronder doorlopen voordat je aan je eigenlijke taak begint.

---

## Stap 1: Basiscontext (lees dit)

### Vereniging

c.k.v. Oranje Wit is een korfbalvereniging uit **Dordrecht**, opgericht in 1926. In 2026 viert de club het 100-jarig jubileum.

- **Adres**: Nieuwe Noordpolderweg 5, 3312 AD Dordrecht (Stadspolders)
- **Website**: www.ckvoranjewit.nl
- **Motto**: "Een leven lang!"
- **Contact**: 078-6146836 / info@ckvoranjewit.nl

### Communicatie

- Schrijf altijd in het **Nederlands**
- Gebruik een **informele, directe** toon — dit zijn vrijwilligers met weinig tijd
- Schrijf de naam altijd als **"c.k.v. Oranje Wit"** (met punten, spatie)
- **Privacy**: schrijf nooit BSN, geboortedatum of adresgegevens naar output

### De Oranje Draad

Het technisch beleid van c.k.v. Oranje Wit:

```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```

- **Plezier** — Altijd hoogste prioriteit. Niet onderhandelbaar. Elk kind moet met plezier sporten.
- **Ontwikkeling** — Het echte doel. Spelers uitdagen op hun niveau. Doorstroom bieden.
- **Prestatie** — Middel, nooit einddoel. Competitief zijn als het bijdraagt aan ontwikkeling.
- **Duurzaamheid** — Het resultaat van de juiste balans. Meerjarenvisie, retentie boven korte-termijn succes.

#### POP-ratio per leeftijdsgroep

| Leeftijd | Plezier | Ontwikkeling | Prestatie |
|---|---|---|---|
| 5-7 (Blauw) | 70% | 25% | 5% |
| 8-9 (Groen) | 55% | 35% | 10% |
| 10-12 (Geel) | 40% | 40% | 20% |
| 13-15 (Oranje/U15) | 30% | 40% | 30% |
| 16-18 (Rood/U17/U19) | 25% | 35% | 40% |
| Senioren wedstrijd | 20% | 25% | 55% |
| Senioren breedte | 50% | 20% | 30% |

#### Toetsingsvragen bij teamindeling

1. Heeft elk team voldoende sociale cohesie? (Plezier)
2. Worden spelers uitgedaagd op hun niveau? (Ontwikkeling)
3. Zijn de selectieteams sterk genoeg om competitief te zijn? (Prestatie)
4. Is deze indeling volhoudbaar met de beschikbare staf? (Duurzaamheid)
5. Zijn er spelers met hoog retentierisico die extra aandacht nodig hebben?

#### Seizoenscyclus

- Juni: pre-season indeling delen
- Augustus: nieuw seizoen start
- Competities: veld_najaar, zaal, veld_voorjaar

### Monorepo-structuur

```
oranje-wit/
├── apps/
│   ├── monitor/          # Verenigingsmonitor (Express, poort 4102)
│   ├── team-indeling/    # Team-Indeling (Next.js 16, poort 4100)
│   └── mcp/              # MCP servers
├── packages/
│   ├── database/         # Prisma schema + client (source of truth)
│   └── types/            # Gedeelde TypeScript types
├── agents/               # 8 agent-definities (dit bestand!)
├── skills/               # Skills per domein
├── rules/                # Domeinregels (Single Source of Truth)
├── scripts/              # Data-pipeline en import
├── data/                 # Alle data (16 seizoenen)
└── docs/                 # Documentatie
```

- **Workspace**: pnpm workspaces
- **Dev commando's**: `pnpm dev:ti` (TI), `pnpm dev:monitor` (Monitor)
- **Database**: `pnpm db:generate`, `pnpm db:push`

### Database

PostgreSQL op Railway (`shinkansen.proxy.rlwy.net:18957`, DB: `oranjewit`).
Prisma is de source of truth: `packages/database/prisma/schema.prisma`.

**33 modellen in 3 groepen:**

| Groep | Modellen |
|---|---|
| Competitie-data | SpelerSeizoen, CompetitieSpeler, CompetitieRonde |
| Monitor | Lid, LidFoto, Seizoen, Snapshot, LidSnapshot, OWTeam, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel |
| Team-Indeling | User, Speler, Staf, Blauwdruk, Pin, Concept, Scenario, Versie, Team, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam |

**Competitie-datamodel:**
```
SpelerSeizoen (1 per speler per seizoen)
  └── CompetitieSpeler (1 per competitieperiode: veld_najaar, zaal, veld_voorjaar)
```
- 9375 records uit 5 bronnen (telling, snapshot, a2, sportlink, afgeleid)
- Dekking: veld_najaar (16 seizoenen), zaal (7), veld_voorjaar (8)

**Lees/schrijf-verdeling:**
- Monitor schrijft: leden, snapshots, teams, verloop, cohorten, signalering, speler_seizoenen, competitie_spelers
- Monitor leest: alles
- Team-Indeling schrijft: blauwdruk, concepten, scenario's, teams, pins, log, evaluaties
- Team-Indeling leest: leden, speler_seizoenen, competitie_spelers, retentie

### Agent-hiërarchie

```
korfbal (hoofd monitor)
├── spawns: data-analist, speler-scout, team-selector

team-planner (hoofd TI) ← escalates-to: korfbal
├── spawns: regel-checker, adviseur

ontwikkelaar (dev) ← escalates-to: korfbal
```

### Rules

Lees altijd: `rules/algemeen.md`. Lees extra rules op basis van je domein (zie Stap 2).

| Bestand | Onderwerp |
|---|---|
| `rules/algemeen.md` | Taal, toon, naamgeving |
| `rules/data.md` | Privacy, bestandsnaamgeving, drielagenmodel |
| `rules/knkv-regels.md` | KNKV Competitie 2.0 regels |
| `rules/ow-voorkeuren.md` | OW teamgrootte-targets en genderregels |
| `rules/oranje-draad.md` | Drie pijlers, POP-ratio's, seizoenscyclus |

---

## Stap 2: Domeincontext (lees wat bij je past)

Bepaal je domein op basis van je `skills:`-lijst in `agents/{jouw-naam}.md`.

### Als je skills `monitor/*` bevatten → Monitor-domein

**Lees ook:** `rules/data.md`

De Verenigingsmonitor is een Express-app (poort 4102) met HTML dashboards. Data komt uit meerdere bronnen:

**Data-pipeline:**
- Sportlink CSV/JSON → `data/leden/snapshots/` → aggregaties → signalering → Railway DB
- Telling Excel (16 seizoenen) → `sync-telling.ts` → speler_seizoenen + veld_najaar
- A2-formulieren (.xlsm) → competitie_spelers (zaal)
- Sportlink juni-snapshots → `import-veld-voorjaar.js` → competitie_spelers (veld_voorjaar)

**Import-scripts:** `scripts/import/` (TypeScript), `scripts/js/` (JavaScript), `scripts/python/` (analyses)

**Drielagenmodel data:**
1. Raw (`data/leden/snapshots/raw/`) — ongewijzigde bronbestanden
2. Verrijkt (`data/leden/snapshots/YYYY-MM-DD.json`) — gecombineerd per lid
3. Aggregaties (`data/aggregaties/`) — statistieken per geboortejaar, team, kleur

### Als je skills `team-indeling/*` bevatten → Team-Indeling-domein

**Lees ook:** `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`

De Team-Indeling is een Next.js 16 app (poort 4100) met:
- **Stack**: React 19, Tailwind CSS 4, NextAuth v5 (EDITOR/VIEWER rollen), dnd-kit
- **Workflow**: blauwdruk → concept → scenario → definitief
- **Blauwdruk**: teamgrootte-targets, genderregels, leeftijdsgrenzen
- **Concept**: drag-and-drop teamsamenstelling
- **Scenario**: vergelijking van meerdere concepten
- **Definitief**: besluitenlog, export

### Als je skills van beide domeinen bevatten → Lees beide secties

---

## Stap 3: Dynamische context (voer uit)

Voer de volgende commando's uit om de huidige staat te kennen:

1. `git log --oneline -5` — recente commits
2. `git status --short` — uncommitted changes

Noteer de huidige datum.

---

## Stap 4: Lees je eigen agent-bestand

Lees `agents/{jouw-naam}.md` voor je specifieke:
- **triggers** — wanneer word je geactiveerd
- **skills** — wat mag je gebruiken
- **spawns** — wie kun je inzetten
- **escalates-to** — naar wie escaleer je

---

## Nu ben je klaar

Je hebt nu volledige projectcontext. Ga aan de slag met je eigenlijke taak.
