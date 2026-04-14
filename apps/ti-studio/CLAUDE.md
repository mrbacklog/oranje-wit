# TI Studio App — apps/ti-studio/

Next.js 16 app voor de volledige Team-Indeling workspace van c.k.v. Oranje Wit.

Live op **`teamindeling.ckvoranjewit.app`** (Railway service `ti-studio`).
Dit is de **enige** locatie voor team-indeling functionaliteit sinds Fase B
van de splitsing (2026-04-14).

## Route structuur

```
apps/ti-studio/src/app/
├── (protected)/           # Auth-guarded routes (TC of trainers/coordinatoren)
│   ├── page.tsx           # Dashboard
│   ├── kader/             # Teamkaders + memo's per doelgroep
│   ├── indeling/          # Werkbord (drag & drop)
│   ├── personen/          # Spelers + staf beheer
│   │   ├── spelers/       # Spelersoverzicht
│   │   └── staf/          # Staf + rollen beheer
│   └── memo/              # Memo's / werkitems overzicht
├── api/                   # TI-specifieke API routes
├── login/                 # Login page (Google OAuth + smartlink)
└── layout.tsx             # Root layout
```

## Teamindeling — de domeinregel

Alles rond **Teams, Spelers, Staf, Werkindeling, Kader, Selectie, Werkbord,
Scenario's, What-if en Validatie** hoort hier. Niet in `apps/web`.

`apps/web/proxy.ts` redirect legacy URLs (`www.ckvoranjewit.app/ti-studio/*`
en `/teamindeling/*`) met een 308 hierheen.

## Design System

- **Dark-first** (zelfde tokens als apps/web)
- Tokens in `packages/ui/src/tokens/`
- CSS classes via `apps/ti-studio/src/app/globals.css`
- **NOOIT** hardcoded kleuren — altijd `var(--ow-*)` tokens of Tailwind utilities

## Server Actions vs API Routes

- **Server action**: UI-interactie, formulier-submit, drag & drop, `revalidatePath()`
- **API route**: externe clients, smartlinks, file uploads, CORS, service-to-service

## Daisy (AI-assistent)

Daisy in ti-studio heeft de **volledige** plugin-set: planning, monitor,
teamindeling én ti-studio tools (inclusief schrijf-acties op de werkindeling
zoals spelerVerplaatsen, spelerStatusZetten, teamAanmaken, etc.).

## Belangrijke conventies

- **Logger**: `logger` uit `@oranje-wit/types`, nooit `console.log`
- **Auth guards**: `requireTC()` in server actions, `guardTC()` in API routes
- **ActionResult<T>**: return type van elke server action
- **`rel_code`**: enige stabiele ID voor leden/spelers — nooit naam-matching
- **Prisma**: via `@/lib/teamindeling/db/prisma` (shared schema in `packages/database/`)

## Selectie-gebundelde spelerspool (business rule, 2026-04-14)

`SelectieGroep.gebundeld` (Boolean in schema) bepaalt of spelers/staf aan een
selectiepool hangen of aan losse teams:
- `gebundeld = false` → spelers/staf via `TeamSpeler` / `TeamStaf`
- `gebundeld = true` → spelers/staf via `SelectieSpeler` / `SelectieStaf`

`toggleSelectieBundeling()` verhuist atomair tussen beide states. De invariant
_"een speler mag nooit tegelijk in TeamSpeler én SelectieSpeler voor dezelfde
versie"_ wordt afgedwongen door `zetSpelerIndeling()` en de corresponderende
staf-acties. Zie `apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.ts`.

## Details

Zie `rules/teamindeling-scheiding.md`, `rules/ow-voorkeuren.md`,
`rules/knkv-regels.md` en `rules/oranje-draad.md`.
