# TI-Studio splitsing — Design spec

**Datum:** 2026-04-12  
**Status:** Goedgekeurd — wacht op uitvoering (development luw moment)  
**Auteur:** Antjan (PO) + Claude

---

## Aanleiding

TI-Studio (`/ti-studio`) is veruit het grootste onderdeel van de monorepo (~15.000 regels code) en tegelijkertijd de meest afwijkende app: uitsluitend voor TC-leden, uitsluitend voor desktop. De overige apps (Monitor, Evaluatie, Scouting, Beheer, Beleid) zijn meer generiek, mobile-first en werken nauw samen. TI-Studio hoort daar functioneel niet bij.

Doel van de splitsing:
- TI-Studio krijgt een eigen URL (`teamindeling.ckvoranjewit.app`)
- TI-Studio verdwijnt uit `apps/web`
- Vibe-coding agents hebben een scherp afgebakend werkgebied per app
- Crashes en deploys zijn geïsoleerd

---

## Architectuur na splitsing

### Monorepo structuur

```
apps/
├── web/                        # Monitor, Evaluatie, Scouting, Beheer, Beleid
│                               # + /teamindeling (mobile review, blijft hier)
│   Domein: ckvoranjewit.app + www.ckvoranjewit.app
├── ti-studio/                  # NIEUW — TI Studio desktop
│   Domein: teamindeling.ckvoranjewit.app
└── mcp/

packages/
├── database/                   # Ongewijzigd — Prisma schema, source of truth
├── auth/                       # Licht aangepast — cookie domain → .ckvoranjewit.app
├── types/                      # Ongewijzigd
├── ui/                         # Licht aangepast — TI_STUDIO manifest blijft, maar
│                               #   verdwijnt uit apps/web navigatielijst
└── teamindeling-shared/        # NIEUW — gedeelde Werkindeling-logica
```

### Domeinen

| App | Railway service | Domein |
|---|---|---|
| `apps/web` | Bestaand | `ckvoranjewit.app`, `www.ckvoranjewit.app` |
| `apps/ti-studio` | Nieuw aan te maken | `teamindeling.ckvoranjewit.app` |

Alle huidige subdomein-aliassen op `apps/web` (monitor.*, evaluatie.*, teamindeling.*, etc.) worden verwijderd of omgezet naar redirects naar `www`. Alleen `teamindeling.ckvoranjewit.app` blijft actief — maar wijst straks naar de nieuwe Railway service.

---

## Wat verhuist naar `apps/ti-studio`

| Bron in `apps/web` | Doel in `apps/ti-studio` |
|---|---|
| `app/(teamindeling-studio)/ti-studio/**` | `app/**` |
| `components/ti-studio/**` | `components/**` |
| `app/api/ti-studio/**` | `app/api/**` |
| TI-specifieke delen van `lib/teamindeling/` | `lib/` |

### Wat in `@oranje-wit/teamindeling-shared` terechtkomt

Alleen logica die zowel `apps/web` (`/teamindeling` mobile) als `apps/ti-studio` gebruikt:

- `lib/teamindeling/seizoen-provider` en seizoen-helpers
- Gedeelde TypeScript-types voor het Werkindeling-domein (Werkindeling, Versie, Team)
- Eventuele score-berekeningen die beide apps gebruiken

Alles wat exclusief TI-Studio is blijft in `apps/ti-studio/lib/`.

---

## Migratiestrategie

Kernprincipe: **nooit breken wat werkt** — `apps/web` blijft volledig functioneel totdat `apps/ti-studio` productierijp is.

### Fase 1 — Fundament leggen
1. Maak `apps/ti-studio` aan als nieuwe Next.js app (kopieer basis-config van `apps/web`)
2. Configureer pnpm workspace voor de nieuwe app
3. Maak `packages/teamindeling-shared` aan
4. Verplaats gedeelde `lib/teamindeling` logica naar `@oranje-wit/teamindeling-shared`
5. Laat `apps/web` importeren uit het nieuwe package — CI moet groen blijven

### Fase 2 — Code verplaatsen (in blokken)

Per blok: verplaatsen → CI groen → pas dan verder.

| Blok | Wat |
|---|---|
| 1 | `app/(teamindeling-studio)/ti-studio/**` → `apps/ti-studio/app/**` |
| 2 | `components/ti-studio/**` → `apps/ti-studio/components/**` |
| 3 | `app/api/ti-studio/**` → `apps/ti-studio/app/api/**` |
| 4 | TI-specifieke `lib/teamindeling` → `apps/ti-studio/lib/` |

Oude code in `apps/web` wordt pas verwijderd nadat het blok volledig werkt in `apps/ti-studio`.

### Fase 3 — Auth & infrastructure

**Auth (cookie domain):**  
NextAuth v5 in `@oranje-wit/auth` instellen met `cookieDomain: '.ckvoranjewit.app'`. Hierdoor is één Google-login geldig voor zowel `ckvoranjewit.app` als `teamindeling.ckvoranjewit.app`.

**Railway:**  
Nieuwe service aanmaken voor `apps/ti-studio` met dezelfde omgevingsvariabelen als `apps/web` (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.).

**DNS:**  
`teamindeling.ckvoranjewit.app` CNAME-target wisselen van `apps/web` service naar de nieuwe `apps/ti-studio` service. Geen DNS-propagatie nodig (CNAME-waarde verandert niet, alleen Railway-target).

### Fase 4 — Opruimen & CI uitbreiden

- Verwijder `(teamindeling-studio)` route-group uit `apps/web`
- Verwijder TI-Studio uit navigatielijst van `apps/web`
- Verwijder overtollige subdomein-aliassen van `apps/web` in Railway
- Breid CI pipeline uit (zie CI/CD sectie)
- Update E2E tests zodat ze draaien tegen `teamindeling.ckvoranjewit.app`

---

## Risico's & mitigaties

| Risico | Mitigatie |
|---|---|
| Auth-cookie werkt niet cross-subdomain | Cookie domain instellen op `.ckvoranjewit.app` in fase 3, vóór DNS-switch |
| `apps/web` breekt tijdens migratie | Oude code pas verwijderen ná werkende nieuwe app |
| Database-connecties (2 apps, 1 DB) | Railway connection pooling is al actief, geen actie nodig |
| E2E tests falen na DNS-switch | Tests bijwerken in dezelfde PR als DNS-switch |

---

## CI/CD na splitsing

De bestaande `ci.yml` krijgt parallelle jobs per app:

```yaml
jobs:
  fast-gate-web:         # typecheck + lint + unit tests voor apps/web
  fast-gate-ti-studio:   # typecheck + lint + unit tests voor apps/ti-studio
  e2e-web:               # Playwright tegen apps/web
  e2e-ti-studio:         # Playwright tegen apps/ti-studio
  deploy:                # deploy beide apps (na alle checks)
```

Turborepo `affected`-filtering zorgt ervoor dat alleen gewijzigde apps opnieuw gebuild en getest worden.

---

## Navigatieaanpassingen in `apps/web`

- `TI_STUDIO` app-manifest blijft bestaan in `packages/ui/src/navigation/manifest.ts` (ook `apps/ti-studio` heeft hem nodig)
- TI-Studio verdwijnt uit de navigatielijst van `apps/web`
- `/teamindeling` (mobile) behoudt zijn eigen navigatie en is niet afhankelijk van TI-Studio routes

---

## Agent-werkgebieden na splitsing

| Taak | Relevante codebase |
|---|---|
| TI-Studio features | `apps/ti-studio` + `packages/teamindeling-shared` |
| Monitor / Evaluatie / Scouting / etc. | `apps/web` |
| Mobile teamindeling | `apps/web` + `packages/teamindeling-shared` |
| Gedeelde UI componenten | `packages/ui` |
| Auth of database schema | `packages/auth` of `packages/database` |
