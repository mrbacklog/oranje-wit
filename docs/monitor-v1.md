# Verenigingsmonitor v1 — Technische documentatie

> Status: Live op https://monitor.ckvoranjewit.app

## Overzicht

De Verenigingsmonitor is een Next.js 16 dashboard-app voor c.k.v. Oranje Wit. Het toont ledentrends, retentie, instroom/uitstroom, teamsamenstelling, spelersprofielen en signalering.

---

## Routes

| Route | Beschrijving |
|---|---|
| `/` | Dashboard: KPI's, leden-trend, instroom/uitstroom grafiek, signaleringen |
| `/retentie` | Retentie-analyse: behoud (waterfall), instroom/uitstroom, cohorten |
| `/retentie/[seizoen]` | Ledenverloop voor één seizoen: wie is erbij/weg |
| `/spelers` | Zoekpagina voor spelers |
| `/spelers/[relCode]` | Spelersprofiel: spelerspad, team-historie |
| `/teams` | Teamoverzicht huidig seizoen |
| `/signalering` | Signaleringen overzicht (kritiek/aandacht/op_koers) |
| `/samenstelling` | Teamsamenstelling per geboortejaar |
| `/samenstelling/[geboortejaar]` | Detail geboortejaar: instroom, retentie, spelerspaden |
| `/projecties` | Jeugdmodel projecties: pijplijn, knelpunten, streefboog |

---

## Data-architectuur

```
Sportlink CSV
    ↓ (handmatig import via MCP sync)
leden tabel (PostgreSQL)
    +
competitie_spelers (primaire tabel — 1 per speler × seizoen × competitie)
    ↓ bereken-verloop.js
ledenverloop
    ↓ bereken-cohorten.js
cohort_seizoenen
    ↓ genereer-signalering.js
signalering
```

Alle dashboards lezen live uit PostgreSQL. Geen tussenliggende JSON bestanden.

---

## Key-bestanden

### Queries (`apps/monitor/src/lib/queries/`)

| Bestand | Functies |
|---|---|
| `dashboard.ts` | `getDashboardKPIs`, `getLedenTrend`, `getInstroomUitstroom` |
| `retentie.ts` | `getCohortRetentieMatrix`, `getEersteSeizoenRetentie`, `getWaterfallData`, `getWaterfallDataLopend`, `getInstroomPerSeizoenMVLeeftijd`, `getUitstroomPerSeizoenMVLeeftijd`, `getNettoGroei` |
| `verloop.ts` | `getInstroomUitstroom`, `getAankomstigeUitstroom`, `getIntraSeizoenFlow`, `getInstroomPerLeeftijdRecent`, `getUitstroomPerLeeftijdRecent` |
| `cohorten.ts` | Cohort-queries voor projecties en samenstelling |
| `signalering.ts` | `getSignaleringen` |
| `spelers.ts` | Spelerszoeken en -profiel |
| `teams.ts` | Teamoverzicht |
| `samenstelling.ts` | Teamsamenstelling per geboortejaar |
| `uitslagen.ts` | Resultaten (KNKV API) |

### Utilities (`apps/monitor/src/lib/utils/`)

| Bestand | Inhoud |
|---|---|
| `retentie.ts` | `berekenWaterfall`, `detecteerKritiekeMomenten`, `detecteerPatronen` |
| `seizoen.ts` | Seizoenshelpers |
| `format.ts` | Opmaak-helpers |
| `pijplijn.ts` | Jeugdpijplijn-berekeningen |

### Huidig seizoen (`apps/monitor/src/lib/huidig-seizoen.ts`)

```ts
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
export { HUIDIG_SEIZOEN };
export function isLopendSeizoen(seizoen: string): boolean {
  return seizoen === HUIDIG_SEIZOEN;
}
```

Gebruik `isLopendSeizoen()` overal waar het lopende seizoen anders behandeld moet worden (voorlopige cijfers, anders label, etc.).

---

## Lopend seizoen — behandeling

Het lopende seizoen (`HUIDIG_SEIZOEN = "2025-2026"`) heeft onvolledige data omdat:
- Veld-voorjaar registraties (maart) nog niet in de database staan
- Uitstroom cijfers zijn "nog niet teruggekeerd", niet echte uitstroom

### Afspraken

| Metric | Behandeling lopend seizoen |
|---|---|
| Waterfall `getWaterfallData()` | Toont laatste AFGERONDE seizoen |
| Waterfall `getWaterfallDataLopend()` | Toont HUIDIG seizoen, amber badge "Voorlopig" |
| Instroom/uitstroom grafiek | Lopende bars: transparant + dashed, `*` label |
| KPI labels | Aangevuld met "(voorlopig)" |
| Gemiddelde per leeftijd | Sluit HUIDIG_SEIZOEN uit van N=5 berekening |
| Aankomende uitstroom | `getAankomstigeUitstroom()` via `leden.afmelddatum` |
| Intra-seizoen flow | `getIntraSeizoenFlow()` via `competitie_spelers.competitie` |

---

## Data-pipeline uitvoeren

Na nieuwe Sportlink-import:

```bash
# 1. Import leden (via MCP sync of handmatig script)
# 2. Herbereken verloop-data
node -r dotenv/config scripts/js/bereken-verloop.js
node -r dotenv/config scripts/js/bereken-cohorten.js
node -r dotenv/config scripts/js/genereer-signalering.js
```

---

## Authenticatie

De monitor gebruikt NextAuth v5 met Google OAuth. Alleen @ckvoranjewit.nl adressen hebben toegang (geconfigureerd in `middleware.ts`).

---

## Tests

```bash
pnpm test:monitor      # Run alle 43 tests
```

Testbestanden:
- `lib/queries/dashboard.test.ts` — getDashboardKPIs mocks
- `lib/queries/signalering.test.ts` — signalering queries
- `lib/queries/teams.test.ts` — team queries
- `lib/queries/cohorten.test.ts` — cohort berekeningen (16 tests)
- `lib/utils/retentie.test.ts` — waterfall, patroondetectie (11 tests)
- `lib/utils/seizoen.test.ts` — seizoenshelpers

---

## Deployment

Automatisch via GitHub Actions + Railway bij push naar `main`.

- **Service ID**: `a7efb126-8ad1-460d-b787-2d03207c3f3c`
- **Live URL**: https://monitor.ckvoranjewit.app
- **Dockerfile**: `apps/monitor/Dockerfile`
- **Build**: `pnpm build:monitor` of `pnpm -F @oranje-wit/monitor build`

---

## Versiehistorie

### v1.0 (2026-03)
- Dashboard: KPI's, leden-trend, instroom/uitstroom
- Retentie-module: waterfall (afgerond + lopend), intra-seizoen flow, aankomende uitstroom
- Spelers zoeken + individueel spelersprofiel
- Teams onderwaterscherm
- Signalering: stoplicht-cards
- Teamsamenstelling + geboortejaar-detail
- Projecties: jeugdmodel pijplijn, streefboog
- Lopend seizoen correct behandeld: voorlopige badge, exclusief van gemiddelden
