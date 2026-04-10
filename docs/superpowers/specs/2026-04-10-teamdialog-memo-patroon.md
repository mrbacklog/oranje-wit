# TeamDialog + Uniform Memo-patroon — Design Spec

**Datum:** 2026-04-10  
**Status:** Goedgekeurd  
**Scope:** TI Studio werkbord + kaders-pagina + nieuw `/ti-studio/memo` route

---

## Samenvatting

We voegen een `TeamDialog` toe aan het werkbord — een volledige teamweergave die opent via een klik op de teamtitel. Tegelijkertijd introduceren we een **uniform memo-patroon** dat platformbreed wordt toegepast op teams, spelers, doelgroepen en TC.

---

## 1. TeamDialog

### Trigger
- **Klik op teamtitel** in de TeamKaart (normaal/detail mode) → opent `TeamDialog`
- De bestaande ≡-knop (validatie-stip) blijft het rechter TeamDrawer-panel openen

### Component
- Nieuw bestand: `apps/web/src/components/ti-studio/TeamDialog.tsx`
- Vervangt `TeamoverzichtDialog` volledig in de TI Studio werkbord context
- `TeamoverzichtDialog` blijft bestaan voor de legacy scenario-editor (`EditorOverlays.tsx`)

### Props
```ts
interface TeamDialogProps {
  teamId: string | null   // null = dialog gesloten
  team: WerkbordTeam | null
  validatie: WerkbordValidatieItem[]
  onClose: () => void
  onMemoSaved: (teamId: string, notitie: string, memoStatus: "open" | "gesloten", besluit: string | null) => void
}
```

### Tabs

#### Tab 1: Overzicht (read-only)
- Gebaseerd op de **normaal/detail mode** van `TeamKaart` — zelfde visuele opbouw
- **Read-only**: geen drag-drop, geen drop-zones, geen bundeling-toggle
- Toont: dames-kolom + heren-kolom met spelerrijen (via `TeamKaartSpelerRij` zonder drag-handlers)
- Voor selectie-teams (gebundeld): toont selectieDames + selectieHeren boven de teamlijst
- Footer: USS score + gem. leeftijd + totaal spelers
- Visuele details (avatars, kleuren, spacing) worden afgestemd met UX designer op basis van bestaand design system

#### Tab 2: Validatie (read-only)
- Toont `WerkbordValidatieItem[]` gefilterd op `teamId`
- Per item: icoon (✓/⚠/✗) + regel + beschrijving + laag-badge (KNKV / TC)
- Gesorteerd: err eerst, dan warn, dan ok
- Lege staat: "Geen validatiemeldingen — alles in orde"

#### Tab 3: Memo
- Zie uniform memo-component (sectie 2)

### Header
- Kleurband (teamkleur gradient)
- Teamnaam + alias
- Categorie + formaat
- Badges: ♀ N · ♂ N · validatie-indicator · ▲ als memo open
- Sluitknop

### Integratie TiStudioShell
```ts
// Nieuw state
const [dialogTeamId, setDialogTeamId] = useState<string | null>(null)

// TeamKaart krijgt nieuwe prop
onTitelKlik?: (teamId: string) => void

// Handler
const openTeamDialog = useCallback((teamId: string) => {
  setDialogTeamId(teamId)
}, [])
```

---

## 2. Uniform Memo-component

### Concept
Een memo is een actiepunt gekoppeld aan een entiteit:
- **Open**: er is nog een actie nodig → indicator zichtbaar op de entiteitskaart
- **Gesloten**: actiepunt is afgehandeld, besluit is vastgelegd → geen indicator

### Data model (per entiteit)
```ts
interface MemoData {
  notitie: string
  memoStatus: "open" | "gesloten"
  besluit: string | null   // ingevuld bij sluiten
}
```

### Component `MemoPanel`
- Nieuw bestand: `apps/web/src/components/ti-studio/MemoPanel.tsx`
- Herbruikbaar op: TeamDialog, SpelerProfielDialog, KadersPage

```tsx
interface MemoPanelProps {
  memo: MemoData
  onSave: (data: MemoData) => Promise<void>
  opslaanBezig?: boolean
}
```

#### States

**Open:**
- Oranje header: "Open — actie vereist" + knop "✓ Sluiten met besluit"
- Tekstveld `notitie` (bewerkbaar)
- Opslaan-knop

**Sluiten flow:**
- Na klik "Sluiten met besluit": besluit-tekstveld verschijnt
- Bevestigen slaat op met `memoStatus: "gesloten"`

**Gesloten:**
- Grijs header: "Gesloten — besluit genomen" + knop "↩ Heropenen"
- Tekstveld `notitie` (read-only)
- Groen besluit-blok (read-only)
- Heropenen reset `memoStatus` naar `"open"`, wist besluit

### Indicator
**Vorm:** driehoek ▲ — NIET stip ● (● is al in gebruik voor spelerstatus: groen/geel/rood)

| Context | Locatie indicator |
|---|---|
| TeamKaart | Rechterbovenhoek, oranje ▲ bij open memo |
| SpelerRij (in TeamDialog / pool) | Naast de naam, klein oranje ▲ |
| KadersPage doelgroep-rij | Inline naast doelgroep-naam |
| Memo-overzichtspagina | Linkerkolom als statusicoon |

Gesloten memo: geen indicator (▲ verdwijnt)

---

## 3. DB Migratie

### Team model (nieuw)
```prisma
model Team {
  // ...bestaande velden...
  notitie    String?  @db.Text
  memoStatus String   @default("gesloten")
  besluit    String?  @db.Text
}
```

### Speler model (uitbreiding)
```prisma
model Speler {
  // ...bestaande velden (notitie bestaat al)...
  memoStatus String   @default("gesloten")
  besluit    String?  @db.Text
}
```

### WerkbordTeam type (uitbreiding)
```ts
interface WerkbordTeam {
  // ...bestaande velden...
  memoStatus: "open" | "gesloten"
  notitie: string | null   // was al aanwezig
  besluit: string | null
}
```

---

## 4. Server Actions

### Team memo
```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-actions.ts
updateTeamMemo(teamId: string, data: MemoData): Promise<void>
```

### Speler memo (update bestaande)
```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts
updateSpelerMemo(spelerId: string, data: MemoData): Promise<void>
// vervangt updateSpelerNotitie
```

### Doelgroep memo
```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/memo-actions.ts
updateDoelgroepMemo(doelgroep: string, data: MemoData): Promise<void>
updateTcMemo(data: MemoData): Promise<void>
```

---

## 5. Kaders-pagina uitbreiding

Nieuwe sectie onderaan de kaders-pagina:

**Doelgroep-memos**: een rij per doelgroep (Kweekvijver, Opleidingshart, Korfbalplezier, Wedstrijdsport, Topsport), elk met `MemoPanel` inline.

**TC-memo**: één `MemoPanel` voor algemene TC-actiepunten.

Opgeslagen in een nieuw model of als JSON in het bestaande `Kaders` model — te bepalen bij implementatie op basis van Prisma schema analyse.

---

## 6. Memo overzichtspagina

**Route:** `/ti-studio/memo`  
**Navigatie:** Secundaire route (niet in 4+1 bottom nav), bereikbaar via link in de TI Studio sidebar/ribbon of direct URL.

### Functie
Overzicht van alle open en gesloten memo's in het systeem, gefilterd en gesorteerd.

### Layout
- Stats-balk: aantal open / gesloten / totaal
- Filter-balk: Open | Gesloten | Alle types | Teams | Spelers | Kaders
- Lijst: per memo-item → ▲ indicator + entiteitstype-badge + entiteitsnaam + memo-tekst preview + besluit (bij gesloten) + datum + "Openen →" knop
- "Openen →" navigeert naar de bijbehorende entiteit (opent dialog of scrollt naar pagina-sectie)

### Data
Server component — haalt alle memo's op via Prisma:
- Teams met `memoStatus` en `notitie` niet null
- Spelers met `memoStatus` en `notitie` niet null
- Doelgroep-/TC-memos uit Kaders model

---

## 7. UX afstemming

De volgende visuele elementen worden afgestemd met de UX designer vóór implementatie:
- Avatar-stijl in spelerrijen (consistent met design system)
- Kleurengebruik TeamKaart header in dialog-context
- Exacte positie en grootte van ▲ indicator per context
- Besluit-blok styling (kleur, typografie)
- Tabs-component (overnemen van SpelerProfielDialog of uitbreiden naar gedeelde component)

---

## 8. Bestandsoverzicht

| Bestand | Actie |
|---|---|
| `components/ti-studio/TeamDialog.tsx` | Nieuw |
| `components/ti-studio/MemoPanel.tsx` | Nieuw (herbruikbaar) |
| `components/ti-studio/werkbord/TeamKaart.tsx` | Uitbreiden: `onTitelKlik` prop + ▲ indicator |
| `components/ti-studio/werkbord/TiStudioShell.tsx` | Uitbreiden: `dialogTeamId` state + `openTeamDialog` |
| `components/ti-studio/SpelerProfielDialog.tsx` | Memo tab → MemoPanel component |
| `app/(teamindeling-studio)/ti-studio/indeling/memo-actions.ts` | Nieuw |
| `app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts` | `updateSpelerMemo` toevoegen |
| `app/(teamindeling-studio)/ti-studio/kaders/memo-actions.ts` | Nieuw |
| `app/(teamindeling-studio)/ti-studio/kaders/page.tsx` | Doelgroep + TC memo sectie |
| `app/(teamindeling-studio)/ti-studio/memo/page.tsx` | Nieuw |
| `packages/database/prisma/schema.prisma` | Team + Speler model uitbreiden |
| `components/ti-studio/index.ts` | TeamDialog exporteren |

---

## Buiten scope

- TC- en Doelgroep-dialogs (los van memo) — later
- Memo-notificaties of push-alerts
- Memo-history / versioning
- Mobiele weergave van TeamDialog (desktop-only component)
