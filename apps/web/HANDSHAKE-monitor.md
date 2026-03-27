# Monitor Migratie Handshake

Migratie van `apps/monitor/` naar `apps/web/` als route group `(monitor)`.

## Gemigreerde routes

| Oude URL | Nieuwe URL | Bestand |
|---|---|---|
| `/` | `/monitor` | `(monitor)/monitor/page.tsx` |
| `/teams` | `/monitor/teams` | `(monitor)/monitor/teams/page.tsx` |
| `/spelers` | `/monitor/spelers` | `(monitor)/monitor/spelers/page.tsx` |
| `/spelers/[relCode]` | `/monitor/spelers/[relCode]` | `(monitor)/monitor/spelers/[relCode]/page.tsx` |
| `/samenstelling` | `/monitor/samenstelling` | `(monitor)/monitor/samenstelling/page.tsx` |
| `/samenstelling/[geboortejaar]` | `/monitor/samenstelling/[geboortejaar]` | `(monitor)/monitor/samenstelling/[geboortejaar]/page.tsx` |
| `/retentie` | `/monitor/retentie` | `(monitor)/monitor/retentie/page.tsx` |
| `/retentie/[seizoen]` | `/monitor/retentie/[seizoen]` | `(monitor)/monitor/retentie/[seizoen]/page.tsx` |
| `/projecties` | `/monitor/projecties` | `(monitor)/monitor/projecties/page.tsx` |
| `/signalering` | `/monitor/signalering` | `(monitor)/monitor/signalering/page.tsx` |

## Gemigreerde API routes

| Oude URL | Nieuwe URL | Bestand |
|---|---|---|
| `/api/foto/[id]` | `/api/monitor/foto/[id]` | `api/monitor/foto/[id]/route.ts` |
| `/api/teams/[id]/naam` | `/api/monitor/teams/[id]/naam` | `api/monitor/teams/[id]/naam/route.ts` |
| `/api/teams/sort-order` | `/api/monitor/teams/sort-order` | `api/monitor/teams/sort-order/route.ts` |

## NIET gemigreerd

- `/login` — gedeeld in root
- `/api/auth/[...nextauth]` — gedeeld in root

## Import-pad wijzigingen

| Oud (monitor app) | Nieuw (web app) |
|---|---|
| `@/lib/queries/*` | `@/lib/monitor/queries/*` |
| `@/lib/utils/*` | `@/lib/monitor/utils/*` |
| `@/lib/sync/*` | `@/lib/monitor/sync/*` |
| `@/lib/db/prisma` | `@/lib/db/prisma` (ongewijzigd) |
| `@/lib/api` | `@/lib/api/response` |
| `@/components/charts/*` | `@/components/monitor/charts/*` |
| `@/components/info/*` | `@/components/monitor/info/*` |
| `@/components/layout/*` | `@/components/monitor/layout/*` |
| `@/components/signalering/*` | `@/components/monitor/signalering/*` |
| `@/components/spelers/*` | `@/components/monitor/spelers/*` |
| `@/components/ui/*` | `@/components/monitor/ui/*` |
| `@/components/samenstelling-tabs` | `@/components/monitor/samenstelling/samenstelling-tabs` |

## Navigatie-wijzigingen

Alle interne `<Link href>` zijn bijgewerkt:
- `href="/"` -> `href="/monitor"`
- `href="/teams"` -> `href="/monitor/teams"`
- etc.

API fetch calls zijn bijgewerkt:
- `fetch("/api/teams/...")` -> `fetch("/api/monitor/teams/...")`
- `src="/api/foto/..."` -> `src="/api/monitor/foto/..."`

## Layout

Route group layout: `(monitor)/layout.tsx`
- Importeert `MonitorShell` uit `@/components/monitor/layout/monitor-shell`
- MonitorShell bevat desktop Sidebar + mobile BottomNav + AppSwitcher

## CSS

Monitor-specifieke Tailwind theme tokens (`@theme inline`) zijn toegevoegd aan `apps/web/src/app/globals.css`:
- Surface kleuren: `bg-surface-card`, `bg-surface-raised`, etc.
- Text kleuren: `text-text-primary`, `text-ow-oranje`, etc.
- Signal kleuren: `text-signal-groen`, `text-signal-rood`, etc.
- KNKV band-kleuren: `text-knkv-blauw`, etc.

## Bekende issues

Geen. Alle monitor-specifieke build errors zijn opgelost. De 8 build errors in de web app zijn alle afkomstig van de scouting route group (pre-existing, niet gerelateerd aan deze migratie).
