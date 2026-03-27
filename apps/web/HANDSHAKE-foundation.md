# Foundation Handshake

Contract voor de migratie-agents. Dit beschrijft de afspraken over import-paden, route-structuur, middleware, styling en auth in de geconsolideerde `apps/web/` monoliet.

## Import paden

```ts
// Database
import { prisma } from "@/lib/db/prisma";

// API helpers (ok, fail, parseBody)
import { ok, fail, parseBody } from "@/lib/api/response";

// Types (gedeeld)
import { ... } from "@oranje-wit/types";

// UI componenten (gedeeld design system)
import { ... } from "@oranje-wit/ui";

// Auth (signIn, signOut, auth, handlers)
import { auth, signIn, signOut } from "@oranje-wit/auth";

// Auth checks (server-side role checks)
import { requireAuth, requireEditor } from "@oranje-wit/auth/checks";
```

## Route groups

Elke app is een route group. De route group naam staat tussen haakjes, de URL-prefix is een gewone directory daarbinnen:

```
src/app/
  (monitor)/monitor/page.tsx         → URL: /monitor
  (monitor)/monitor/spelers/page.tsx → URL: /monitor/spelers
  (beheer)/beheer/page.tsx           → URL: /beheer
  (beheer)/beheer/jeugd/page.tsx     → URL: /beheer/jeugd
  (evaluatie)/evaluatie/page.tsx     → URL: /evaluatie
  (scouting)/scouting/page.tsx       → URL: /scouting
  (teamindeling)/teamindeling/page.tsx → URL: /teamindeling
```

- Elke route group heeft een eigen `layout.tsx` (voor app-specifieke sidebar, shell, etc.)
- De root layout (`src/app/layout.tsx`) biedt alleen: Inter font, SessionProvider, dark theme
- API routes staan in `api/[app]/...`:

```
src/app/api/monitor/foto/[id]/route.ts   → URL: /api/monitor/foto/:id
src/app/api/evaluatie/rondes/route.ts     → URL: /api/evaluatie/rondes
src/app/api/scouting/rapport/route.ts     → URL: /api/scouting/rapport
```

## Middleware

- `/login` en `/api/auth` zijn altijd publiek
- `/favicon.ico`, `/_next`, `/icons`, `/manifest` zijn altijd publiek
- Development: geen auth check (dev bypass)
- Productie: auth via server components (`requireAuth()`, `requireEditor()`) — niet via Edge middleware (nodemailer incompatibel met Edge Runtime)

## Globals.css

De globale CSS (`src/app/globals.css`) bevat:

- **Design tokens** via `@import "@oranje-wit/ui/tokens/globals.css"` — alle CSS variabelen (--surface-page, --text-primary, --ow-oranje-500, etc.)
- **Beheer-specifieke classes**: .beheer-table, .stat-card, .domein-card, .sidebar-item, .status-badge, .funnel-step
- **Portaal classes**: .app-tile, .app-tile-icon, .app-tile-glow
- **Animatie classes**: .animate-fade-in, .animate-fade-in-delay-N, .animate-delay-N
- **Branding**: .branding-ow, .glow-oranje

Per route group kun je extra CSS laden via de route group layout als dat nodig is.

## Root layout

Het root layout (`src/app/layout.tsx`) biedt:

- **Inter font** geladen als `var(--font-inter)` op `<html>`
- **SessionProvider** van next-auth (client-side sessie context)
- **`data-theme="dark"`** op `<html>` element
- **Dark background**: `backgroundColor: "#0f1115"` inline op `<body>`
- **Geen sidebar** — elke route group regelt eigen navigatie/shell

## Auth route

NextAuth handlers staan op `/api/auth/[...nextauth]/route.ts`. Alle apps delen dezelfde auth-sessie.

## Portaal (root page)

De root pagina (`/`) is de app-launcher. Ingelogde gebruikers zien tegels voor de apps waartoe ze toegang hebben. Niet-ingelogde gebruikers worden doorgestuurd naar `/login`.

## Migratie-instructies per agent

### Bij het migreren van een app:

1. **Maak een route group** aan: `src/app/(naam)/`
2. **Maak een layout** aan in de route group met app-specifieke shell (sidebar, header)
3. **Verplaats pagina's** van `apps/[app]/src/app/` naar `src/app/(naam)/[prefix]/`
4. **Verplaats componenten** naar `src/components/[app]/` of naar `packages/ui/` als ze gedeeld zijn
5. **Verplaats server actions** naar `src/app/(naam)/[prefix]/` (naast de pagina's)
6. **Update imports**: `@/lib/db/prisma` voor database, `@/lib/api/response` voor API helpers
7. **API routes** gaan naar `src/app/api/[app]/`
8. **App-specifieke CSS** kan in de route group layout worden geimporteerd

### Imports die NIET veranderen:

- `@oranje-wit/auth` — blijft gelijk
- `@oranje-wit/database` — blijft gelijk (maar prefereer `@/lib/db/prisma` voor de singleton)
- `@oranje-wit/types` — blijft gelijk
- `@oranje-wit/ui` — blijft gelijk
