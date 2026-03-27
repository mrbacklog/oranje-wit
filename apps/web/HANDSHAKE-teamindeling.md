# Handshake: Team-Indeling migratie naar apps/web/

Migratie van `apps/team-indeling/` naar `apps/web/` als route group `(teamindeling)`.

## Status: COMPLEET

Alle 199 bestanden gemigreerd. Build groen (zero teamindeling errors).

## Structuur

```
apps/web/src/
  app/
    (teamindeling)/
      layout.tsx                    # WIT thema, Geist font, SeizoenProvider
      teamindeling.css              # Light-mode utility classes (buttons, cards, badges, dialogs)
      teamindeling/
        page.tsx                    # Dashboard → URL: /teamindeling
        error.tsx                   # Error boundary
        loading.tsx                 # Loading state
        blauwdruk/                  # Blauwdruk pagina + actions
        dashboard/                  # Dashboard actions
        design-system/              # Design system showcase (met dark override)
        instellingen/               # Instellingen pagina + actions
        over/                       # Over pagina
        pins/                       # Pin actions
        rating/                     # Rating actions
        scenarios/                  # Scenarios pagina + [id] + actions
        vergelijk/                  # Vergelijk pagina
        werkbord/                   # Werkbord pagina + actions
    api/teamindeling/
      cleanup/                      # Cleanup route
      foto/[id]/                    # Spelerfoto (webp)
      import/                       # Data import
      leden-sync/preview/           # Leden sync preview
      leden-sync/verwerk/           # Leden sync verwerken
      ratings/batch/                # Ratings batch update
      ratings/herbereken/           # Ratings herberekenen
      ratings/preview/              # Ratings preview
      referentie-teams/             # Referentieteams CRUD
      referentie-teams/ververs/     # Referentieteams verversen
      referentie-teams/[id]/spelers/  # Spelers per referentieteam
      referentie-teams/[id]/teamscore/  # Teamscore per referentieteam
      scenarios/[id]/batch-plaats/   # Batch plaatsing
      scenarios/[id]/teams/          # Teams per scenario
      scenarios/[id]/teamscore-sync/ # Teamscore sync
      spelers/[id]/evaluaties/       # Evaluaties per speler
      spelers/[id]/rating/           # Rating per speler
  components/teamindeling/
    blauwdruk/                      # 16 componenten
    dashboard/                      # 2 componenten
    instellingen/                   # 3 componenten
    layout/TISidebar.tsx            # Sidebar (AppShell wrapper)
    providers/SeizoenProvider.tsx    # Seizoen context
    providers/SessionProvider.tsx    # SessionProvider (niet gebruikt, root biedt dit)
    scenario/                       # 30+ componenten (editor, hooks, mobile, view)
    scenarios/                      # 5 componenten (wizard, hernoem, verwijder, prullenbak)
    timeline/                       # 2 componenten
    ui/                             # 3 componenten (SpelerAvatar, FotoLightbox, Spinner)
    vergelijk/                      # 2 componenten
    werkbord/                       # 7 componenten
  hooks/teamindeling/
    useIsMobile.ts                  # Mobile breakpoint detection
    useValidatie.ts                 # Realtime validatie hook
  lib/teamindeling/
    api/                            # ok() met no-store, fail, parseBody
    auth.ts                         # Re-export @oranje-wit/auth
    auth-check.ts                   # Re-export requireAuth/requireEditor
    besluit-routing.ts              # Besluit routing logica
    db/prisma.ts                    # AnyPrismaClient wrapper (TS2321 workaround)
    db/scenario-snapshot.ts         # Scenario snapshot
    db/speler-guard.ts              # Speler guard
    doorstroom-signalering.ts       # Doorstroom signalering
    import.ts                       # Data import logica
    leden-csv.ts                    # Leden CSV parsing
    leden-diff.ts                   # Leden diff
    rating.ts                       # Rating berekening
    seizoen.ts                      # Seizoen helpers (getActiefSeizoen, etc.)
    teamKaartStijl.ts               # Team kaart styling
    teamstructuur.ts                # Teamstructuur helpers
    validatie/                      # 9 validatie bestanden (regels, helpers, constanten)
```

## WIT thema

Team-Indeling is de ENIGE app met een WIT achtergrond. De route group layout:

- `data-theme="light"` op wrapper div
- `backgroundColor: "#ffffff"`, `color: "#111827"` inline
- Geist + Geist_Mono fonts (via `next/font/google`)
- `teamindeling.css` met light-mode utility classes die de dark globals overschrijven
- Root layout blijft `data-theme="dark"` — de TI wrapper overrideert dit

## Import conventies

```ts
// TI lib
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { ok, fail, parseBody } from "@/lib/teamindeling/api";
import { requireEditor } from "@/lib/teamindeling/auth-check";

// TI components
import { TISidebar } from "@/components/teamindeling/layout/TISidebar";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";

// TI hooks
import { useValidatie } from "@/hooks/teamindeling/useValidatie";
import { useIsMobile } from "@/hooks/teamindeling/useIsMobile";

// Cross-page actions (via route group path)
import { getBlauwdruk } from "@/app/(teamindeling)/teamindeling/blauwdruk/actions";
import { getScenarios } from "@/app/(teamindeling)/teamindeling/scenarios/actions";
import { getWerkitems } from "@/app/(teamindeling)/teamindeling/werkbord/actions";

// Gedeelde packages (ongewijzigd)
import { ... } from "@oranje-wit/auth";
import { ... } from "@oranje-wit/database";
import { ... } from "@oranje-wit/types";
import { ... } from "@oranje-wit/ui";
```

## URL mapping

| Oud (standalone)           | Nieuw (web monoliet)              |
|----------------------------|-----------------------------------|
| `/`                        | `/teamindeling`                   |
| `/blauwdruk`               | `/teamindeling/blauwdruk`         |
| `/werkbord`                | `/teamindeling/werkbord`          |
| `/scenarios`               | `/teamindeling/scenarios`         |
| `/scenarios/:id`           | `/teamindeling/scenarios/:id`     |
| `/vergelijk`               | `/teamindeling/vergelijk`         |
| `/instellingen`            | `/teamindeling/instellingen`      |
| `/over`                    | `/teamindeling/over`              |
| `/design-system`           | `/teamindeling/design-system`     |
| `/api/foto/:id`            | `/api/teamindeling/foto/:id`      |
| `/api/import`              | `/api/teamindeling/import`        |
| `/api/leden-sync/*`        | `/api/teamindeling/leden-sync/*`  |
| `/api/ratings/*`           | `/api/teamindeling/ratings/*`     |
| `/api/referentie-teams/*`  | `/api/teamindeling/referentie-teams/*` |
| `/api/scenarios/*`         | `/api/teamindeling/scenarios/*`   |
| `/api/spelers/*`           | `/api/teamindeling/spelers/*`     |

## Niet gemigreerd

- `/login` — gedeeld via root (`/login`)
- `/api/auth/` — gedeeld via root (`/api/auth/[...nextauth]/`)

## Prisma

TI gebruikt een eigen `AnyPrismaClient` wrapper in `@/lib/teamindeling/db/prisma.ts` als workaround voor Prisma 7.x TS2321 recursielimiet. Dit is een type-only wrapper die dezelfde singleton database client hergebruikt.

## Auth

Gedeeld via `@oranje-wit/auth`:
- Root layout voorziet in `SessionProvider`
- TI components gebruiken `useSession()` via next-auth/react
- Server actions gebruiken `requireEditor()` via `@/lib/teamindeling/auth-check`

## Verificatie

```bash
pnpm --filter @oranje-wit/web build   # Zero teamindeling errors
```
