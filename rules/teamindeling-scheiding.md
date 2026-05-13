---
paths:
  - "apps/ti-studio/**"
---

# Team-Indeling — één waarheid in `apps/ti-studio`

**Status: per 2026-04-14 is de TI Studio splitsing afgerond (Fase B).**

De hele team-indeling workspace — desktop werkbord én eventueel herbouwde
mobile-variant — draait uitsluitend in **`apps/ti-studio`**, bereikbaar op
`teamindeling.ckvoranjewit.app`. Dit is een aparte Next.js 16 app met een
eigen Railway service.

## Wat is verhuisd

Alles wat vroeger in `apps/web/src/app/(teamindeling)/`,
`apps/web/src/app/(teamindeling-studio)/`, `apps/web/src/components/teamindeling/`,
`apps/web/src/components/ti-studio/` of `apps/web/src/lib/teamindeling/` stond
bestaat daar **niet meer**. `apps/web/proxy.ts` redirect `/ti-studio/*` en
`/teamindeling/*` met een 308 naar de ti-studio service zodat oude bookmarks
en deep-links blijven werken.

## Regels voor agents en ontwikkelaars

1. **Teams, Spelers, Staf, Werkindeling, Kader, Selectie, Werkbord,
   Scenario's, What-if, Validatie** → `apps/ti-studio`
2. Nooit nieuwe team-indeling code toevoegen aan `apps/web` — `apps/web` host
   alleen nog Monitor, Evaluatie, Scouting, Beheer en Beleid
3. Mobile TI is tijdelijk **weg**. Als er weer behoefte aan een mobile-
   variant is, bouw hem opnieuw binnen `apps/ti-studio` — niet terug naar
   `apps/web`
4. Gedeelde code gaat via `packages/*` (auth, database, types, ui). Geen
   rechtstreekse imports over app-grenzen heen

## Gedeelde data-laag

- **Prisma schema**: `packages/database/prisma/schema.prisma` — één schema
  voor beide apps. Migraties worden door beide apps gedraaid via
  `db:migrate:deploy`.
- **Prisma client in apps/ti-studio**: `apps/ti-studio/src/lib/teamindeling/db/prisma.ts`
- **Prisma client in apps/web**: `apps/web/src/lib/teamindeling/db/prisma.ts`
  (alleen nodig voor niet-TI API routes die ook met de DB praten)

## Deploy

| App | Service | URL | Trigger |
|---|---|---|---|
| `apps/web` | `ckvoranjewit.app` | `www.ckvoranjewit.app` | Push naar main → Railway bouwt apps/web |
| `apps/ti-studio` | `ti-studio` | `teamindeling.ckvoranjewit.app` | Push naar main → Railway bouwt apps/ti-studio |

Beide services worden parallel gebouwd. CI (ci.yml) draait typecheck/lint/tests
over de hele monorepo; E2E test verifieert beide hostings.

## Drag-drop conventies

| App | Library | Patroon | Testid-conventie |
|---|---|---|---|
| `apps/ti-studio` (v1) | HTML5 native | `draggable` attr, `dataTransfer` events | `data-testid="speler-card-{rel_code}"` |
| `apps/ti-studio-v2` | `@atlaskit/pragmatic-drag-and-drop` | PDND, HTML5 onder motorkap | `data-testid="speler-card-{rel_code}-{context}"`, `team-kaart-{owCode}-{versie}`, `drop-zone-{type}-{target}` |

E2E testing: beide apps gebruiken `page.dragTo()` — PDND is native HTML5 compatible.
Details: `docs/superpowers/specs/2026-05-13-drag-drop-library-research.md` + `fase-0-richtlijnen.md`
