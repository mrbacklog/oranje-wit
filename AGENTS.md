# c.k.v. Oranje Wit — Agent Instructions

Platform voor TC-werkzaamheden van korfbalvereniging c.k.v. Oranje Wit (Dordrecht).
Next.js 16 monorepo met PostgreSQL, Prisma en pnpm workspaces.

## Communicatie
- **Taal**: altijd Nederlands
- **Toon**: informeel en direct
- **Naam**: altijd "c.k.v. Oranje Wit" (met punten, spatie)
- **Privacy**: nooit BSN, geboortedatum of adres tonen of loggen

## Stack
- **App**: `apps/web/` — Next.js 16, App Router, Server Components
- **Database**: `packages/database/` — Prisma + PostgreSQL op Railway
- **Auth**: `packages/auth/` — NextAuth v5, Google OAuth
- **UI**: `packages/ui/` — Gedeelde componenten, dark-first design tokens
- **Dev**: `pnpm dev` start op poort 3000

## Verplichte patronen

**Logger**: gebruik `logger` uit `@oranje-wit/types`, nooit `console.log`

**Auth guards**:
- API routes: `guardTC()` uit `@oranje-wit/auth/checks` — returnt Result, geen throw
- Server actions: `requireTC()` uit `@oranje-wit/auth/checks` — throwt als niet-TC

**API routes**: gebruik `ok()`/`fail()`/`parseBody()` uit `@/lib/api`

**Server Actions**: return type altijd `ActionResult<T>` uit `@oranje-wit/types`

**Database**:
- `rel_code` (Sportlink relatienummer) is de ENIGE stabiele identifier — nooit naam-matching
- NOOIT `pnpm db:push` — gebruik `pnpm db:migrate`
- Schema in `packages/database/prisma/schema.prisma` is source of truth

**Constanten**: importeer `HUIDIG_SEIZOEN`, `HUIDIGE_PEILDATUM` en de korfballeeftijd-helpers (`korfbalPeildatum`, `berekenKorfbalLeeftijd`, `berekenKorfbalLeeftijdExact`, `grofKorfbalLeeftijd`, `formatKorfbalLeeftijd`, `valtBinnenCategorie`) uit `@oranje-wit/types`. `PEILJAAR` en `PEILDATUM` bestaan niet meer.

**Error handling**: geen lege catch blocks, altijd loggen met `logger.warn("context:", error)`

## Deploy
Alleen via CI/CD (push → GitHub Actions → Railway). Nooit handmatig of direct.

## Oranje Draad
Toets aan: Plezier + Ontwikkeling + Prestatie → Duurzaamheid.
Details: `rules/oranje-draad.md`

---
*Claude Code-specifieke instructies: zie `CLAUDE.md`*
