---
name: team-kwaliteit
description: Kwaliteitsteam voor de team-indeling app — code review, tests, build validatie en tech debt. Gebruik na feature development, als health check, of voor proactieve codebase sweep.
disable-model-invocation: true
argument-hint: "<beschrijving feature> | health-check | sweep"
---

# Agent Team: Kwaliteit

Start een agent team voor het bewaken en verbeteren van de codekwaliteit van de team-indeling app.

## Team samenstelling

### Lead: ontwikkelaar
- **Rol**: Coördineert kwaliteitscontrole, reviewt code, bewaakt patronen
- **Verantwoordelijkheden**:
  - Analyseert scope van wijzigingen (git diff)
  - Reviewt code op projectpatronen (`logger`, `ok()`/`fail()`, Zod, `@oranje-wit/types`)
  - Signaleert complexiteit (bestanden >400 regels, diepe nesting)
  - Opspoort dead code (ongebruikte imports, exports, functies)
  - Checkt security (geen hardcoded secrets, XSS, SQL injection)
  - Bewaakt architectuur (scheiding lib/components/hooks)
  - Verzamelt bevindingen van teammates → kwaliteitsrapport

### Teammate 1: e2e-tester
- **Rol**: Verifieert de app via Playwright E2E tests
- **Verantwoordelijkheden**:
  - Draait bestaande E2E tests (`pnpm test:e2e:ti`)
  - Schrijft nieuwe tests voor ongeteste flows
  - Identificeert testdekking-gaps
  - Signaleert flaky tests
  - Rapporteert resultaten aan lead

### Teammate 2: regel-checker
- **Rol**: Valideert business logic en KNKV-regels (read-only)
- **Verantwoordelijkheden**:
  - Controleert `regels.ts` en `selectie-regels.ts` tegen KNKV Competitie 2.0
  - Valideert impact-berekening
  - Checkt edge cases (leeg team, 1 speler, etc.)
  - Rapporteert bevindingen aan lead (kan zelf niet fixen — alleen Read, Grep, Glob)

### Teammate 3: deployment
- **Rol**: Build-validatie en CI-simulatie
- **Verantwoordelijkheden**:
  - Draait typecheck: `pnpm --filter @oranje-wit/team-indeling exec tsc --noEmit`
  - Draait linter: `pnpm --filter @oranje-wit/team-indeling lint`
  - Checkt formatting: `pnpm format:check`
  - Bouwt de app: `pnpm build`
  - Signaleert verouderde of onveilige dependencies
  - Rapporteert resultaten aan lead

## Werkwijze

### Modus A: Review (na feature-implementatie)

1. **ontwikkelaar** analyseert git diff → bepaalt scope
2. Parallel:
   - **e2e-tester**: draait tests + schrijft nieuwe voor gewijzigde flows
   - **regel-checker**: valideert business logic in gewijzigde code
   - **deployment**: typecheck + lint + format + build
   - **ontwikkelaar (security)**: draait `/security daily` op de gewijzigde code (grep op diff-bestanden)
3. **ontwikkelaar** reviewt code op patronen, complexiteit, security
4. **ontwikkelaar** combineert bevindingen → kwaliteitsrapport

### Modus B: Health check

1. **ontwikkelaar** inventariseert huidige staat (git status, recente changes)
2. Parallel:
   - **e2e-tester**: testdekking analyse, draait volledige suite
   - **regel-checker**: alle validatieregels vs KNKV Competitie 2.0
   - **deployment**: volledige CI-simulatie (typecheck + lint + format + build)
3. **ontwikkelaar** scant op tech debt, dead code, patroonafwijkingen
4. **ontwikkelaar** combineert → health rapport met geprioriteerde lijst

### Modus C: Sweep (proactief)

1. **ontwikkelaar** scant codebase: bestanden >400 regels (ESLint `max-lines`), duplicatie, complexiteit
2. Parallel:
   - **e2e-tester**: identificeert ongeteste user flows
   - **regel-checker**: regels up-to-date met huidige KNKV-competitieregels?
   - **deployment**: dependency updates, build warnings, bundle analyse
3. **ontwikkelaar** combineert → verbeterplan met prioriteiten (hoog/midden/laag)

## Modus-detectie

- Bevat "health-check" of "health check" → Modus B
- Bevat "sweep" of "scan" of "inventariseer" → Modus C
- Anders → Modus A (review, standaard)

## Communicatiepatronen

```
TC (gebruiker)
    │ kwaliteitsopdracht
ontwikkelaar (lead)
    │ bevindingen en opdrachten
    ├── e2e-tester (test, dekking, rapporteer)
    ├── regel-checker (valideer, rapporteer, read-only)
    └── deployment (build, lint, typecheck, rapporteer)
```

## Wanneer `/team-kwaliteit` vs andere teams

| Situatie | Team |
|---|---|
| Feature bouwen + testen + deployen | `/team-release` |
| Alleen E2E testen | `/team-e2e` |
| Code quality review na wijzigingen | `/team-kwaliteit` |
| Volledige codebase health check | `/team-kwaliteit health-check` |
| Proactieve code sweep / tech debt | `/team-kwaliteit sweep` |

## Output

Elk rapport bevat:

1. **Samenvatting**: overall kwaliteitsoordeel (groen/oranje/rood)
2. **Bevindingen per agent**: gegroepeerd per ernst
3. **Actiepunten**: concrete taken met prioriteit
4. **Testresultaten**: unit tests + E2E resultaten

### Ernstclassificatie

| Niveau | Criteria |
|---|---|
| **Rood** (kritiek) | Typecheck error, ESLint error, falende test, KNKV-regelovertreding |
| **Oranje** (aandacht) | Warnings, ontbrekende testdekking, >400 regels, patroonafwijking |
| **Groen** | Alle checks slagen, geen significante issues |

### Security confidence gate

Als `/security daily` een confidence score < 8/10 rapporteert voor een ROOD bevinding, blokkeert dit het kwaliteitsrapport: de review krijgt status **GEBLOKKEERD** totdat de security-bevinding is opgelost. Dit wordt als ROOD bevinding opgenomen in het kwaliteitsrapport.

## Context

- **Taal**: Nederlands
- **App**: Team-Indeling (`apps/ti-studio/`)
- **Tests**: E2E (`e2e/team-indeling/`), Unit (`apps/ti-studio/src/**/*.test.*`)
- **Database schema**: `packages/database/prisma/schema.prisma`
- **Regels**: `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`
- **CI**: `.github/workflows/ci.yml`
- **ESLint**: `apps/ti-studio/eslint.config.mjs` + root `eslint.config.mjs`

## Gerelateerde skills

- `/security` — OWASP Top 10 + STRIDE security audit (Next.js + Prisma + NextAuth)
- `/audit` — codebase-brede kwaliteitsaudit (architectuur, functioneel, UX, security)
- `/e2e-testing` — E2E tests schrijven en draaien
- `/health-check` — infrastructuur-gezondheid (services, DNS, SSL)

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, voer dan een standaard health check uit:
1. Draai alle quality gates (typecheck, lint, format, build)
2. Draai E2E tests
3. Scan op patroonafwijkingen en tech debt
4. Rapporteer bevindingen
