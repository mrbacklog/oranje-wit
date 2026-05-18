---
paths:
  - "apps/ti-studio-v2/**"
---

# Dialoog-canon TI Studio v2

**Eén code-werkelijkheid per entiteit-dialoog/hover-kaart.** Geen dubbele
implementaties, geen pagina-lokale varianten van cross-page componenten.

## Canon — entiteit, niet pagina

Cross-page dialogen en hover-kaarten leven onder **entiteit**, niet onder
pagina:

```
apps/ti-studio-v2/src/components/
├── speler/contexts/      ← SpelerDialog, HoverKaart, NieuweSpelerDialog
├── staf/contexts/        ← StafDialog, HoverKaartStaf, NieuweStafDialog
├── team/contexts/        ← TeamDialog
├── reservering/contexts/ ← NieuweReserveringDialog
└── memo/                 ← MemoDrawer
```

Server-action-laag idem:

```
apps/ti-studio-v2/src/actions/
├── speler-actions.ts        ← updateSpelerStatus, updateSpelerIndeling, …
├── staf-actions.ts
├── team-actions.ts
├── reservering-actions.ts
├── memo-actions.ts
└── werkbord/                ← werkbord-specifiek (verplaatsSpeler) — blijft
```

## Verboden

1. **Geen entiteit-dialoog of hover-kaart in een pagina-tree.** Dus geen
   `(personen)/personen/.../SpelerDialog.tsx` of
   `indeling/_components/TeamDialog.tsx`. Hoort onder `components/<entiteit>/`.
2. **Geen tweede variant van een bestaand onderwerp.** Bestaat
   `components/speler/contexts/HoverKaart.tsx`? Dan geen `HoverKaartSpeler.tsx`
   ernaast. Uitbreiden van de canon, niet dupliceren.
3. **Geen entiteit-CRUD in een pagina-`actions.ts`.** Pagina-actions zijn voor
   pagina-compositie (zoek-filter-combinaties), niet voor
   `updateSpelerStatus` / `maakNieuweSpeler` / etc.
4. **Geen import-richting van entiteit naar pagina.** Een component onder
   `components/<entiteit>/` mag niet importeren uit `app/(app)/(<pagina>)/`.

## Toegestaan

- **Werkbord-eigen drawers** (`SpelersPoolDrawer`, `StafPoolDrawer`,
  `TeamDetailDrawer`, `TeamsDrawer`, `VersiesDrawer`) onder
  `apps/(app)/(studio)/indeling/_components/` — die zijn pagina-lokaal en
  horen bij werkbord. Niet cross-page.
- **Pagina-specifieke types** (bv. `SpelerRijData` voor de personen-tabel)
  onder `components/personen/types.ts` — pagina-data-shape is geen
  entiteit-component.

## Bij twijfel

Wordt het component (of zou het) door **meer dan één pagina** gebruikt worden?
Dan hoort het onder `components/<entiteit>/contexts/`. Eén pagina + nooit
elders verwacht? Dan mag het pagina-lokaal.

## Voor agents

- **Voordat je een nieuw `*Dialog.tsx` of `HoverKaart*.tsx` aanmaakt**: doe een
  `grep -r "naam-van-onderwerp" apps/ti-studio-v2/src/components/` om te
  controleren of er al een canon bestaat. Zo ja: uitbreiden, niet dupliceren.
- Pagina-agents importeren entiteit-dialogen — wijzigen ze niet zonder
  PO-afstemming.
- Refactor-plan: zie
  `docs/superpowers/specs/2026-05-18-dialoog-consolidatie-v2.md`.
