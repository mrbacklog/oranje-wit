# Dialoog-consolidatie TI Studio v2

**Aangemaakt**: 2026-05-18
**Type**: refactor — geen functionaliteit-wijziging
**Voorwaarde voor**: parallelle pagina-agents Fase 1b (zie realisatieplan)
**Doel**: één code-werkelijkheid per entiteit-dialoog, vóór pagina-agents
hun functionaliteit-laag op de dialogen uitbreiden.

## Probleem

Dialogen en hover-kaarten zijn cross-page componenten met eigen
functionaliteit (server-action-calls, status-edit, indeling-edit). Op dit
moment leven ze onder pagina-mappen en is er al sluipende dubbeling:

| Onderwerp | Bestaande locatie(s) | Probleem |
|---|---|---|
| Speler hover-kaart | `components/speler/contexts/HoverKaart.tsx` (690 regels) **én** `components/personen/spelers/HoverKaartSpeler.tsx` (615 regels) | Twee bijna identieke implementaties voor één onderwerp |
| `SpelerDialog` | `components/personen/spelers/SpelerDialog.tsx` | Wordt geïmporteerd door werkbord ([WerkbordShell.tsx:22](../../apps/ti-studio-v2/src/app/(app)/(studio)/indeling/_components/WerkbordShell.tsx#L22)) — suggereert ten onrechte eigendom bij personen |
| `StafDialog` | `components/personen/staf/StafDialog.tsx` | Werkbord-staf-tegel zal hem ook nodig hebben |
| `NieuweSpelerDialog` / `NieuweStafDialog` / `NieuweReserveringDialog` | `components/personen/<sub>/` | Werkbord wil "▲ Memo"-knop met nieuwe-memo-dialog — zelfde patroon-vraag |
| `TeamDialog` | `apps/(app)/(studio)/indeling/_components/TeamDialog.tsx` | Werkbord-spec §8 stelt expliciet: ook nodig vanuit personen — niet besloten |
| Entiteit server actions | `(personen)/personen/actions.ts` (`updateSpelerStatus`, `updateSpelerIndeling`, `updateGezienStatus`, `maakNieuweSpeler`, `maakNieuweStaf`, `maakNieuweReservering`) | Server actions onder een pagina, terwijl ze entiteit-CRUD zijn die ook werkbord gebruikt |

## Canon

**Locatie-regel**: dialoog/hover-kaart-componenten worden georganiseerd per
**entiteit**, niet per pagina.

```
apps/ti-studio-v2/src/components/
├── speler/
│   ├── primitives/         ← bestaat (Avatar, LeeftijdKolom, MemoCorner, TeamBadge)
│   └── contexts/           ← bestaat — DialogenĐom hier
│       ├── HoverKaart.tsx          (canon — HoverKaartSpeler vervalt)
│       ├── SpelerDialog.tsx        (verhuist uit personen/spelers/)
│       ├── NieuweSpelerDialog.tsx  (verhuist uit personen/spelers/)
│       ├── HeroHeader.tsx          (bestaat)
│       ├── CompactChip.tsx         (bestaat)
│       └── RijkeRij.tsx            (bestaat)
├── staf/
│   ├── primitives/         (nieuw — leeg of klein)
│   └── contexts/           (nieuw)
│       ├── HoverKaartStaf.tsx      (verhuist uit personen/staf/)
│       ├── StafDialog.tsx          (verhuist uit personen/staf/)
│       └── NieuweStafDialog.tsx    (verhuist uit personen/staf/)
├── team/
│   └── contexts/           (nieuw)
│       └── TeamDialog.tsx          (verhuist uit indeling/_components/)
├── reservering/
│   └── contexts/           (nieuw)
│       └── NieuweReserveringDialog.tsx  (verhuist uit personen/reserveringen/)
└── memo/
    └── MemoDrawer.tsx      (bestaat, blijft)
```

**Eigendomsregel**: dialogen onder `components/<entiteit>/` zijn cross-page
property. Wijzigingen vereisen PO-afstemming, niet per pagina-agent.

**Server-action-regel**: entiteit-CRUD verhuist naar entiteit-action-bestanden:

```
apps/ti-studio-v2/src/actions/
├── speler-actions.ts        ← updateSpelerStatus, updateSpelerIndeling,
│                              updateGezienStatus, maakNieuweSpeler
├── staf-actions.ts          ← maakNieuweStaf, updateStaf
├── team-actions.ts          ← bewerkTeam (zodra die functie komt)
├── reservering-actions.ts   ← maakNieuweReservering
├── memo-actions.ts          ← bestaat al
└── werkbord/
    └── verplaats-speler.ts  ← bestaat al — werkbord-specifiek, blijft
```

Pagina-`actions.ts` mag alléén pagina-specifieke compositie bevatten
(zoek-filter-combinaties, batch-acties). Geen entiteit-CRUD.

**Import-richting**: pagina's importeren uit `components/<entiteit>/` en
`actions/<entiteit>-actions.ts`. Nooit andersom — een entiteit-component
mag niet importeren uit een pagina-tree.

## Refactor-stappen

Eén agent, scherp afgebakend, geen logica-wijziging.

### Stap 1 — Speler-tree consolideren

1. Vergelijk `components/speler/contexts/HoverKaart.tsx` (690 regels, gebruikt
   `SpelerStatus`/`WerkitemStatus`-types uit `@oranje-wit/database`) met
   `components/personen/spelers/HoverKaartSpeler.tsx` (615 regels, gebruikt
   `SpelerRijData` uit `@/components/personen/types`).
2. Kies `HoverKaart.tsx` als canon (gebruikt entiteit-types, niet
   pagina-types). Neem ontbrekende features uit `HoverKaartSpeler.tsx` over
   (bv. `sheenColor` in `LeeftijdThema`).
3. Verwijder `components/personen/spelers/HoverKaartSpeler.tsx`.
4. Verhuis:
   - `components/personen/spelers/SpelerDialog.tsx` → `components/speler/contexts/SpelerDialog.tsx`
   - `components/personen/spelers/NieuweSpelerDialog.tsx` → `components/speler/contexts/NieuweSpelerDialog.tsx`
5. Update `components/speler/contexts/index.ts` met exports.
6. Update alle imports in pagina-tree en `WerkbordShell.tsx`.

### Stap 2 — Staf-tree opzetten

1. Maak `components/staf/contexts/`.
2. Verhuis `HoverKaartStaf.tsx`, `StafDialog.tsx`, `NieuweStafDialog.tsx`.
3. Update imports.

### Stap 3 — Team-tree opzetten

1. Maak `components/team/contexts/`.
2. Verhuis `TeamDialog.tsx` uit `indeling/_components/`.
3. Update imports in werkbord. Personen-pagina zal hem later importeren
   (open punt §8 werkbord-spec daarmee beantwoord).

### Stap 4 — Reservering-tree opzetten

1. Maak `components/reservering/contexts/`.
2. Verhuis `NieuweReserveringDialog.tsx`.
3. Update imports.

### Stap 5 — Server actions herstructureren

1. Maak `apps/ti-studio-v2/src/actions/speler-actions.ts`.
2. Verhuis `updateSpelerStatus`, `updateSpelerIndeling`, `updateGezienStatus`,
   `maakNieuweSpeler` uit `(personen)/personen/actions.ts`.
3. Idem `staf-actions.ts` (maakNieuweStaf) en `reservering-actions.ts`
   (maakNieuweReservering).
4. Houd `(personen)/personen/actions.ts` over voor pagina-compositie (nu
   leeg of alleen `genId`-helper — overweeg te verwijderen).
5. Update alle imports.

### Stap 6 — Types-laag opschonen

1. `components/personen/types.ts` mag pagina-specifieke types houden (bv.
   `SpelerRijData` voor tabel-rendering).
2. Entiteit-types die door dialogen worden gebruikt: van pagina-types
   afhalen of nieuwe entiteit-types in `components/speler/types.ts` maken.

## Niet doen in deze refactor

- Geen wijziging aan dialoog-functionaliteit (geen nieuwe velden, geen
  nieuwe acties).
- Geen schema-wijziging.
- Geen styling-aanpassing — dialoog visueel pixel-identiek aan voor de
  refactor.
- Geen wijziging aan `MemoDrawer` — die zit al goed.
- Geen wijziging aan werkbord-eigen drawers (`SpelersPoolDrawer`,
  `StafPoolDrawer`, `TeamsDrawer`, `VersiesDrawer`, `TeamDetailDrawer`) —
  die zijn pagina-lokaal en horen bij werkbord.

## Acceptatiecriteria

1. `pnpm typecheck` schoon in apps/ti-studio-v2.
2. `pnpm lint` introduceert geen nieuwe errors.
3. Visuele check via Playwright MCP: personen-pagina (spelers/staf/
   reserveringen) en werkbord renderen identiek aan voor de refactor.
4. Eén bestand per onderwerp: `grep -r "HoverKaartSpeler\|HoverKaart" src/`
   geeft één definitie.
5. Pagina `(personen)/personen/actions.ts` bevat geen entiteit-CRUD meer.
6. Werkbord-import voor `SpelerDialog` wijst naar `@/components/speler/contexts/SpelerDialog`.

## Daarna

Pas wanneer deze refactor klaar is, mogen Fase 1b-agents (personen, werkbord)
parallel functionaliteit-laag uitbouwen zonder de dialoog-canon te schenden.
Zie [realisatieplan §3 Fase 1](2026-05-08-ti-studio-v2-realisatie-plan.md)
voor de spelregels.
