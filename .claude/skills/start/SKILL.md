---
name: start
description: Projectcontext laden voor agents en gebruikers. Geeft basiskennis (structuur, DB, Oranje Draad) plus domein-specifieke context.
user-invocable: true
allowed-tools: Read, Bash, Glob, Agent
---

# Start — Projectcontext laden

Agents MOETEN alle stappen doorlopen voordat ze aan hun taak beginnen.

---

## Stap 1: Basiscontext

### Vereniging

c.k.v. Oranje Wit — korfbalvereniging uit Dordrecht, opgericht 1926. Motto: "Een leven lang!"

- **Taal**: altijd Nederlands, informeel en direct
- **Naam**: altijd "c.k.v. Oranje Wit" (met punten, spatie)
- **Privacy**: nooit BSN, geboortedatum of adres naar output

### De Oranje Draad

```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```

Details: `rules/oranje-draad.md` en `docs/kennis/tc-beleid.md`

### Monorepo

Eén Next.js 16 app (`apps/web/`) met route groups per domein:

```
/monitor/        — Dashboards, signalering, retentie
/teamindeling/   — Kaders, scenario's, drag & drop (mobile)
/ti-studio/      — Team-Indeling desktop workspace (light)
/evaluatie/      — Rondes, invullen, zelfevaluatie
/scouting/       — Verzoeken, rapporten, kaarten
/beheer/         — 9 TC-domeinen, gebruikersbeheer
/beleid/         — Visie, doelgroepen, Oranje Draad (TC-only)
```

- **Workspace**: pnpm, `pnpm dev` start op poort 3000
- **Database**: PostgreSQL + Prisma (`packages/database/`), `rel_code` is enige sleutel
- **Auth**: Google OAuth (TC) + Smartlinks (overige gebruikers)

Alle details: `CLAUDE.md` (compact), `rules/` (domeinregels), `docs/kennis/` (domeinkennis)

### Verdieping (lees wanneer relevant)

| Bron | Onderwerp |
|---|---|
| `rules/database.md` | 61 modellen, datamodel, rel_code, lees/schrijf |
| `rules/agents.md` | Agents, fencing, hiërarchie, teams |
| `rules/routes.md` | Route-tabel, navigatie, 4+1 patroon |
| `rules/design-system.md` | Dark-first tokens, componenten, design gate |
| `rules/knkv-regels.md` | KNKV Competitie 2.0 regels |
| `rules/ow-voorkeuren.md` | OW teamvoorkeuren, indelingsfilosofie |
| `rules/oranje-draad.md` | POP-ratio's, seizoenscyclus, toetsingsvragen |
| `rules/score-model.md` | USS schaal, speler/team scores |
| `rules/beheer.md` | 9 TC-domeinen, autorisatie, temporeel model |
| `docs/kennis/tc-beleid.md` | TC-positie, mandaat, missie |
| `docs/kennis/tc-organisatie.md` | TC-samenstelling, coördinatoren |
| `docs/kennis/seizoenscyclus.md` | Jaarkalender, KNKV-deadlines, maandoverzicht |
| `docs/kennis/knkv-competitie.md` | Competitieregels, speelgerechtigdheid |

---

## Stap 2: Domeincontext

Bepaal je domein op basis van je `skills:`-lijst in `.claude/agents/{jouw-naam}.md` en lees de bijbehorende rules en kennis-documenten.

- **Monitor** → `rules/data.md`
- **Team-Indeling** → `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`
- **Evaluatie** → `rules/beheer.md`
- **Meerdere domeinen** → lees alles dat relevant is

---

## Stap 3: Seizoenscontext

1. Bepaal de huidige datum
2. Lees `docs/kennis/seizoenscyclus.md` en zoek de huidige maand
3. Noteer: welke periode, welke TC-activiteiten, eerstvolgende KNKV-deadline

---

## Stap 4: Dynamische context

```bash
git log --oneline -5   # recente commits
git status --short     # uncommitted changes
```

---

## Stap 5: Recente learnings laden

Controleer of er recente learnings zijn:

```bash
ls -t docs/learnings/*.md 2>/dev/null | head -3
```

Als er 3 of meer learnings zijn: lees de 3 meest recente.
Als er minder zijn: lees alle beschikbare.
Als `docs/learnings/` niet bestaat of leeg is: sla deze stap over.

Extraheer uit elke learning de sectie **"Actiepunten volgende sprint"**. Neem deze actiepunten mee als actieve context voor deze sessie:

- Zijn deze actiepunten nu van toepassing op de huidige taak?
- Is er een actiepunt dat deze sessie opgepakt kan worden?
- Zijn er actiepunten die inmiddels zijn opgelost? (Dan hoef je ze niet meer te noemen)

Rapporteer actieve openstaande actiepunten kort aan de gebruiker bij het opstarten (alleen als relevant voor de huidige taak).

---

## Stap 6: Memory raadplegen

1. Lees `MEMORY.md` in de memory-directory
2. Lees relevante memories op basis van domein en taak
3. Sla tijdens het werk nieuwe inzichten op als memory

---

## Stap 7: Product Owner afstemming (verplicht)

Na het laden van context, spawn **altijd** de `product-owner` agent voordat je aan het werk gaat.

De product-owner:
1. **Analyseert de huidige stand** — git log, open werk, roadmap, seizoenscontext
2. **Stelt prioriteiten voor** — wat heeft nu de meeste waarde
3. **Toetst aan visie en strategie** — past dit bij de Oranje Draad
4. **Formuleert prompts voor parallelle sessies** — de gebruiker werkt met meerdere Claude Code instances tegelijk. De PO schrijft concrete, afgebakende opdrachten zodat sessies onafhankelijk kunnen werken.

```
/start
  → context laden (stap 1-6)
  → spawn product-owner
  → PO presenteert: stand van zaken + prioriteiten
  → gebruiker kiest wat er gebouwd wordt
  → PO schrijft prompts voor parallelle sessies
  → gebruiker start de sessies
```

Zonder PO-afstemming geen implementatie.

---

## Nu ben je klaar

Je hebt projectcontext, memories én PO-afstemming. Ga aan de slag.
