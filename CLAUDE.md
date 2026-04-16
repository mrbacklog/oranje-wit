# c.k.v. Oranje Wit — Monorepo

Platform voor TC-werkzaamheden van korfbalvereniging c.k.v. Oranje Wit (Dordrecht).
Twee Next.js 16 apps met een duidelijke scheiding:

- **`apps/web`** (`www.ckvoranjewit.app`) — Monitor, Evaluatie, Scouting, Beheer, Beleid
- **`apps/ti-studio`** (`teamindeling.ckvoranjewit.app`) — volledige Team-Indeling workspace

---

## Output Regels (ALTIJD VOLGEN)

- Geef GEEN uitleg tenzij ik expliciet vraag om uitleg
- Geen samenvattingen aan het einde van een taak
- Geen "hier is wat ik heb gedaan" recap na code-wijzigingen
- Geen "Ik ga nu..." aankondigingen — doe het gewoon
- Code-comments alleen waar de logica niet vanzelfsprekend is
- Bevestig voltooide taken in maximaal één zin
- Bij meerdere stappen: rapporteer alleen afwijkingen of fouten, niet elke stap
- Sub-agents rapporteren alleen: wat is gewijzigd, welke tests falen, welke beslissing is genomen

## Compaction Voorkeuren

Bij automatische of handmatige compaction, bewaar ALTIJD:
- Huidige branch en git status
- Lijst van bestanden gewijzigd in deze sessie
- Actieve agent en zijn domein
- Openstaande fouten of gefaalde tests
- Architectuurbeslissingen genomen in deze sessie

Gebruik bij handmatige compaction:
`/compact Focus op: gewijzigde bestanden, test resultaten, architectuurbeslissingen`

---

## Structuur

```
oranje-wit/
├── apps/
│   ├── web/              # Monitor, Evaluatie, Scouting, Beheer, Beleid (Next.js 16)
│   ├── ti-studio/        # Team-Indeling workspace (Next.js 16, eigen Railway service)
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
- **Database**: Prisma in `packages/database/` is de **source of truth** voor beide apps

## App-scheiding — één waarheid per domein

De TI Studio splitsing is per 2026-04-14 afgerond (Fase B). Gevolg:

| Domein | App | URL | Wanneer hier werken |
|---|---|---|---|
| Monitor, Signalering, Retentie | `apps/web` | `www.ckvoranjewit.app/monitor/*` | Dashboards, cohortanalyse |
| Evaluatie | `apps/web` | `www.ckvoranjewit.app/evaluatie/*` | Rondes, spelerevaluaties |
| Scouting | `apps/web` | `www.ckvoranjewit.app/scouting/*` | Verzoeken, rapporten |
| Beheer | `apps/web` | `www.ckvoranjewit.app/beheer/*` | Gebruikers, 9 TC-domeinen |
| Beleid | `apps/web` | `www.ckvoranjewit.app/beleid/*` | Oranje Draad, visie |
| **Team-Indeling (alles)** | **`apps/ti-studio`** | **`teamindeling.ckvoranjewit.app/ti-studio/*`** | **Teams, Spelers, Staf, Werkindeling, Kader, Selectie, Werkbord** |

**Let op voor agents en ontwikkelaars:**
- Alles rond teams, spelers, staf, werkindeling, kader, selectie, werkbord, scenario's, what-if hoort in **`apps/ti-studio`**.
- `apps/web/proxy.ts` redirect `/ti-studio/*` en `/teamindeling/*` met een 308 naar de ti-studio service — niet opnieuw toevoegen aan apps/web.
- Oude paden `/teamindeling/*` (mobile TI) bestaan niet meer — mobile kan later opnieuw gebouwd worden binnen apps/ti-studio.
- Beide apps delen de Prisma client (`packages/database`) en de auth, types en ui packages.

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

`Antjan → product-owner → /team-release patch|release <scope>`

### Monitoring

Gebruik `/team-devops` voor health checks en CI status (observatie, geen deploys).

### Skills

- `/patch` — instructies voor urgente fixes (fast-gate only, geen E2E)
- `/release` — instructies voor feature releases (smoke + full E2E)
- `/team-release` — start het release-team
- `/team-devops` — start het monitoring-team (health-check, ci-status)
- `/railway` — platform management (Railway services, DNS, SSL)

## Verplichte patronen

**Logger** — gebruik `logger` uit `@oranje-wit/types`, nooit `console.log`. `logger.info` alleen in development, `logger.warn`/`logger.error` altijd.

**Auth guards** — `guardTC()` in API routes (returnt Result, geen throw), `requireTC()` in server actions (throwt als niet-TC). Beide in `@oranje-wit/auth/checks`.

**API routes** — gebruik `ok()`/`fail()`/`parseBody()` uit `@/lib/api`. Altijd `guardTC()` als eerste, dan body parsen met Zod schema, dan try/catch met `fail(error)`.

**Server Action results** — return type altijd `ActionResult<T>` uit `@oranje-wit/types`. `{ ok: true, data: T }` of `{ ok: false, error: string }`.

**Wanneer server action vs API route:**
- Server action: interne UI-interactie, formulier-submit, revalidation
- API route: externe clients, smartlink-gebruikers, file uploads, CORS

**Constanten & korfballeeftijd** — importeer `HUIDIG_SEIZOEN`, `HUIDIGE_PEILDATUM` uit `@oranje-wit/types`. Voor leeftijdsberekening gebruik de korfballeeftijd-helpers (`korfbalPeildatum`, `berekenKorfbalLeeftijd`, `berekenKorfbalLeeftijdExact`, `grofKorfbalLeeftijd`, `formatKorfbalLeeftijd`, `valtBinnenCategorie`) — nooit zelf `Math.floor`/`Math.round` op `(peildatum - geboortedatum)`, nooit `.toFixed(1|2)` op een leeftijd. `PEILJAAR` en `PEILDATUM` bestaan niet meer; binnen een scenario-context gebruik `korfbalPeildatum(state.seizoen)` en geef de peildatum expliciet door aan validatie-functies en components.

**Error handling** — geen lege catch blocks, altijd loggen met `logger.warn("context:", error)`.

**Deploy** — Alleen `team-release` deployt. Alle andere agents: VERBODEN. Escaleer naar `product-owner`.

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

## Oranje Draad & TC-doelgroepen

Toets altijd aan: **Plezier + Ontwikkeling + Prestatie → Duurzaamheid**

De vijf TC-doelgroepen (Kweekvijver, Opleidingshart, Korfbalplezier, Wedstrijdsport, Topsport) zijn ubiquitous — gebruik deze termen overal consistent.

Details: `rules/oranje-draad.md` en `docs/kennis/tc-doelgroepen.md`

## Verwijzingen

Detail-informatie staat in path-scoped rules en docs:

| Bestand | Onderwerp |
|---|---|
| `rules/database.md` | Tabelverdeling (61 modellen), datamodel, rel_code, lees/schrijf, data flow |
| `rules/agents.md` | 16 agents, fencing, hiërarchie, startup, 11 teams |
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
