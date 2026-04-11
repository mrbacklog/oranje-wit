# Memo-systeem: volledig frontend — spec

**Datum:** 2026-04-11
**Status:** Goedgekeurd door Antjan

---

## Samenvatting

Afronding van het memo-systeem in TI Studio. Het kanban bord bestaat al (`/ti-studio/memo/`) maar is onbereikbaar en heeft geen invoer-UX. Dit design voegt de ontbrekende schakels toe: Ribbon-navigatie, ▲ indicatoren op kaarten, memo-secties op de kader-pagina, en een volledig uitgewerkte detail-drawer met chat-tijdlijn.

---

## Scope

### Wat valt erin

1. **Ribbon-knop + badge** — navigatie naar `/ti-studio/memo/` met open-count
2. **▲ indicator op TeamKaart en SpelerRij** — zichtbaar als er open memo's zijn
3. **Kader-pagina memo's** — TC-algemeen + accordeon per doelgroep
4. **Kanban detail-drawer** — klik op kaart → slide-in panel
5. **Kanban filter-chips** — client-side filter op entiteit-type
6. **Chat-tijdlijn in drawer** — toelichtingen + systeem-events gecombineerd
7. **Schema-uitbreidingen** — `WerkitemToelichting` + `WerkitemLog` modellen

### Wat valt er niet in

- Aanmaken van memo's vanuit het kanban zelf (dat gaat via dialogs en kader-pagina)
- Mobile layout (TI Studio is desktop-only)
- Realtime updates / WebSocket

---

## 1. Ribbon-knop + badge

**Locatie:** `TiStudioPageShell.tsx` + `Ribbon.tsx`

### Gedrag

- Nieuw clipboard-icoon in de Ribbon, onder een dunne scheidingslijn na "Personen"
- Oranje badge (getal) zichtbaar bij `openCount > 0` — telt werkitems met status `OPEN` of `IN_BESPREKING` van type `MEMO`
- Badge verdwijnt bij 0
- Active state (oranje accent-bar links) bij route `/ti-studio/memo`

### Technisch

- `TiStudioPageShell` haalt `openMemoCount` op via een nieuwe server action `getOpenMemoCount(kadersId)` bij mount
- `Ribbon` props uitbreiden: `onNaarMemo: () => void` + `openMemoCount: number`
- `TiStudioPageShell` voegt toe: `onNaarMemo={() => router.push("/ti-studio/memo")}`
- Hervalidatie werkt al via `revalidatePath("/ti-studio/memo")` in `werkitem-actions.ts`

---

## 2. ▲ Indicator op TeamKaart en SpelerRij

**Locatie:** `TeamKaart.tsx`, `TeamKaartSpelerRij.tsx`, `indeling/page.tsx`

### Gedrag

- Oranje ▲ rechtsbovenin de TeamKaart-header
- Oranje ▲ rechts in elke `TeamKaartSpelerRij` (speler binnen een team)
- Zichtbaar als `openMemoCount > 0`
- Verdwijnt als er geen open memo's zijn (geen lege ruimte)

### Technisch

- Server laadt bij werkbord-init open memo-counts via één extra query: `prisma.werkitem.groupBy({ by: ['teamId'], where: { type: 'MEMO', status: { in: ['OPEN', 'IN_BESPREKING'] }, kadersId } })`
- Aparte query voor spelers: zelfde patroon met `spelerId`
- Counts worden meegegeven in `initieleState` als `openMemoCountPerTeam: Record<string, number>` en `openMemoCountPerSpeler: Record<string, number>`
- `TeamKaart` krijgt `openMemoCount?: number`; `TeamKaartSpelerRij` krijgt eveneens `openMemoCount?: number`

---

## 3. Kader-pagina memo's

**Locatie:** `KaderView.tsx`, nieuw `DoelgroepMemoSectie.tsx`

### Layout

- Onderaan de bestaande KaderView content, na een `<hr>`-scheidingslijn
- **TC-algemeen sectie** — header met "TC — Algemeen" + open-count badge + "+ Memo" knop; toont `WerkitemPanel` met `doelgroep: "ALLE"`
- **Doelgroep-accordeons** — 5 secties (één per doelgroep), elk inklapbaar; header toont doelgroepnaam, teams/leeftijden, en ▲ N als er open memo's zijn; ingeklapt tenzij er open memo's zijn

### Doelgroep-mapping (schema → TC-term)

| Schema (`Doelgroep` enum) | TC-term in UI |
|---|---|
| `KWEEKVIJVER` | Kweekvijver |
| `ONTWIKKELHART` | Opleidingshart |
| `TOP` | Topsport |
| `WEDSTRIJDSPORT` | Wedstrijdsport |
| `KORFBALPLEZIER` | Korfbalplezier |

### Technisch

- TC-algemeen: `createWerkitem({ doelgroep: "ALLE", entiteit: null, ... })`
- Per doelgroep: `createWerkitem({ doelgroep: "TOPSPORT", entiteit: null, ... })`
- `WerkitemPanel` uitbreiden met `doelgroep?: string` prop — wordt doorgegeven aan `createWerkitem`
- Nieuwe server action `getKaderMemos(kadersId)` laadt alle MEMO-werkitems gegroepeerd per doelgroep
- Accordeon-state: lokale `useState<Set<string>>` in `KaderView`, geen URL-state
- Geen schema-wijziging nodig — `doelgroep` veld bestaat al op `Werkitem`

---

## 4. Kanban detail-drawer

**Locatie:** `KanbanBord.tsx` (uitbreiden) + nieuw `MemoDrawer.tsx`

### Gedrag

- Klik op kanban-kaart → drawer slide-in vanuit rechts (320px breed)
- Semi-transparante overlay achter de drawer; klik buiten = sluiten
- Escape sluit ook
- Drawer-inhoud (van boven naar beneden):
  1. **Header** — entiteit-badge (Team/Speler/Doelgroep/TC) + entiteitnaam + sluit-knop
  2. **Beschrijving** — editable textarea
  3. **Prioriteit + Status** — twee selects naast elkaar + Opslaan-knop
  4. **Resolutie** — editable textarea, alleen zichtbaar bij status `OPGELOST` of `GEACCEPTEERD_RISICO`
  5. **Tijdlijn** (zie §5) — invoervak + scrollbare tijdlijn
  6. **Footer** — Verwijder-knop

### Technisch

- Bewerken via `updateWerkitemInhoud` (al aanwezig)
- Status-wijziging via `updateWerkitemStatus` (al aanwezig)
- Kanban-kaart krijgt `onClick` handler die `geselecteerdId` state zet
- `MemoDrawer` is een apart component (geen modal, wel overlay), gerenderd naast het kanban bord

---

## 5. Chat-tijdlijn in drawer

**Locatie:** `MemoDrawer.tsx` + nieuw `WerkitemTijdlijn.tsx`

### Gedrag

- Invoerveld bovenaan de tijdlijn (auteur-avatar + textarea + verzend-knop)
- Enter = verzenden, Shift+Enter = nieuwe regel
- Tijdlijn eronder: vaste hoogte 220px, eigen scroll, nieuwste bericht bovenaan
- **Gebruikersberichten** (WerkitemToelichting): chat-bubble stijl — avatar links, naam + timestamp, tekst
- **Systeem-events** (WerkitemLog): subtiele horizontale scheidingslijn met tekst — `"Naam → nieuwe status · tijdstip"`
- Beide gesorteerd op timestamp DESC, gecombineerd in één array client-side
- Nieuw bericht: optimistisch prepend bovenaan

### Technisch

- Nieuwe server action: `createToelichting(werkitemId: string, tekst: string): Promise<ActionResult<WerkitemToelichtingData>>`
- `WerkitemLog`-entries worden automatisch aangemaakt door bestaande actions (status-wijziging, verwijderen, aanmaken)
- Drawer laadt tijdlijn bij openen via include in kanban-query in `memo/page.tsx`: bestaande `prisma.werkitem.findMany` uitbreiden met `include: { toelichtingen: { orderBy: { timestamp: 'desc' } }, activiteiten: { orderBy: { timestamp: 'desc' } } }`

---

## 6. Kanban filter-chips

**Locatie:** `KanbanBord.tsx`

### Gedrag

- Filter-chips bovenaan het kanban bord: **Alles | Team | Speler | Doelgroep | TC-algemeen**
- Actieve chip: oranje accent, rest: neutraal
- Client-side filter op de bestaande `items` state — geen herlaad

### Filter-logica

| Chip | Conditie |
|---|---|
| Alles | geen filter |
| Team | `item.teamId !== null` |
| Speler | `item.spelerId !== null` |
| Doelgroep | `item.doelgroep !== null && item.doelgroep !== 'ALLE'` |
| TC-algemeen | `item.doelgroep === 'ALLE'` |

---

## 7. Schema-uitbreidingen

Twee nieuwe modellen, één Prisma-migratie:

```prisma
model WerkitemToelichting {
  id          String   @id @default(cuid())
  werkitem    Werkitem @relation(fields: [werkitemId], references: [id], onDelete: Cascade)
  werkitemId  String
  auteurNaam  String
  auteurEmail String
  tekst       String   @db.Text
  timestamp   DateTime @default(now())

  @@index([werkitemId])
}

model WerkitemLog {
  id          String    @id @default(cuid())
  werkitem    Werkitem  @relation(fields: [werkitemId], references: [id], onDelete: Cascade)
  werkitemId  String
  auteurNaam  String
  auteurEmail String
  actie       LogActie
  detail      String?
  timestamp   DateTime  @default(now())

  @@index([werkitemId])
}

enum LogActie {
  AANGEMAAKT
  BEWERKT
  STATUS_GEWIJZIGD
  OPGELOST
  GEARCHIVEERD
}
```

Terugrelaties toevoegen aan `Werkitem`:
```prisma
toelichtingen WerkitemToelichting[]
activiteiten  WerkitemLog[]
```

---

## Bestaande code die ongewijzigd blijft

- `werkitem-actions.ts` — server actions voor create/update/delete (alleen logging toevoegen)
- `WerkitemPanel.tsx` — alleen kleine uitbreiding (`doelgroep` prop)
- `KanbanBord.tsx` layout — lanes en drag-drop blijven intact
- `TeamDialog.tsx` / `SpelerProfielDialog.tsx` — ongewijzigd

---

## Nieuwe bestanden

| Bestand | Inhoud |
|---|---|
| `components/ti-studio/MemoDrawer.tsx` | Detail-drawer component |
| `components/ti-studio/WerkitemTijdlijn.tsx` | Chat-tijdlijn (toelichtingen + log) |
| `components/ti-studio/DoelgroepMemoSectie.tsx` | Accordeon-secties voor kader-pagina |
| `ti-studio/indeling/toelichting-actions.ts` | `createToelichting` server action |
| `ti-studio/indeling/log-actions.ts` | `createLog` helper (intern) |

---

## Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `Ribbon.tsx` | `onNaarMemo` prop + badge + clipboard-icoon |
| `TiStudioPageShell.tsx` | `onNaarMemo` callback + `openMemoCount` ophalen |
| `KanbanBord.tsx` | Filter-chips + `onClick` → drawer + tijdlijn data |
| `KaderView.tsx` | TC-algemeen sectie + `DoelgroepMemoSectie` |
| `WerkitemPanel.tsx` | `doelgroep?: string` prop |
| `werkitem-actions.ts` | Log-entry aanmaken bij elke mutatie |
| `indeling/page.tsx` | Open memo-counts laden in `initieleState` |
| `TeamKaart.tsx` | `openMemoCount?: number` prop + ▲ indicator |
| `TeamKaartSpelerRij.tsx` | `openMemoCount?: number` prop + ▲ indicator |
| `packages/database/prisma/schema.prisma` | `WerkitemToelichting`, `WerkitemLog`, `LogActie` |
