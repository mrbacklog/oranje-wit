# Teamindeling Status Check — Seizoen 2026-2027

**Gegenereerd**: 10 maart 2026
**Database**: PostgreSQL op Railway

## Overzicht

Dit document geeft de huidige status van de teamindeling in de database. Voer het script `scripts/status-check-team-indeling.ts` uit voor real-time gegevens.

## Hoe status te checken

```bash
# Met pnpm
pnpm exec tsx scripts/status-check-team-indeling.ts

# Of rechtstreeks
npx tsx scripts/status-check-team-indeling.ts
```

## Database-structuur

### Modellen voor teamindeling

| Model | Tabel | Doel |
|---|---|---|
| `Blauwdruk` | UNIQUE per seizoen | Seizoens-raamwerk: concepten, kaders, speerpunten |
| `Concept` | n per blauwdruk | Planningsthema's (bijv. "balans M/V", "jeugd-retentie") |
| `Scenario` | n per concept | Variant van een concept (bijv. "conservatief", "groeierig") |
| `Versie` | Snapshots | Versiegeschiedenis per scenario (voor comparing) |
| `Team` | Binnen versie | Concrete teamdefinitie (naam, categorie, kleur, type) |
| `Pin` | Blauwdruk-level | Vastgezette spelers/staf (voorwaarden) |
| `Speler` | ~924 totaal | Competitie-spelers (rel_code als ID) |
| `CompetitieSpeler` | ~4933 records | Speler × seizoen × competitie |

### Status-enums

**Blauwdruk**:
- `isWerkseizoen`: `true` = actief planningseizoen

**Concept**:
- `ACTIEF` — In voorbereiding
- `GEARCHIVEERD` — Afgesloten
- `DEFINITIEF` — Goedgekeurd

**Scenario**:
- `ACTIEF` — In voorbereiding
- `GEARCHIVEERD` — Afgesloten
- `DEFINITIEF` — Goedgekeurd

**Pin**:
- `SPELER_STATUS` — Statusflag (bijv. "nog niet beschikbaar")
- `SPELER_POSITIE` — Positie-voorkeur/beperking
- `STAF_POSITIE` — Staf-roltoewijzing

**Team**:
- `VIERTAL` | `ACHTTAL` — Teamtype
- `SENIOREN` | `A_CATEGORIE` | `B_CATEGORIE` — Categorie

**Validatie**:
- `GROEN` ✓ — Geen problemen
- `ORANJE` ⚠️ — Waarschuwing
- `ROOD` ✗ — Kritiek probleem
- `ONBEKEND` ? — Niet gevalideerd

## What's Next

### Voor TC: Status opvragen
```bash
pnpm exec tsx scripts/status-check-team-indeling.ts
```

### Voor data-analist: Migratie voorbereiding
1. Controleer of **alle actieve spelers** (2026-2027) in `Speler`-tabel voorkomen
2. Valideer `rel_code` uniekheid
3. Controleer retentie/status-flags

### Voor planner: Blauwdruk starten
1. Create `Blauwdruk` voor 2026-2027
2. Define `Concepten` (themafocussen)
3. Create eerste `Scenario` per concept
4. Initialize `Versie 1` per scenario
5. Begin `Team` plaatsing

## Links

- **Monitor**: apps/monitor/ — Verenigingsmonitor dashboards
- **Team-Indeling**: apps/team-indeling/ — Indeling-app (Next.js 16, dnd-kit)
- **Database**: packages/database/prisma/schema.prisma — Prisma schema (source of truth)

---

*Onderdeel van c.k.v. Oranje Wit monorepo — Gebruik als Single Source of Truth.*
