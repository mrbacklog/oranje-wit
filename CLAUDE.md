# c.k.v. Oranje Wit — Monorepo

Platform voor TC-werkzaamheden van korfbalvereniging c.k.v. Oranje Wit (Dordrecht). Alle domeinen (Monitor, Team-Indeling, Evaluatie, Scouting, Beheer, Beleid) draaien in een geconsolideerde Next.js 16 app.

---

## Structuur

```
oranje-wit/
├── apps/
│   ├── web/              # Geconsolideerde app (Next.js 16, alle domeinen)
│   └── mcp/              # MCP servers (database, Railway)
├── packages/
│   ├── auth/             # @oranje-wit/auth — NextAuth v5 + Google OAuth
│   ├── database/         # @oranje-wit/database — Prisma schema + client
│   ├── types/            # @oranje-wit/types — Gedeelde TypeScript types
│   └── ui/               # @oranje-wit/ui — Gedeelde React componenten
├── e2e/                  # Playwright E2E tests
├── .claude/              # AI agents en skills
├── rules/                # Contextregels — Single Source of Truth
├── scripts/              # Data-pipeline en import scripts
├── data/                 # Ledendata, seizoensdata (database is primaire bron)
├── model/                # Statistisch jeugdmodel (YAML)
└── docs/                 # Documentatie, plannen, kennis
```

- **Workspace**: pnpm workspaces (`packages/*`, `apps/*`, `apps/mcp/*`)
- **Database**: Prisma in `packages/database/` is de **source of truth**

## Commando's

| Commando | Wat |
|---|---|
| `pnpm dev` | Start de app op poort **3000** |
| `pnpm build` | Build de app |
| `pnpm test` | Draai alle unit tests (Vitest) |
| `pnpm db:generate` | Genereer Prisma client |
| `pnpm db:migrate` | Maak nieuwe migratie (development) |
| `pnpm db:migrate:deploy` | Draai pending migraties + herstel VIEW (productie) |
| `pnpm db:migrate:status` | Toon migratiestatus |
| `pnpm db:ensure-views` | Controleer/herstel VIEW speler_seizoenen |
| ~~`pnpm db:push`~~ | **GEBLOKKEERD** — dropt VIEW speler_seizoenen |
| `pnpm import` | Importeer Verenigingsmonitor data |
| `pnpm import:evaluaties` | Importeer evaluaties (legacy Lovable import) |
| `pnpm test:e2e` | Alle E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Playwright UI (interactief) |
| `pnpm format` | Format alles met Prettier |
| `pnpm format:check` | Check formatting (CI) |

## Code Quality

- **Pre-commit hook**: lint-staged draait alleen **Prettier** op staged bestanden (ESLint zit in CI)
- **CI (GitHub Actions)**: fast-gate (typecheck + lint + format + unit tests) + E2E tests op elke push/PR naar main
- **ESLint**: `no-console` (error), `no-empty` (error), `prefer-const` (error), `no-unused-vars` (warn), `max-lines` (400, warn)

## Deploy

![CI](https://github.com/antjanlaban/oranje-wit/actions/workflows/ci.yml/badge.svg)

### Hoe werkt het

Push naar `main` → CI → Railway deploy. Automatisch. Geen handmatige stappen.

| Situatie | Commit prefix | CI workflow | E2E | Deploy |
|---|---|---|---|---|
| **Fix / patch** | `fix:` of `patch:` | `ci.yml` | ❌ skip | ✅ auto na fast-gate + build |
| **Feature / PR** | geen prefix | `ci.yml` | ✅ full | ✅ auto na E2E |
| **Bundel + grote feature** | `release:` (via release branch) | `release.yml` | ✅ smoke + full | ✅ via merge naar main |

### Wie deployt

**Alleen `team-release` deployt.** Andere agents: VERBODEN — escaleer naar `product-owner`.

```
Antjan → product-owner → /team-release patch <scope>    # kleine fix
Antjan → product-owner → /team-release release <scope>  # feature bundel
```

### Monitoring

Gebruik `/team-devops` voor health checks en CI status (observatie, geen deploys).

### Skills

- `/patch` — instructies voor urgente fixes (fast-gate only, geen E2E)
- `/release` — instructies voor feature releases (smoke + full E2E)
- `/team-release` — start het release-team
- `/team-devops` — start het monitoring-team (health-check, ci-status)
- `/railway` — platform management (Railway services, DNS, SSL)

## Verplichte patronen

**Logger** — gebruik altijd `logger` uit `@oranje-wit/types`, nooit `console.log`:
```ts
import { logger } from "@oranje-wit/types";
logger.info("...");   // alleen in development
logger.warn("...");   // altijd
logger.error("...");  // altijd
```

**Auth guards** — gebruik `guard*()` in API routes, `require*()` in server actions:
```ts
// API route (returns Result, geen throw)
import { guardTC } from "@oranje-wit/auth/checks";
export async function POST(request: Request) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;
  const { session } = auth;
}

// Server action (throws, Next.js vangt)
import { requireTC } from "@oranje-wit/auth/checks";
export async function mijnAction() {
  const session = await requireTC(); // throws als niet-TC
}
```

**API routes** — gebruik `ok()`/`fail()`/`parseBody()` uit `@/lib/api`:
```ts
import { ok, fail, parseBody } from "@/lib/api";
import { guardTC } from "@oranje-wit/auth/checks";
import { z } from "zod";

const Schema = z.object({ naam: z.string().min(1) });

export async function POST(request: Request) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;
    const result = await prisma.model.create({ data: parsed.data });
    return ok(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

**Server Action results** — gebruik `ActionResult<T>` uit `@oranje-wit/types`:
```ts
import { type ActionResult } from "@oranje-wit/types";
export async function mijnAction(data: FormData): Promise<ActionResult<{ id: string }>> {
  return { ok: true, data: { id: "abc" } };
}
```

**Wanneer server action vs API route:**
- Server action: interne UI-interactie, formulier-submit, revalidation
- API route: externe clients, smartlink-gebruikers, file uploads, CORS

**Constanten** — importeer uit `@oranje-wit/types`, definieer niet lokaal:
```ts
import { PEILJAAR, HUIDIG_SEIZOEN, PEILDATUM } from "@oranje-wit/types";
```

**Error handling** — geen lege catch blocks, altijd loggen:
```ts
catch (error) {
  logger.warn("Context:", error);
}
```

## Database

- **PostgreSQL op Railway**, Prisma schema in `packages/database/` is source of truth
- **NOOIT** `db:push` gebruiken — gebruik `db:migrate`
- **`rel_code`** (Sportlink relatienummer) is de **enige stabiele identifier** voor leden/spelers — nooit naam-matching

Details over tabelverdeling, datamodel, rel_code-regels en data flow: zie `rules/database.md`

## Communicatie

- **Taal**: altijd Nederlands
- **Toon**: informeel en direct
- **Verenigingsnaam**: "c.k.v. Oranje Wit" (met punten, spatie)
- **Privacy**: nooit BSN, geboortedatum of adres tonen/loggen

## De Oranje Draad

```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```
Elke teamindeling wordt getoetst aan deze drie pijlers. Details: zie `rules/oranje-draad.md` en `docs/kennis/tc-beleid.md`

## TC-doelgroepen

De TC bedient alle korfbalspelende leden via vijf doelgroepen:

| Doelgroep | Wie | Eigenaar | Kern |
|---|---|---|---|
| **Kweekvijver** | 5-9 (Blauw + Groen) | Merel | Spelenderwijs aansteken, veilig klimaat |
| **Opleidingshart** | 10-15 (Geel + Oranje) | Merel | Golden age, breed opleiden + voorsorteren |
| **Korfbalplezier** | Rood B, B-senioren, midweek, recreant | Thomas | Plezier, verenigingsleven, brug jeugd-senioren |
| **Wedstrijdsport** | Senioren A-categorie (Sen 3-4) | Thomas | Competitief buiten de top |
| **Topsport** | U15-1 t/m U19-1, Sen 1-2 | Jasper | Maximaal presteren, terugbetalen aan club |

Deze termen zijn **ubiquitous** — ze worden overal gebruikt: in de app, documentatie, agents, presentaties en TC-vergaderingen. Details: `rules/oranje-draad.md` en `docs/kennis/tc-doelgroepen.md`

## Verwijzingen

Detail-informatie staat in path-scoped rules en docs:

| Bestand | Onderwerp |
|---|---|
| `rules/database.md` | Tabelverdeling (61 modellen), datamodel, rel_code, lees/schrijf, data flow |
| `rules/agents.md` | 19 agents, fencing, hiërarchie, startup, 11 teams |
| `rules/routes.md` | Route-tabel, navigatie-architectuur, 4+1 patroon |
| `rules/design-system.md` | Dark-first tokens, componenten, design gate, visual tests |
| `rules/knkv-regels.md` | KNKV competitieregels (Competitie 2.0) |
| `rules/ow-voorkeuren.md` | OW-specifieke teamvoorkeuren en indelingsfilosofie |
| `rules/oranje-draad.md` | Drie pijlers, POP-ratio's, seizoenscyclus, toetsingsvragen |
| `rules/score-model.md` | USS schaal, speler/team score formules |
| `rules/beheer.md` | 9 TC-domeinen, autorisatie, temporeel model |
| `rules/teamindeling-scheiding.md` | Desktop/mobile scheiding TI |
| `docs/kennis/tc-doelgroepen.md` | 5 TC-doelgroepen (Single Source of Truth voor POP-ratio's) |
| `docs/kennis/` | Seizoenscyclus, TC-beleid, TC-organisatie, KNKV-competitie |
