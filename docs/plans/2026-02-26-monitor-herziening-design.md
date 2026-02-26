# Design: Verenigingsmonitor v2

**Datum:** 2026-02-26
**Status:** Ontwerp goedgekeurd
**Vervangt:** huidige Express + vanilla HTML monitor (`apps/monitor/`)

---

## Doel

Volledig herontwerp van de Verenigingsmonitor als TC-tool voor gezonde groei. Data-gedreven beslissingen over actieve leden: aantallen, verhoudingen, cohorten, teams, verloop en signalering. Sportieve, warme uitstraling met Oranje Wit-identiteit.

## Doelgroep

Technische Commissie (TC) — primair. Bestuur als secundaire gebruiker voor trends en projecties.

## Tech-stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Database**: Prisma via `@oranje-wit/database` (gedeelde Railway PostgreSQL)
- **Styling**: Tailwind CSS 4, Oranje Wit design tokens
- **Grafieken**: Recharts of Chart.js (client components)
- **UI**: gedeeld package `packages/ui` (start klein, groeit organisch)
- **Deployment**: Railway, eigen service

## Architectuur

```
apps/monitor/              → Next.js app (@oranje-wit/monitor)
  src/
    app/
      layout.tsx           → Root layout met sidebar + seizoen-selector
      page.tsx             → Dashboard
      samenstelling/
        page.tsx           → Samenstelling
      cohorten/
        page.tsx           → Cohorten
      teams/
        page.tsx           → Teams
      verloop/
        page.tsx           → Verloop
      signalering/
        page.tsx           → Signalering
      projecties/
        page.tsx           → Projecties
    components/
      charts/              → Chart wrappers (client components)
      layout/              → Sidebar, header, seizoen-selector
    lib/
      queries/             → Prisma queries per domein
      utils/               → Helpers (formatting, band-kleuren, etc.)

packages/ui/               → Gedeelde UI-componenten
  src/
    kpi-card.tsx
    signal-badge.tsx
    band-pill.tsx
    chart-wrapper.tsx
```

### Navigatie

Sidebar (links, inklapbaar op mobiel):
- Oranje Wit logo + "Verenigingsmonitor" bovenaan
- 7 menu-items met icoon + label
- Seizoen-selector onderaan (dropdown, default huidig seizoen)
- Actieve pagina: oranje accent

### Seizoen-context

Elke pagina ontvangt het geselecteerde seizoen. Data wordt gefilterd op dat seizoen. Seizoen wordt via URL search param of context doorgegeven.

## Design

### Stijl: sportief/warm

- Oranje als dragende kleur, wit als basis
- Bandkleuren als visueel systeem door de hele app
- Afgeronde hoeken, warme schaduwen
- Energiek maar leesbaar

### Design tokens (Tailwind)

```
Primair:       #FF6B00 (oranje), #FFFFFF (wit)
Banden:        Blauw #4A90D9, Groen #52B788, Geel #F4D35E, Oranje #F28C28, Rood #D62828
Signalen:      Groen #4CAF50, Geel #FFC107, Rood #F44336
Grijs:         50 #F8F9FA, 100 #F1F3F5, 200 #E9ECEF, 600 #868E96, 800 #343A40, 900 #212529
Radius:        8px (cards), 12px (grote elementen)
Shadow:        0 1px 3px rgba(0,0,0,.1), lg: 0 4px 12px rgba(0,0,0,.12)
Typography:    system-ui stack
```

## Pagina's

### 1. Dashboard (`/`)

**Vraag: Hoe staan we ervoor?**

- 4-6 KPI-cards: totaal actief, netto groei, retentie %, instroom, aantal teams, M/V verhouding
- Trendlijn: actieve leden per seizoen
- Mini-ledenboog: compacte bar chart → klik door naar Samenstelling
- Top 3 signaleringen: stoplicht-cards → klik door naar Signalering

### 2. Samenstelling (`/samenstelling`)

**Vraag: Wie zijn er actief?**

- Ledenboog: horizontale bar chart per geboortejaar (M links, V rechts), gekleurd per band
- Verhoudingen: M/V ratio per band, jeugd vs senioren
- Tabel: per geboortejaar → M, V, totaal, band, leeftijd, A-categorie
- Verdieping: klik op geboortejaar → detail met spelers in dat cohort

### 3. Cohorten (`/cohorten`)

**Vraag: Hoe ontwikkelen jaargangen zich?**

- Cohort-heatmap: rijen = geboortejaar, kolommen = seizoenen, cel = actieve spelers, kleur = groei/krimp
- Filter: M/V/Alles toggle
- Retentie per cohort: bar chart
- Verdieping: klik op cohort → tijdlijn door alle seizoenen

### 4. Teams (`/teams`)

**Vraag: Hoeveel teams, hoe samengesteld?**

- Team-kaarten: per team, kleur-coded per band, met spelers/M/V/gem.leeftijd
- Secties: competitieteams, kangoeroe, recreant
- Pool-analyse: per leeftijdsgroep — beschikbare spelers, mogelijke teams
- Verdieping: klik op team → spelerslijst, periodes, sterkte

### 5. Verloop (`/verloop`)

**Vraag: Waar winnen/verliezen we leden?**

- Instroom vs uitstroom: gestapelde bar chart per seizoen
- Retentiecurve: retentie-% per leeftijdsjaar (alle seizoenen)
- Drop-out heatmap: leeftijd × seizoen, kleur = uitstroompercentage
- Instroomvenster: leeftijdsverdeling nieuwe leden + trend
- Kritieke overgangsmomenten: retentie bij 5→6, 12→13, 14→15, 18→19, 21→23

### 6. Projecties (`/projecties`)

**Vraag: Waar gaan we naartoe?**

- Streefmodel-boog: huidig vs projectie 2028/2030 (overlay chart)
- Vulgraad: per leeftijdsjaar, huidig vs streef, stoplicht
- Groeipad per geboortejaar: tabel huidig → projectie
- KNKV-benchmark: OW vs landelijk, vs concurrenten (indien data beschikbaar)

### 7. Signalering (`/signalering`)

**Vraag: Waar moeten we op letten?**

- KPI-cards: aantal kritiek, aandacht, op koers
- Alert-lijst: stoplicht-cards, sorteerbaar op ernst/type
- Filters: per type (retentie, instroom, genderdisbalans, benchmark, trendbreuk)
- Actiepunten: per alert een concreet advies

## Data-laag

Prisma queries per domein in `src/lib/queries/`:

| Bestand | Tabellen | Doel |
|---|---|---|
| `dashboard.ts` | meerdere | Samengestelde KPIs voor homepage |
| `samenstelling.ts` | leden_snapshot, leden, teams | Per-geboortejaar, per-kleur, per-team |
| `cohorten.ts` | cohort_seizoenen | Cohort × seizoen data |
| `verloop.ts` | ledenverloop | Instroom, uitstroom, retentie |
| `signalering.ts` | signalering | Alerts per seizoen |
| `model.ts` | streefmodel | Projecties en streefcijfers |
| `teams.ts` | teams, team_periodes | Team register en periodes |

Alle queries accepteren `seizoen` als parameter. Server Components halen data direct op via Prisma — geen tussenliggende API.

## Deployment

- Railway: eigen service in project `oranje-wit-db`
- Geen auth in v1 (TC deelt de URL)
- Oude Express monitor wordt volledig vervangen

## Buiten scope (v1)

- Authenticatie/rollen
- Individuele spelersprofielen (namen)
- Real-time data updates
- Export naar PDF/Excel
- Mobiele app
