# Team-Indeling — c.k.v. Oranje Wit

Intelligente tool voor het samenstellen van teamindelingen per seizoen. Gebouwd voor de Technische Commissie om van spelersoverzicht naar definitieve indeling te komen, met realtime validatie op KNKV-regels en OW-voorkeuren.

## Starten

```bash
pnpm dev:ti
```

Open [http://localhost:4100](http://localhost:4100). Inloggen via Google (alleen TC-leden).

## Tech stack

| Component | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Styling | Tailwind CSS 4 + design-systeem (`globals.css`) |
| Database | Prisma ORM → PostgreSQL (Railway) |
| Drag & Drop | @dnd-kit/core |
| Auth | NextAuth v5 via `@oranje-wit/auth` (Google OAuth) |
| Validatie | Custom engine (`src/lib/validatie/`) |
| Testing | Vitest (unit) + Playwright (E2E) |

## Procesmodel

```
BLAUWDRUK → CONCEPTEN → SCENARIO'S → DEFINITIEF
```

1. **Blauwdruk** — Kaders: teamgroottes, categorieeen, genderregels
2. **Concepten** — Uitgangspunten: spelerstatus, pins, aannames
3. **Scenario's** — Concrete indelingen: drag-drop, validatie, vergelijking
4. **Definitief** — Besluit: gekozen scenario, besluitenlog

## Documentatie

| Document | Doelgroep |
|---|---|
| [`docs/functioneel.md`](docs/functioneel.md) | TC-leden — wat kan ik met de app? |
| [`docs/architectuur.md`](docs/architectuur.md) | Ontwikkelaars — datamodel, patronen, componenten |
| [`docs/api-routes.md`](docs/api-routes.md) | Ontwikkelaars — API-referentie |
| [`docs/validatie-regels.md`](docs/validatie-regels.md) | TC/dev — businessregels en stoplicht-status |
| [`CLAUDE.md`](CLAUDE.md) | AI agents — technische context |

## Commando's

| Commando | Wat |
|---|---|
| `pnpm dev:ti` | Start dev server op poort 4100 |
| `pnpm test:ti` | Unit tests (Vitest) |
| `pnpm test:e2e:ti` | E2E tests (Playwright) |
| `pnpm build` | Productie-build (vanuit `apps/team-indeling/`) |
| `pnpm format` | Format met Prettier |
| `pnpm lint` | ESLint check |

## Live

[https://teamindeling.ckvoranjewit.app](https://teamindeling.ckvoranjewit.app)
