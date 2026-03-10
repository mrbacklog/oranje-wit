---
name: team-release
description: Start een Agent Team voor feature development + deployment. Gebruik wanneer een feature gebouwd, getest en live gezet moet worden.
disable-model-invocation: true
argument-hint: "<app> <beschrijving van feature of fix>"
---

# Agent Team: Release

Start een agent team voor het bouwen en deployen van features voor c.k.v. Oranje Wit.

## Team samenstelling

### Lead: ontwikkelaar
- **Rol**: Bouwt de feature, schrijft code, draait tests
- **Verantwoordelijkheden**:
  - Implementeert de gevraagde feature of fix
  - Schrijft en draait tests (`pnpm test:ti`, `pnpm test:monitor`, `pnpm test:evaluatie`)
  - Controleert typecheck (`pnpm exec tsc --noEmit`)
  - Controleert formatting (`pnpm format:check`)
  - Maakt een git commit wanneer alles groen is
  - Geeft deployment-opdracht aan teammate wanneer code klaar is

### Teammate: deployment
- **Rol**: Deployt naar Railway, controleert of alles live werkt
- **Verantwoordelijkheden**:
  - Monitort of de push naar main een Railway deployment triggert
  - Controleert build-logs op fouten
  - Verifieert dat de service live is via healthcheck
  - Controleert custom domain bereikbaarheid (Cloudflare Worker)
  - Rapporteert deployment-status terug aan de ontwikkelaar
  - Bij build-fouten: analyseert logs en meldt de oorzaak

## Werkwijze

### Fase 1: Development (ontwikkelaar lead)
1. **ontwikkelaar** analyseert de opdracht en leest relevante code
2. **ontwikkelaar** implementeert de feature/fix
3. **ontwikkelaar** draait tests en typecheck
4. **ontwikkelaar** fixt eventuele fouten
5. **ontwikkelaar** maakt een commit

### Fase 2: Deployment (parallel)
6. **ontwikkelaar** pusht naar main (na bevestiging gebruiker)
7. **deployment** monitort de Railway build
8. **deployment** verifieert dat de service live is:
   - Check deployment status via Railway MCP
   - Check bereikbaarheid via `curl -s https://<app>.ckvoranjewit.app`
   - Rapporteer resultaat
9. Bij fouten: **deployment** analyseert → **ontwikkelaar** fixt → herhaal

### Fase 3: Verificatie
10. **ontwikkelaar** bevestigt dat de feature werkt zoals verwacht
11. **deployment** doet een laatste check op alle services

## Communicatiepatronen

```
TC (gebruiker)
    ↕ feature-opdracht en goedkeuring
ontwikkelaar (lead)
    ↕ code + deploy-opdracht
    └── deployment (build, verify, rapporteer)
        ↕ directe feedback bij fouten
```

## App-configuratie

| App | Dev commando | Test | Live URL |
|---|---|---|---|
| Team-Indeling | `pnpm dev:ti` (4100) | `pnpm test:ti` | teamindeling.ckvoranjewit.app |
| Monitor | `pnpm dev:monitor` (4102) | `pnpm test:monitor` | monitor.ckvoranjewit.app |
| Evaluatie | `pnpm dev:evaluatie` (4104) | `pnpm test:evaluatie` | evaluaties.ckvoranjewit.app |

## Quality gates (verplicht voor commit)

1. `pnpm exec tsc --noEmit` — geen type-fouten
2. `pnpm test:<app>` — alle tests groen
3. `pnpm format:check` — formatting correct
4. ESLint via pre-commit hook (automatisch)

## Context

- **Taal**: Nederlands
- **Stack**: Next.js 16, Tailwind CSS 4, Prisma, pnpm workspaces
- **Deployment**: Railway (auto-deploy op push naar main)
- **DNS**: Cloudflare Worker proxy
- **Database**: PostgreSQL op Railway (NOOIT `pnpm db:push` draaien)

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, vraag dan:
1. Welke app? (team-indeling / monitor / evaluatie)
2. Wat moet er gebouwd/gefixt worden?
3. Moet het ook live gezet worden?
