---
name: team-documentatie
description: Start een Agent Team voor het schrijven en bijwerken van documentatie voor de team-indeling app.
disable-model-invocation: true
argument-hint: "[optioneel: welke docs bijwerken of specifieke focus]"
---

# Agent Team: Documentatie

Start een agent team voor het schrijven en onderhouden van documentatie voor de team-indeling app van c.k.v. Oranje Wit.

## Team samenstelling

### Lead: documentalist
- **Rol**: Schrijft en structureert alle documentatie
- **Verantwoordelijkheden**:
  - Leest de codebase (pagina's, componenten, routes, lib)
  - Schrijft functionele documentatie (voor TC-leden)
  - Schrijft technische documentatie (voor ontwikkelaars/agents)
  - Houdt documentatie lean en up-to-date
  - Coördineert reviews met teammates

### Teammate 1: ontwikkelaar
- **Rol**: Technische verificatie
- **Verantwoordelijkheden**:
  - Beantwoordt technische vragen over de codebase
  - Reviewt architectuur.md en api-routes.md op juistheid
  - Controleert of bestandspaden en patronen kloppen
- **Communiceert met**: documentalist (technische details en review)

### Teammate 2: korfbal
- **Rol**: Domeinverificatie
- **Verantwoordelijkheden**:
  - Verifieert korfbalterminologie en KNKV-regelreferenties
  - Reviewt functioneel.md en validatie-regels.md op domeinaccuraatheid
  - Controleert Oranje Draad-verwijzingen
- **Communiceert met**: documentalist (domeinkennis en review)

## Werkwijze

### Fase 1: Inventarisatie (documentalist lead)
1. **documentalist** leest de huidige codebase en bestaande documentatie
2. **documentalist** spawnt **ontwikkelaar** voor technische details waar nodig
3. **documentalist** spawnt **korfbal** voor domeinvragen

### Fase 2: Schrijven (documentalist lead)
4. **documentalist** schrijft `README.md` (hoofdingang)
5. **documentalist** schrijft `docs/architectuur.md` (technisch fundament)
6. **documentalist** schrijft `docs/functioneel.md` (voor TC-leden)
7. **documentalist** schrijft `docs/api-routes.md` (API-referentie)
8. **documentalist** schrijft `docs/validatie-regels.md` (businessregels)
9. **documentalist** update `CLAUDE.md` (inventarissen toevoegen)

### Fase 3: Review (parallel)
10. **ontwikkelaar** reviewt architectuur.md en api-routes.md
11. **korfbal** reviewt functioneel.md en validatie-regels.md
12. **documentalist** verwerkt feedback

### Fase 4: Afronden
13. **documentalist** controleert formatting (`pnpm format`)
14. **documentalist** maakt een commit (na bevestiging gebruiker)

## Communicatiepatronen

```
TC (gebruiker)
    ↕ opdracht en goedkeuring
documentalist (lead)
    ↕ schrijft docs, coördineert reviews
    ├── ontwikkelaar (technische verificatie)
    │   ↕ technische details en review-feedback
    └── korfbal (domeinverificatie)
        ↕ terminologie en regelverificatie
```

## Documentatiestructuur

```
apps/team-indeling/
├── README.md                      # Hoofdingang (stack, starten, links)
├── CLAUDE.md                      # Agent-context (procesmodel, inventarissen)
├── docs/
│   ├── functioneel.md             # Voor TC-leden (beknopt, praktisch)
│   ├── architectuur.md            # Voor ontwikkelaars (datamodel, patronen)
│   ├── api-routes.md              # API-referentie (tabel per domein)
│   └── validatie-regels.md        # Businessregels (KNKV + OW)
```

## Context

- **Taal**: Nederlands
- **App**: `apps/team-indeling/` (Next.js 16, Tailwind CSS 4)
- **Database**: PostgreSQL op Railway, schema in `packages/database/prisma/schema.prisma`
- **Regels**: `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`, `rules/oranje-draad.md`

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, inventariseer dan:
1. Welke documentatie is verouderd of ontbreekt?
2. Welke bestanden moeten bijgewerkt worden?
3. Is er een specifieke doelgroep (TC-leden of ontwikkelaars)?
