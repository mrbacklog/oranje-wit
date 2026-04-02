# Monitor Herstructurering — Implementatieplan

> Status: **Goedgekeurd** — april 2026
> Doel: Monitor-domein als eerste volledig afronden met professionele UX

---

## Samenvatting

De Monitor wordt geherstructureerd van 10 pagina's met diepe tab-hiërarchie naar een plattere, intuïtievere structuur. Projecties wordt opgesplitst over Samenstelling en Retentie. Teams krijgt een visuele upgrade met teamkaartjes en een eigen detail-pagina. Signalering wordt versimpeld.

### Navigatie: voor → na

```
VOOR:
  Overzicht │ Teams │ Analyse (pills: Retentie, Samenstelling, Projecties) │ Signalen
  Spelers: onvindbaar (alleen via dashboard)

NA:
  Overzicht │ Teams (pills: Teams, Spelers) │ Analyse (pills: Samenstelling, Retentie) │ Signalen
  Projecties pill: verwijderd (content verdeeld)
```

---

## Fase 1: Navigatie-fundament

### 1.1 Manifest updaten

**Bestand**: `packages/ui/src/navigation/manifest.ts`

```ts
export const MONITOR: AppManifest = {
  // ... bestaande velden
  sections: [
    {
      nav: { label: "Overzicht", href: "/monitor", icon: "ChartIcon" },
    },
    {
      nav: { label: "Teams", href: "/monitor/teams", icon: "PeopleIcon" },
      pills: [
        { label: "Teams", href: "/monitor/teams" },
        { label: "Spelers", href: "/monitor/spelers" },
      ],
    },
    {
      nav: { label: "Analyse", href: "/monitor/samenstelling", icon: "CompareIcon" },
      pills: [
        { label: "Samenstelling", href: "/monitor/samenstelling" },
        { label: "Retentie", href: "/monitor/retentie" },
      ],
    },
    {
      nav: { label: "Signalen", href: "/monitor/signalering", icon: "StarIcon" },
    },
  ],
};
```

**Wijzigingen**:
- Teams: pills toevoegen (Teams + Spelers)
- Analyse: default href naar `/monitor/samenstelling`, pills herordend (Samenstelling eerst), Projecties pill verwijderd
- Signalen: ongewijzigd

**Design system check**: `rules/design-system.md` pills-tabel bijwerken.

### 1.2 E2E tests aanpassen

**Bestand**: `e2e/monitor/navigatie.spec.ts`

- BottomNav test: ongewijzigd (4 items: Overzicht, Teams, Analyse, Signalen)
- Navigatie test: `/monitor/projecties` verwijderen uit pagina-lijst
- Toevoegen: pills-test (Teams sectie toont "Teams" en "Spelers" pills)
- Toevoegen: pills-test (Analyse sectie toont "Samenstelling" en "Retentie" pills)

---

## Fase 2: Teams-sectie vernieuwen

### 2.1 TeamCard component

**Nieuw bestand**: `apps/web/src/components/monitor/teams/team-card.tsx`

Design-spec (goedgekeurd door UX):
- Twee-zone kaart: gradient-header (45%) + data-zone (55%)
- Gradient per bandkleur (KNKV tokens: `--knkv-{band}-400` → `--knkv-{band}-600`)
- Senioren: subtiel donker + OW-oranje top-border (2px)
- A-categorie: leeftijdsgradient uit `--age-{n}-gradient` tokens
- Overig (midweek etc.): neutraal met vleugje warmte
- Geel band: donkere tekst (`--knkv-geel-950`) i.p.v. wit
- Data-zone: spelercount (M/V met kleur-dots), 2 trainers (initiaal + achternaam)
- Hover: Framer Motion `y: -4, scale: 1.02`, gekleurde shadow + glow-overlay
- Tap: `scale: 0.98`
- Stagger bij laden: 40ms per kaart

**Helper bestand**: `apps/web/src/components/monitor/teams/team-kleuren.ts`
- `getTeamKleurConfig(team)` → gradient, textOnGradient, tintBg, borderColor, hoverShadow, glowColor

**Regels**:
- OW-naam leidend, J-nummer NIET tonen (kan wijzigen gedurende seizoen)
- 2 trainers standaard: initiaal voornaam + achternaam, gescheiden door ` · `
- 1 trainer: volle voornaam + achternaam
- 3+ trainers: eerste 2 + `+1`
- 0 trainers: niets tonen

**Design tokens benodigd** (check of ze bestaan in `tokens.css`):
- `--knkv-{blauw,groen,geel,oranje,rood}-{400,500,600}` ✓
- `--age-{n}-gradient` ✓
- `--surface-card`, `--surface-raised` ✓

### 2.2 Teams overview pagina herschrijven

**Bestand**: `apps/web/src/app/(monitor)/monitor/teams/page.tsx`

- Verwijder `TeamsOnderwaterscherm` import
- Server component: haalt teams + tellingen + staf op
- Rendert grid per categorie (Senioren → A-jeugd → B-jeugd)
- Section-headers met label + count + divider
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4`
- Elk TeamCard linkt naar `/monitor/teams/[ow_code]`
- Seizoenskeuze via searchParam `?seizoen=`

### 2.3 Team detail pagina (NIEUW)

**Nieuw bestand**: `apps/web/src/app/(monitor)/monitor/teams/[code]/page.tsx`

- Server component met `params.code` (ow_code)
- Header: teamnaam (editable), BandPill, spelvorm, leeftijdsgroep
- Terug-knop: `← Terug naar teams`
- Tab: **Spelers & Staf**
  - Spelersnamen als `Link` naar `/monitor/spelers/[relCode]`
  - Staf-sectie met naam + rol
  - Telling: X spelers (Y♂ / Z♀)
- Tab: **Standen**
  - Competitiestanden (uit bestaande `ResultatenTab`)
  - Poule-info, uitslagen
- Drag & drop sortering B-categorie: verplaatsen naar beheer of verwijderen

**Data**: hergebruik bestaande queries (`getSpelersVanTeam`, `getStafPerTeam`, `getOWTeamsMetUitslagen`)

### 2.4 Bestaande bestanden opruimen

- `teams-onderwaterscherm.tsx` (399r) → verwijderen (vervangen door grid + detail pagina)
- `team-sidebar.tsx` → verwijderen
- `teams-types.ts` → updaten (alleen wat team-detail nodig heeft)
- `team-tab.tsx` → hergebruiken in team detail pagina
- `selectie-tab.tsx` → hergebruiken in team detail pagina
- `resultaten-tab.tsx` → hernoemen naar standen, hergebruiken

### 2.5 E2E tests

**Bestand**: `e2e/monitor/teams.spec.ts` — herschrijven

```
- toont teamkaarten grid met categorieën
- teamkaart toont naam, spelvorm, spelercount
- klik op teamkaart navigeert naar /monitor/teams/[code]
- team detail toont spelers met links naar spelerprofiel
- team detail toont staf
- team detail toont standen tab
- terug-knop gaat naar /monitor/teams
- seizoen-wisseling werkt
```

---

## Fase 3: Speler cross-links

### 3.1 Spelerkaart: teamnamen klikbaar

**Bestand**: `apps/web/src/app/(monitor)/monitor/spelers/[relCode]/page.tsx`

- In seizoenstabel: team-kolom wordt `Link` naar `/monitor/teams/[code]`
- Lookup: team naam → ow_code (via query of meegegeven data)

### 3.2 Dynamische terug-navigatie

**Implementatie**: query parameter `?from=`

- `/monitor/spelers/[relCode]?from=teams/Rood` → "← Terug naar Rood"
- `/monitor/spelers/[relCode]` (geen from) → "← Terug naar spelers"
- `/monitor/teams/[code]` → altijd "← Terug naar teams"

**Bestand**: helper `apps/web/src/lib/monitor/utils/terug-link.ts`

### 3.3 E2E tests

**Bestand**: `e2e/monitor/spelers.spec.ts` — uitbreiden

```
- spelerkaart toont teamnaam als klikbare link
- klik op teamnaam navigeert naar team detail
- terug-link vanuit team detail toont "Terug naar [teamnaam]"
- terug-link vanuit spelers overzicht toont "Terug naar spelers"
```

---

## Fase 4: Samenstelling samenvoegen

### 4.1 Pagina herschrijven

**Bestand**: `apps/web/src/app/(monitor)/monitor/samenstelling/page.tsx`

Wordt 1 scrollbare pagina (geen tabs):

```
┌─ Doelkaart KPI's ──────────────────────────┐
│ U15: 24/28 (86%)  U17: 22/28 (79%)  U19: …│  ← uit Projecties
└─────────────────────────────────────────────┘
┌─ Populatiepiramide ─────────────────────────┐
│ Huidig (solid) vs Benodigd (transparant)    │  ← piramide + pijplijn overlay
│ Klikbaar per geboortejaar → cohort detail   │
└─────────────────────────────────────────────┘
┌─ Pijplijn-tabel ────────────────────────────┐
│ Per leeftijd: huidig / benodigd / vulgraad  │  ← uit Projecties
└─────────────────────────────────────────────┘
┌─ Cohort-heatmap ────────────────────────────┐
│ Geboortejaar × seizoen, kleurintensiteit    │  ← was "Historie" tab
└─────────────────────────────────────────────┘
┌─ Knelpunten + retentiecurve ────────────────┐
│ "Waar lekken we?" groei-factoren per leeftijd│ ← uit Projecties
│ Knelpunten grid                              │
└─────────────────────────────────────────────┘
```

**Data**: combineer `getPerGeboortejaar`, `getCohorten`, `getPijplijn`, `berekenKnelpunten`

### 4.2 Cohort-detail pagina

**Bestand**: `apps/web/src/app/(monitor)/monitor/samenstelling/[geboortejaar]/page.tsx`

- Ongewijzigd qua functionaliteit
- Toevoegen: spelerkaart-links (Link componenten naar `/monitor/spelers/[relCode]`)
- Terug-link updaten als nodig

### 4.3 Opruimen

- `SamenstellingTabs` component → verwijderen
- `samenstelling-tabs.tsx` → verwijderen

### 4.4 E2E tests

**Bestand**: `e2e/monitor/samenstelling.spec.ts` — herschrijven

```
- toont doelkaart KPI's (U15, U17, U19)
- toont populatiepiramide
- piramide toont huidig vs benodigd overlay
- toont pijplijn-tabel met vulgraad
- toont cohort-heatmap
- toont knelpunten sectie
- klik op geboortejaar navigeert naar cohort detail
- cohort detail toont actieve en gestopte leden
- cohort detail leden linken naar spelerkaart
```

---

## Fase 5: Retentie herstructureren

### 5.1 Tabs herindelen

**Bestand**: `apps/web/src/app/(monitor)/monitor/retentie/retentie-content.tsx`

**Van 4 tabs → 4 tabs (andere indeling):**

| Tab | Inhoud | Bron |
|-----|--------|------|
| **Behoud** | Waterfall (lopend + vorig), retentiecurves, kritieke momenten | Bestaand |
| **Verloop** | KPI's instroom+uitstroom gecombineerd, bar charts per leeftijd, seizoen-charts, patronen, aankomstige uitstroom, intra-seizoen flow | Merge van Instroom + Uitstroom tabs |
| **Cohorten** | Retentiematrix, eerste-seizoen retentie | Bestaand |
| **Prognose** | Doorstroom-tabel, piramide huidig vs benodigd, U17-projectie, senioren-tabel | Uit Projecties |

### 5.2 Verloop-tab: instroom + uitstroom samen

**Design**: twee kolommen op desktop, gestapeld op mobile

```
┌─ Instroom KPI's ──┐ ┌─ Uitstroom KPI's ──┐
│ Totaal / Jeugd /   │ │ Totaal / Jeugd /   │
│ Senioren + trend   │ │ Senioren + trend   │
└────────────────────┘ └────────────────────┘
┌─ Instroom per leeftijd ────────────────────┐
│ Grouped bar chart M/V                       │
└─────────────────────────────────────────────┘
┌─ Uitstroom per leeftijd ───────────────────┐
│ Grouped bar chart M/V                       │
└─────────────────────────────────────────────┘
┌─ Per seizoen (side by side) ───────────────┐
│ Instroom bars │ Uitstroom bars              │
└─────────────────────────────────────────────┘
┌─ Aankomstige uitstroom (namen) ────────────┐
│ Tabel met afgemelde leden                   │
└─────────────────────────────────────────────┘
```

### 5.3 Prognose-tab: uit Projecties

**Imports verplaatsen van** `projecties/page.tsx` **naar** retentie:
- `DoorstroomTable`
- `ProjectiePiramide`
- `U17ProjectionTable`
- `SeniorenTable`

**Data**: `getProjectie(seizoen)` query toevoegen aan retentie-content parallel fetch

### 5.4 RetentieTabs component

- Bestaande `RetentieTabs` updaten: 4 tabs met nieuwe labels
- Tab-namen: Behoud, Verloop, Cohorten, Prognose

### 5.5 Seizoen-verloop detail pagina

**Bestand**: `apps/web/src/app/(monitor)/monitor/retentie/[seizoen]/page.tsx`
- Ongewijzigd (blijft bestaan als naslag)

### 5.6 E2E tests

**Bestand**: `e2e/monitor/retentie.spec.ts` — herschrijven

```
- toont retentie pagina met 4 tabs (Behoud, Verloop, Cohorten, Prognose)
- behoud tab toont waterfall diagram
- verloop tab toont instroom EN uitstroom KPI's
- verloop tab toont per-leeftijd grafieken
- cohorten tab toont retentiematrix
- prognose tab toont doorstroom-tabel
- prognose tab toont piramide huidig vs benodigd
- klik op seizoen navigeert naar seizoen-verloop detail
```

---

## Fase 6: Signalering versimpelen

### 6.1 Tabs → filterknoppen

**Bestand**: `apps/web/src/app/(monitor)/monitor/signalering/page.tsx`

**Was**: 4 tabs (Overzicht, Werving, Retentie, Pijplijn) via `SignaleringTabs`
**Wordt**: 1 pagina met filter-chips bovenaan

```
┌─ KPI-strip ────────────────────────────────┐
│ [Kritiek: 3]  [Aandacht: 5]  [Op koers: 8]│
└─────────────────────────────────────────────┘
┌─ Filter-chips ─────────────────────────────┐
│ [Alles] [Werving] [Retentie] [Pijplijn]   │  ← klikbaar, URL-param ?filter=
└─────────────────────────────────────────────┘
┌─ Strategisch advies (alleen bij actief) ───┐
│ Per thema: beschrijving + actie-link        │
└─────────────────────────────────────────────┘
┌─ Signaleringkaarten ───────────────────────┐
│ Gefilterd op geselecteerde chip             │
│ Gesorteerd op ernst (kritiek eerst)         │
└─────────────────────────────────────────────┘
```

**Filter-chips**: client-component met `useState` + URL searchParam sync
**Strategisch advies**: alleen tonen als er kritieke/aandacht signaleringen zijn

### 6.2 Opruimen

- `SignaleringTabs` component → verwijderen
- `signalering-tabs.tsx` → verwijderen

### 6.3 E2E tests

**Bestand**: `e2e/monitor/signalering.spec.ts` — herschrijven

```
- toont signalering pagina met KPI-tellers
- toont filter-chips (Alles, Werving, Retentie, Pijplijn)
- klik op filter toont gefilterde signaleringen
- filter-keuze reflecteert in URL param
- strategisch advies sectie toont links naar analyse
- signaleringkaarten zijn gesorteerd op ernst
```

---

## Fase 7: Projecties opruimen

### 7.1 Route redirect

**Bestand**: `apps/web/src/app/(monitor)/monitor/projecties/page.tsx`

Vervang door redirect:
```ts
import { redirect } from "next/navigation";
export default function ProjectiesRedirect() {
  redirect("/monitor/samenstelling");
}
```

### 7.2 Componenten verplaatsen

Componenten die behouden blijven (nu gebruikt door Samenstelling of Retentie):
- `doelkaart.tsx` → verplaats naar `components/monitor/samenstelling/`
- `pijplijn-table.tsx` → verplaats naar `components/monitor/samenstelling/`
- `knelpunten-grid.tsx` → verplaats naar `components/monitor/samenstelling/`
- `retentie-curve.tsx` (projecties variant) → check overlap met charts variant
- `doorstroom-table.tsx` → verplaats naar `components/monitor/retentie/`
- `projectie-piramide.tsx` → verplaats naar `components/monitor/retentie/`
- `u17-projection-table.tsx` → verplaats naar `components/monitor/retentie/`
- `senioren-table.tsx` → verplaats naar `components/monitor/retentie/`

Componenten die verwijderd worden:
- `PijplijnTabs` → verwijderen
- `pijplijn-tabs.tsx` → verwijderen

### 7.3 E2E tests

**Bestand**: `e2e/monitor/projecties.spec.ts` → verwijderen of omschrijven naar redirect-test

```
- /monitor/projecties redirect naar /monitor/samenstelling
```

**Bestand**: `e2e/monitor/tab-deeplinks.spec.ts` → updaten (verwijder projecties deeplinks)

---

## Fase 8: Design-consistentie audit

### 8.1 Kleur-token audit

Doorloop alle monitor-componenten en vervang:
- Inline `style={{ backgroundColor: "var(--color-error-50)" }}` → Tailwind token of gedeelde component
- Mix van `text-signal-rood` + `style={{ color: "var(--color-error-700)" }}` → kies één systeem
- Handmatige `div className="bg-surface-card rounded-xl p-6 shadow-sm"` → gebruik `Card` uit `@oranje-wit/ui`

### 8.2 StatusCard component

**Nieuw bestand**: `packages/ui/src/data-display/status-card.tsx`

Varianten: `neutral | warning | error | info`
Vervangt de ad-hoc kaart-styling in retentie, signalering en samenstelling pagina's.

### 8.3 Empty states verbeteren

Alle "Geen data" / "Geen spelers gevonden" states:
- Voeg een subtiel icoon toe
- Voeg een actie-suggestie toe waar relevant
- Consistente styling via `EmptyState` uit `@oranje-wit/ui`

### 8.4 Seizoens-context

Overweeg een subtiele seizoen-indicator in de TopBar of als breadcrumb, zodat een TC-lid altijd weet welk seizoen ze bekijken.

---

## Fase 9: Overzicht (dashboard) aanpassen

### 9.1 Snellinks updaten

Dashboard KPI-kaarten en signaleringen linken naar de nieuwe routes:
- "Teams" KPI → `/monitor/teams` (ongewijzigd)
- "Signaleringen" KPI → `/monitor/signalering` (ongewijzigd)
- "Spelende leden" hero → `/monitor/spelers` (ongewijzigd)
- Signalering detail-links → check of `/monitor/retentie` en `/monitor/samenstelling` correct zijn (P0 fix al gedaan)

---

## Test-strategie

### Unit tests

Bestaande query-tests (`*.test.ts` in `lib/monitor/queries/`) blijven ongewijzigd — de data-laag verandert niet.

### E2E tests (herschrijven)

| Spec | Status | Wat testen |
|------|--------|------------|
| `navigatie.spec.ts` | Updaten | Pills zichtbaarheid, Projecties uit lijst |
| `dashboard.spec.ts` | Ongewijzigd | KPI's, links, signaleringen |
| `teams.spec.ts` | Herschrijven | TeamCard grid, team detail pagina, cross-links |
| `spelers.spec.ts` | Uitbreiden | Team-links in spelerkaart, dynamische terug-nav |
| `samenstelling.spec.ts` | Herschrijven | 1 pagina, doelkaart, piramide+overlay, heatmap, knelpunten |
| `retentie.spec.ts` | Herschrijven | 4 nieuwe tabs, verloop gecombineerd, prognose |
| `signalering.spec.ts` | Herschrijven | Filterknoppen i.p.v. tabs |
| `projecties.spec.ts` | Vervangen | Redirect-test |
| `tab-deeplinks.spec.ts` | Updaten | Projecties deeplinks verwijderen |
| `visual-check.spec.ts` | Updaten | TeamCard visuele check toevoegen |

### Visual regression

Na alle wijzigingen: visual regression tests draaien voor de nieuwe componenten (TeamCard, samenstelling pagina, retentie tabs).

---

## Bouwvolgorde en afhankelijkheden

```
Fase 1: Manifest + navigatie          ← basis, alles hangt hiervan af
  │
  ├── Fase 2: Teams (parallel)        ← TeamCard + overview + detail
  │     └── Fase 3: Cross-links       ← afhankelijk van team detail
  │
  ├── Fase 4: Samenstelling (parallel) ← samenvoegen + projecties-content
  │
  ├── Fase 5: Retentie (parallel)     ← herindelen + prognose-tab
  │
  └── Fase 6: Signalering (parallel)  ← versimpelen
        │
        └── Fase 7: Projecties opruimen ← afhankelijk van fase 4+5
              │
              └── Fase 8: Design audit  ← nadat alles staat
                    │
                    └── Fase 9: Dashboard links ← laatste check
```

Fase 2, 4, 5 en 6 kunnen **parallel** gebouwd worden na fase 1.

---

## Risico's

| Risico | Mitigatie |
|--------|----------|
| Team detail pagina verliest drag & drop sortering B-categorie | Verplaats naar beheer of houd als feature op overview-pagina |
| Samenstelling pagina wordt te lang op mobile | Collapsible secties of lazy loading per blok |
| Projectie-data queries zijn zwaar | Server-side caching of ISR |
| E2E tests breken door route-wijzigingen | Tests herschrijven per fase, niet achteraf |

---

## Definition of Done

- [ ] Alle 4 BottomNav items werken met correcte pills
- [ ] TeamCard component met gradient design per bandkleur
- [ ] Team detail pagina met klikbare spelers en standen
- [ ] Spelerkaart linkt naar teams en vice versa
- [ ] Dynamische terug-navigatie werkt vanuit beide richtingen
- [ ] Samenstelling is 1 pagina met piramide + pijplijn + heatmap + knelpunten
- [ ] Retentie heeft 4 tabs (Behoud, Verloop, Cohorten, Prognose)
- [ ] Signalering is 1 pagina met filterknoppen
- [ ] `/monitor/projecties` redirect naar `/monitor/samenstelling`
- [ ] Alle E2E tests groen
- [ ] Geen dead code (oude tabs-componenten, monitor-shell)
- [ ] Design-consistentie: geen inline kleuren, Card component gebruikt
- [ ] J-nummering nergens leidend
- [ ] Responsive: mobile 2 kolommen, desktop 4 kolommen teamkaarten
- [ ] Stagger-animaties op teamkaarten en pagina-overgangen
