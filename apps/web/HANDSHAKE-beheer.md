# Beheer Migratie Handshake

Migratie van `apps/beheer/` naar `apps/web/` als route group `(beheer)`.

## Gemigreerde routes

| Oude URL | Nieuwe URL | Bestand |
|---|---|---|
| `/` | `/beheer` | `(beheer)/beheer/page.tsx` |
| `/jaarplanning/kalender` | `/beheer/jaarplanning/kalender` | `(beheer)/beheer/jaarplanning/kalender/page.tsx` |
| `/jaarplanning/mijlpalen` | `/beheer/jaarplanning/mijlpalen` | `(beheer)/beheer/jaarplanning/mijlpalen/page.tsx` |
| `/roostering/trainingen` | `/beheer/roostering/trainingen` | `(beheer)/beheer/roostering/trainingen/page.tsx` |
| `/roostering/wedstrijden` | `/beheer/roostering/wedstrijden` | `(beheer)/beheer/roostering/wedstrijden/page.tsx` |
| `/teams` | `/beheer/teams` | `(beheer)/beheer/teams/page.tsx` |
| `/teams/sync` | `/beheer/teams/sync` | `(beheer)/beheer/teams/sync/page.tsx` |
| `/jeugd/raamwerk` | `/beheer/jeugd/raamwerk` | `(beheer)/beheer/jeugd/raamwerk/page.tsx` |
| `/jeugd/raamwerk/[versieId]` | `/beheer/jeugd/raamwerk/[versieId]` | `(beheer)/beheer/jeugd/raamwerk/[versieId]/page.tsx` |
| `/jeugd/raamwerk/[versieId]/preview/[band]` | `/beheer/jeugd/raamwerk/[versieId]/preview/[band]` | `(beheer)/beheer/jeugd/raamwerk/[versieId]/preview/[band]/page.tsx` |
| `/jeugd/progressie` | `/beheer/jeugd/progressie` | `(beheer)/beheer/jeugd/progressie/page.tsx` |
| `/jeugd/uss` | `/beheer/jeugd/uss` | `(beheer)/beheer/jeugd/uss/page.tsx` |
| `/scouting/scouts` | `/beheer/scouting/scouts` | `(beheer)/beheer/scouting/scouts/page.tsx` |
| `/evaluatie/rondes` | `/beheer/evaluatie/rondes` | `(beheer)/beheer/evaluatie/rondes/page.tsx` |
| `/evaluatie/coordinatoren` | `/beheer/evaluatie/coordinatoren` | `(beheer)/beheer/evaluatie/coordinatoren/page.tsx` |
| `/evaluatie/templates` | `/beheer/evaluatie/templates` | `(beheer)/beheer/evaluatie/templates/page.tsx` |
| `/werving/aanmeldingen` | `/beheer/werving/aanmeldingen` | `(beheer)/beheer/werving/aanmeldingen/page.tsx` |
| `/werving/funnel` | `/beheer/werving/funnel` | `(beheer)/beheer/werving/funnel/page.tsx` |
| `/systeem/gebruikers` | `/beheer/systeem/gebruikers` | `(beheer)/beheer/systeem/gebruikers/page.tsx` |
| `/systeem/import` | `/beheer/systeem/import` | `(beheer)/beheer/systeem/import/page.tsx` |
| `/archief/teams` | `/beheer/archief/teams` | `(beheer)/beheer/archief/teams/page.tsx` |
| `/archief/resultaten` | `/beheer/archief/resultaten` | `(beheer)/beheer/archief/resultaten/page.tsx` |

## NIET gemigreerd

- `/login` — gedeeld in root
- `/api/auth/[...nextauth]` — gedeeld in root

## Import-pad wijzigingen

| Oud (beheer app) | Nieuw (web app) |
|---|---|
| `@/components/beheer-sidebar` | `@/components/beheer/beheer-sidebar` |
| `@/components/icons` | `@/components/beheer/icons` |
| `@/components/raamwerk/*` | `@/components/beheer/raamwerk/*` |
| `@/lib/raamwerk/*` | `@/lib/beheer/raamwerk/*` |
| `@/lib/db/prisma` | `@/lib/db/prisma` (ongewijzigd) |
| `@/lib/api/response` | `@/lib/api/response` (ongewijzigd) |

## Navigatie-wijzigingen

Alle interne links en `revalidatePath` calls zijn bijgewerkt met `/beheer` prefix:
- Sidebar DOMEINEN array: alle hrefs hebben `/beheer/` prefix
- `revalidatePath("/jeugd/raamwerk")` -> `revalidatePath("/beheer/jeugd/raamwerk")`
- `href="/teams"` -> `href="/beheer/teams"`
- etc.

## Layout

Route group layout: `(beheer)/layout.tsx`
- Importeert `BeheerSidebar` uit `@/components/beheer/beheer-sidebar`
- BeheerSidebar bevat desktop sidebar + mobile hamburger overlay + AppSwitcher
- 9 domeinen in sidebar: Planning, Teams, Jeugd, Beoordeling, Groei, Systeem, Archief

## Server Actions

Alle server actions zijn mee verplaatst naast hun pagina's:
- `beheer/jaarplanning/kalender/actions.ts`
- `beheer/jaarplanning/mijlpalen/actions.ts`
- `beheer/roostering/actions.ts`
- `beheer/teams/actions.ts`
- `beheer/jeugd/raamwerk/actions.ts`
- `beheer/jeugd/raamwerk/[versieId]/actions.ts`
- `beheer/scouting/scouts/actions.ts`
- `beheer/evaluatie/rondes/actions.ts`
- `beheer/evaluatie/coordinatoren/actions.ts`
- `beheer/evaluatie/templates/actions.ts`
- `beheer/werving/aanmeldingen/actions.ts`
- `beheer/systeem/gebruikers/actions.ts`
- `beheer/systeem/import/actions.ts`
- `beheer/archief/actions.ts`

## HANDSHAKE bestanden

Domein-specifieke HANDSHAKE.md bestanden zijn mee gekopieerd naar elke domein-directory.

## CSS

Beheer-specifieke CSS classes waren al aanwezig in `apps/web/src/app/globals.css`:
- `.sidebar-section-label`, `.sidebar-item` — sidebar navigatie
- `.domein-card` — dashboard module-kaarten
- `.stat-card` — statistiek-kaarten
- `.beheer-table` — premium dark tabellen
- `.status-badge` — status indicators
- `.funnel-step` — werving funnel

## Bekende issues

Geen. Alle beheer-specifieke functionaliteit is ongewijzigd gemigreerd.
