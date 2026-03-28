---
name: start
description: Projectcontext laden voor agents en gebruikers. Geeft basiskennis (structuur, DB, Oranje Draad) plus domein-specifieke context.
user-invocable: true
allowed-tools: Read, Bash, Glob
---

# Start — Projectcontext voor agents en gebruikers

Deze skill laadt de volledige projectcontext. Agents MOETEN alle stappen doorlopen voordat ze aan hun eigenlijke taak beginnen. Gebruikers kunnen `/start` aanroepen voor een volledig overzicht.

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
│   ├── web/              # Geconsolideerde app (Next.js 16, poort 3000, alle domeinen)
│   │   └── src/app/
│   │       ├── (monitor)/        # Route group: Verenigingsmonitor
│   │       ├── (teamindeling)/   # Route group: Team-Indeling
│   │       ├── (evaluatie)/      # Route group: Evaluatie
│   │       ├── (scouting)/       # Route group: Scouting (mobile-first PWA)
│   │       └── (beheer)/         # Route group: TC Beheer (9 domeinen)
│   └── mcp/              # MCP servers (database, Railway)
├── packages/
│   ├── auth/             # @oranje-wit/auth — NextAuth v5 + Google OAuth
│   ├── database/         # @oranje-wit/database — Prisma schema + client (source of truth)
│   ├── types/            # @oranje-wit/types — Gedeelde TypeScript types
│   └── ui/               # @oranje-wit/ui — Gedeelde React componenten
├── .claude/
│   ├── agents/           # Agent-definities (20 agents)
│   └── skills/           # Skills (37 skills, flat structuur)
├── rules/                # Domeinregels (8 bestanden, Single Source of Truth)
├── scripts/              # Data-pipeline en import
├── data/                 # Ledendata, seizoensdata, exports
└── docs/                 # Documentatie, plannen, stafgegevens
```

- **Workspace**: pnpm workspaces
- **Dev**: `pnpm dev` (start de geconsolideerde app op poort 3000)
- **Build**: `pnpm build`
- **Database**: `pnpm db:generate`, `pnpm db:migrate` (NOOIT `db:push`)
- **Import**: `pnpm import` (monitor data), `pnpm import:evaluaties` (evaluaties)
- **Tests**: `pnpm test` (unit), `pnpm test:e2e` (E2E)

### Database

PostgreSQL op Railway (`shinkansen.proxy.rlwy.net:18957`, DB: `oranjewit`).
Prisma is de source of truth: `packages/database/prisma/schema.prisma`.

**61 modellen in 8 groepen:**

| Groep | Modellen |
|---|---|
| Competitie-data (2) | CompetitieSpeler, CompetitieRonde |
| Monitor (12) | Lid, LidFoto, Seizoen, OWTeam, TeamAlias, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel, PoolStand, PoolStandRegel |
| Team-Indeling (26) | User, Speler, Staf, StafToewijzing, Blauwdruk, BlauwdrukBesluit, BlauwdrukSpeler, StandaardVraag, Pin, Concept, Scenario, ScenarioSnapshot, Versie, Team, SelectieGroep, SelectieSpeler, SelectieStaf, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam, Werkitem, Actiepunt, Mijlpaal |
| Evaluatie (6) | EvaluatieRonde, Coordinator, CoordinatorTeam, EvaluatieUitnodiging, SpelerZelfEvaluatie, EmailTemplate |
| Scouting (9) | ScoutingVerzoek, ScoutToewijzing, ScoutingRapport, Scout, TeamScoutingSessie, ScoutBadge, ScoutChallenge, ScoutingVergelijking, ScoutingVergelijkingPositie |
| Jeugdontwikkeling (4) | RaamwerkVersie, Leeftijdsgroep, Pijler, OntwikkelItem |
| Systeem (5) | Gebruiker, VerificatieToken, ToegangsToken, Activiteit, Aanmelding |
| Speler-extensies (3) | FysiekProfiel, SpelerUSS, SpelersKaart |

**Competitie-datamodel:**
```
CompetitieSpeler (primaire tabel: ~4933 records, 1 per speler × seizoen × competitie)
  └── VIEW speler_seizoenen (afgeleid via DISTINCT ON rel_code+seizoen)
```
- Competitie-volgorde: veld_najaar → zaal → veld_voorjaar

**rel_code is de enige sleutel voor spelers/leden (KRITIEK):**
- `rel_code` (Sportlink relatienummer, bijv. `NJH39X4`) is de **enige stabiele identifier**
- `Speler.id` = `rel_code` — TI-spelerrecord IS de rel_code
- Gebruik **altijd** rel_code als lookup-sleutel, **nooit** naam-matching
- Als een speler niet via rel_code gevonden wordt: meld dit als fout, los het niet stilzwijgend op

**Lees/schrijf-verdeling:**
- Monitor schrijft: leden, teams, verloop, cohorten, signalering, competitie_spelers
- Monitor leest: alles
- Team-Indeling schrijft: blauwdruk, concepten, scenario's, teams, selectiegroepen, pins, log, evaluaties, notities, actiepunten
- Team-Indeling leest: leden, speler_seizoenen, competitie_spelers, cohort_seizoenen (retentie)
- Evaluatie schrijft: evaluatierondes, coördinatoren, uitnodigingen, evaluaties, zelfevaluaties, email templates
- Evaluatie leest: leden, competitie_spelers, teams, spelers, staf

### Agent-hiërarchie

```
korfbal (hoofd monitor)
├── spawns: data-analist, speler-scout, team-selector

team-planner (hoofd TI) ← escalates-to: korfbal
├── spawns: regel-checker, adviseur

ontwikkelaar (dev) ← escalates-to: korfbal
├── spawns: e2e-tester, devops

devops (infra lead) ← escalates-to: ontwikkelaar
├── spawns: deployment, e2e-tester

e2e-tester ← escalates-to: ontwikkelaar
deployment (infra) ← escalates-to: devops
documentalist (docs) ← escalates-to: ontwikkelaar

jeugd-architect (hoofd jeugdontwikkeling) ← escalates-to: korfbal
├── spawns: sportwetenschap, mentaal-coach, communicatie

ux-designer (hoofd UX) ← escalates-to: ontwikkelaar
├── spawns: frontend, ontwikkelaar
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
| `rules/score-model.md` | USS schaal, speler/team score formules |
| `rules/beheer.md` | Ubiquitous language, 9 TC-domeinen |
| `rules/design-system.md` | Dark-first tokens, design gate |

---

## Stap 2: Domeincontext (lees wat bij je past)

Bepaal je domein op basis van je `skills:`-lijst in `.claude/agents/{jouw-naam}.md`.

### Als je skills `monitor/*` bevatten → Monitor-domein

**Lees ook:** `rules/data.md`

De Verenigingsmonitor is de route group `(monitor)` in `apps/web/` (route `/monitor/*`). Dashboards met data uit meerdere bronnen:

**Data-pipeline:**
- `competitie_spelers` (primaire tabel, data staat definitief in DB)
- VIEW `speler_seizoenen` leidt hieruit af
- `bereken-verloop.js` → ledenverloop → `bereken-cohorten.js` → cohort_seizoenen → `genereer-signalering.js` → signalering

**Pipeline-scripts:** `scripts/js/` (JavaScript verloop-pipeline), draaien met `node -r dotenv/config`

### Als je skills `team-indeling/*` bevatten → Team-Indeling-domein

**Lees ook:** `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`

De Team-Indeling is de route group `(teamindeling)` in `apps/web/` (route `/teamindeling/*`) met:
- **Stack**: React 19, Tailwind CSS 4, NextAuth v5 (EDITOR/VIEWER rollen), dnd-kit
- **Workflow**: blauwdruk → concept → scenario → definitief
- **Blauwdruk**: teamgrootte-targets, genderregels, leeftijdsgrenzen
- **Concept**: drag-and-drop teamsamenstelling
- **Scenario**: vergelijking van meerdere concepten
- **Definitief**: besluitenlog, export

### Als je skills `evaluatie/*` bevatten → Evaluatie-domein

De Evaluatie-app is de route group `(evaluatie)` in `apps/web/` (route `/evaluatie/*`) met:
- Spelerevaluaties en zelfevaluaties per seizoen
- Uitnodigingen en email templates
- Direct gekoppeld aan leden en teams via rel_code

### Als je skills van meerdere domeinen bevatten → Lees alle relevante secties

---

## Stap 3: Dynamische context (voer uit)

Voer de volgende commando's uit om de huidige staat te kennen:

1. `git log --oneline -5` — recente commits
2. `git status --short` — uncommitted changes

Noteer de huidige datum.

---

## Stap 4: Lees je eigen agent-bestand

Lees `.claude/agents/{jouw-naam}.md` voor je specifieke:
- **triggers** — wanneer word je geactiveerd
- **skills** — wat mag je gebruiken
- **spawns** — wie kun je inzetten
- **escalates-to** — naar wie escaleer je

---

## Stap 5: Memory raadplegen en bijwerken

Agents MOETEN altijd memory raadplegen en bijwerken. Dit is niet optioneel.

### Bij het starten:
1. Lees `MEMORY.md` in de memory-directory (`~/.claude/projects/c--Users-antja-oranje-wit/memory/`)
2. Lees relevante memory-bestanden op basis van je domein en de huidige taak
3. Gebruik deze context om betere beslissingen te nemen

### Tijdens het werk:
- Als je iets leert dat nuttig is voor toekomstige gesprekken → sla het op als memory
- TC-besluiten, spelersafspraken, verrassende bevindingen → `project`-memory
- Correcties of bevestigingen van de gebruiker → `feedback`-memory

### Memory-types:
| Type | Wanneer opslaan |
|---|---|
| `project` | TC-besluiten, seizoensconclusies, retentierisico's, deploy-issues |
| `feedback` | Correcties van de gebruiker, bevestigde aanpak, voorkeuren |
| `user` | Nieuwe inzichten over de gebruiker (rol, verantwoordelijkheden) |
| `reference` | Pointers naar externe bronnen (Linear, Slack, Grafana) |

### Formaat:
Sla memories op als apart `.md` bestand met frontmatter (`name`, `description`, `type`) en voeg een regel toe aan `MEMORY.md`.

---

## Nu ben je klaar

Je hebt nu volledige projectcontext en relevante memories. Ga aan de slag met je eigenlijke taak.
