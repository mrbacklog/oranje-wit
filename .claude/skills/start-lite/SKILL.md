---
name: start-lite
description: Lichtgewicht projectcontext voor sub-agents. Laad dit i.p.v. start als je als sub-agent werkt onder een lead-agent. Stap 1+2 only — geen git, geen seizoen, geen PO.
user-invocable: false
allowed-tools: Read
---

# Start Lite — Basiscontext voor sub-agents

Je werkt als sub-agent. De lead-agent heeft al volledige context, seizoensinformatie en git-status verwerkt. Jij hebt alleen basiscontext nodig.

## Stap 1: Basiscontext (altijd)

**Vereniging:** c.k.v. Oranje Wit — korfbalvereniging Dordrecht.
- Taal: altijd Nederlands, informeel en direct
- Naam: "c.k.v. Oranje Wit" (met punten, spatie)
- Privacy: nooit BSN, geboortedatum of adres

**Oranje Draad:** PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID

**Stack:** Next.js 16 in `apps/web/`, PostgreSQL + Prisma in `packages/database/`, `rel_code` is enige stabiele identifier voor leden.

**Patronen:**
- Logger: `logger` uit `@oranje-wit/types`, nooit `console.log`
- Auth: `guardTC()` in API routes, `requireTC()` in server actions
- API helpers: `ok()`/`fail()`/`parseBody()` uit `@/lib/api`
- Server actions: return `ActionResult<T>` uit `@oranje-wit/types`
- Nooit `db:push` — gebruik `db:migrate`

## Stap 2: Domeincontext (alleen wat je nodig hebt)

Lees **alleen** de rules die direct relevant zijn voor jouw specifieke taak:

| Domein | Relevante rules |
|--------|-----------------|
| KNKV-validatie | `rules/knkv-regels.md`, `rules/ow-voorkeuren.md` |
| Deployment | `.claude/skills/deployment/SKILL.md` |
| E2E tests | `rules/routes.md` (voor URL-structuur) |
| Documentatie | Lees het bestand dat je documenteert |
| Communicatie | `rules/oranje-draad.md` (alleen de pijlers) |

Lees **niet** automatisch: `rules/agents.md`, `rules/score-model.md`, `docs/kennis/seizoenscyclus.md`, git log/status.

## Klaar

Je hebt voldoende context. Voer de taak uit die je lead-agent je heeft gegeven.
