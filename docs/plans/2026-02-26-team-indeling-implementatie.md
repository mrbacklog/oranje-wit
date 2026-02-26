# Team-Indeling Redesign — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** State-of-the-art drag-and-drop teamindelingstool voor c.k.v. Oranje Wit, waarmee de TC alle teams voor het volgende seizoen kan indelen via een drieluik-interface.

**Architecture:** Next.js 16 app binnen de bestaande monorepo (`apps/team-indeling/`). Businesslogica (`src/lib/`) wordt behouden. UI wordt volledig nieuw gebouwd met een drieluik-layout (navigator | werkgebied | spelerspool). Procesflow: Blauwdruk → Scenario's → Definitief. Gedeelde PostgreSQL op Railway via `@oranje-wit/database`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, dnd-kit, Prisma (gedeeld), Claude API, NextAuth.js

**Design Document:** `docs/plans/2026-02-26-team-indeling-redesign.md`

---

## Task 1: Opschonen en fundament

Verwijder prototypes, configureer Next.js correct, maak de basis-layout met navigatie.

**Files:**
- Delete: `src/app/page.tsx` (statische wireframe)
- Delete: `src/app/blauwdruk/page.tsx` (prototype)
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (nieuw: redirect of dashboard)
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`

**Step 1: Verwijder prototypes**

Delete `src/app/page.tsx` en `src/app/blauwdruk/page.tsx`. Verwijder ook alle lege directories onder `src/app/` (concepten, scenarios, spelers, validatie, vergelijk, inkijk) en `src/components/` (blauwdruk, scenario, speler, team, ui) en `src/lib/claude/`, `src/lib/pin/`.

**Step 2: Configureer next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types"],
};

export default nextConfig;
```

**Step 3: Maak AppShell component**

Create `src/components/layout/AppShell.tsx`:
- Bevat de globale navigatie (sidebar links met routes: Blauwdruk, Scenario's, Definitief, Import)
- Huidige seizoen in header
- Main content area met `{children}`
- Tailwind: vaste sidebar (w-56), content neemt de rest

**Step 4: Maak Sidebar component**

Create `src/components/layout/Sidebar.tsx`:
- Logo/titel "Team-Indeling"
- Seizoen badge (bijv. "2026-2027")
- Navigatielinks met actieve state highlighting
- Gebruik `usePathname()` van `next/navigation`

**Step 5: Update layout.tsx**

Wrap children in `<AppShell>`. Behoud Geist fonts, `lang="nl"`, metadata.

**Step 6: Nieuwe homepage**

Create `src/app/page.tsx`:
- Simpel dashboard met status: laatste import, huidige blauwdruk, aantal scenario's
- Links naar de drie stappen
- Data ophalen via Server Component + Prisma

**Step 7: Verifieer**

Run: `pnpm dev:ti`
Expected: app start, navigatie zichtbaar, homepage toont status.

**Step 8: Commit**

```bash
git add apps/team-indeling/
git commit -m "refactor: opschonen prototypes en nieuw fundament Team-Indeling"
```

---

## Task 2: Blauwdruk — kaders en speerpunten

De blauwdruk-pagina waar de TC strategische kaders vastlegt.

**Files:**
- Create: `src/app/blauwdruk/page.tsx`
- Create: `src/app/blauwdruk/actions.ts` (Server Actions)
- Create: `src/components/blauwdruk/KadersEditor.tsx`
- Create: `src/components/blauwdruk/SpeerpuntenEditor.tsx`
- Create: `src/components/blauwdruk/ToelichtingEditor.tsx`

**Step 1: Server Actions voor blauwdruk**

Create `src/app/blauwdruk/actions.ts`:

```typescript
"use server";
import { prisma } from "@/lib/db/prisma";

// Haal de blauwdruk voor het huidige seizoen op, of maak een nieuwe aan
export async function getBlauwdruk(seizoen: string) { ... }

// Update kaders (JSON)
export async function updateKaders(blauwdrukId: string, kaders: Record<string, unknown>) { ... }

// Update speerpunten (string[])
export async function updateSpeerpunten(blauwdrukId: string, speerpunten: string[]) { ... }

// Update toelichting (string)
export async function updateToelichting(blauwdrukId: string, toelichting: string) { ... }
```

**Step 2: Blauwdruk pagina**

Create `src/app/blauwdruk/page.tsx` als Server Component:
- Haal blauwdruk op voor huidig seizoen (of maak een nieuwe)
- Render drie secties: Toelichting, Speerpunten, Kaders
- Kaders toont KNKV-regels en OW-voorkeuren als read-only referentie
- Toelichting en speerpunten zijn editable

**Step 3: KadersEditor component**

Create `src/components/blauwdruk/KadersEditor.tsx`:
- Client component ("use client")
- Toont KNKV-regels (uit `kaders.knkv` JSON) als leesbare lijst
- Toont OW-voorkeuren (uit `kaders.ow` JSON) als leesbare lijst
- Niet-editbaar: deze komen uit de import

**Step 4: SpeerpuntenEditor component**

Create `src/components/blauwdruk/SpeerpuntenEditor.tsx`:
- Client component
- Lijst van speerpunten met inline editing
- Toevoegen/verwijderen knoppen
- Auto-save via Server Action `updateSpeerpunten`

**Step 5: ToelichtingEditor component**

Create `src/components/blauwdruk/ToelichtingEditor.tsx`:
- Client component
- Textarea voor vrije tekst
- Auto-save (debounced) via Server Action

**Step 6: Verifieer**

Run: `pnpm dev:ti`, navigeer naar `/blauwdruk`.
Expected: pagina laadt, kaders uit DB tonen, speerpunten zijn editbaar, wijzigingen slaan op.

**Step 7: Commit**

```bash
git add apps/team-indeling/src/app/blauwdruk/ apps/team-indeling/src/components/blauwdruk/
git commit -m "feat: blauwdruk pagina met kaders, speerpunten en toelichting"
```

---

## Task 3: Blauwdruk — spelerstatus

Spelerstatus-overzicht in de blauwdruk: beschikbaar/twijfelt/stopt/nieuw per speler.

**Files:**
- Create: `src/components/blauwdruk/SpelerStatusOverzicht.tsx`
- Create: `src/components/blauwdruk/SpelerStatusBadge.tsx`
- Modify: `src/app/blauwdruk/actions.ts` (toevoegen: updateSpelerStatus)
- Modify: `src/app/blauwdruk/page.tsx` (sectie toevoegen)

**Step 1: SpelerStatusBadge component**

Create `src/components/blauwdruk/SpelerStatusBadge.tsx`:
- Props: `status: SpelerStatus`
- Visueel: gekleurde stip + label
  - BESCHIKBAAR → groen
  - TWIJFELT → oranje
  - GAAT_STOPPEN → rood
  - NIEUW → blauw

**Step 2: Server Action voor status**

Add to `actions.ts`:
```typescript
export async function updateSpelerStatus(spelerId: string, status: SpelerStatus) {
  await prisma.speler.update({ where: { id: spelerId }, data: { status } });
}
```

**Step 3: SpelerStatusOverzicht component**

Create `src/components/blauwdruk/SpelerStatusOverzicht.tsx`:
- Client component
- Tabel met alle spelers: naam, geboortejaar, geslacht, huidig team, status dropdown
- Filters: zoekbalk, filter op status, filter op kleur/categorie
- Status wijzigen via dropdown → Server Action
- Samenvatting bovenaan: X beschikbaar, Y twijfelt, Z stopt, W nieuw

**Step 4: Integreer in blauwdruk pagina**

Voeg `<SpelerStatusOverzicht>` toe aan `src/app/blauwdruk/page.tsx`.
Data: alle spelers uit DB met huidige status.

**Step 5: Verifieer**

Run: `pnpm dev:ti`, navigeer naar `/blauwdruk`.
Expected: spelerslijst zichtbaar, status wijzigbaar, samenvatting klopt.

**Step 6: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: spelerstatus-overzicht in blauwdruk"
```

---

## Task 4: Blauwdruk — twijfelpunten

Het cruciale concept: twijfelpunten vastleggen die in scenario's worden uitgespeeld.

**Files:**
- Create: `src/components/blauwdruk/TwijfelpuntenEditor.tsx`
- Modify: `src/app/blauwdruk/actions.ts`
- Modify: `src/app/blauwdruk/page.tsx`
- Modify: `packages/database/prisma/schema.prisma` (nieuw veld op Blauwdruk)

**Step 1: Schema uitbreiden**

Voeg toe aan het `Blauwdruk` model in `packages/database/prisma/schema.prisma`:

```prisma
twijfelpunten Json? // Array van { id, vraag, opties: string[] }
```

Run: `pnpm db:generate` en `pnpm db:push`.

**Step 2: Server Actions**

Add to `actions.ts`:
```typescript
interface Twijfelpunt {
  id: string;
  vraag: string;       // "Hoeveel U15-teams?"
  opties: string[];    // ["1 team", "2 teams"]
}

export async function updateTwijfelpunten(blauwdrukId: string, twijfelpunten: Twijfelpunt[]) { ... }
```

**Step 3: TwijfelpuntenEditor component**

Create `src/components/blauwdruk/TwijfelpuntenEditor.tsx`:
- Client component
- Lijst van twijfelpunten, elk met:
  - Vraagtekst (editable)
  - Opties als chips (toevoegen/verwijderen)
- "Nieuw twijfelpunt" knop
- Auto-save via Server Action

**Step 4: Integreer in blauwdruk pagina**

Voeg `<TwijfelpuntenEditor>` toe aan de blauwdruk-pagina.

**Step 5: Verifieer**

Run: `pnpm dev:ti`, navigeer naar `/blauwdruk`.
Expected: twijfelpunten toevoegen/bewerken/verwijderen werkt, opties flexibel.

**Step 6: Commit**

```bash
git add packages/database/ apps/team-indeling/src/
git commit -m "feat: twijfelpunten in blauwdruk"
```

---

## Task 5: Scenario — datamodel en basis

Scenario-aanmaak: kies waarden voor twijfelpunten, tool berekent teamstructuur.

**Files:**
- Create: `src/app/scenarios/page.tsx` (overzichtspagina)
- Create: `src/app/scenarios/[id]/page.tsx` (scenario-editor)
- Create: `src/app/scenarios/actions.ts`
- Create: `src/lib/teamstructuur.ts` (berekening)
- Modify: `packages/database/prisma/schema.prisma` (twijfelpuntKeuzes op Scenario)

**Step 1: Schema uitbreiden**

Voeg toe aan het `Scenario` model:

```prisma
twijfelpuntKeuzes Json? // { [twijfelpuntId]: gekozenOptie }
```

Run: `pnpm db:generate` en `pnpm db:push`.

**Step 2: Teamstructuur-calculator**

Create `src/lib/teamstructuur.ts`:

```typescript
interface TeamVoorstel {
  naam: string;          // "Rood-1", "U15-1", "Senioren 3"
  categorie: TeamCategorie;
  kleur: Kleur | null;
  format: "viertal" | "achttal";
  geschatAantal: number;
}

// Berekent optimale teamstructuur op basis van beschikbare leden
export function berekenTeamstructuur(
  spelers: SpelerData[],
  twijfelpuntKeuzes: Record<string, string>,
  kaders: Record<string, unknown>
): TeamVoorstel[]
```

Logica:
- Groepeer spelers per geboortejaar + geslacht
- Bereken op basis van kaders en twijfelpuntKeuzes hoeveel A-teams en B-teams
- Wijs kleuren toe op basis van gemiddelde leeftijd
- Senioren splitsen in A/B op basis van keuzes
- Retourneer lijst met voorgestelde teams

**Step 3: Server Actions**

Create `src/app/scenarios/actions.ts`:

```typescript
"use server";

// Maak nieuw scenario aan met twijfelpuntkeuzes
export async function createScenario(
  blauwdrukId: string,
  naam: string,
  toelichting: string,
  twijfelpuntKeuzes: Record<string, string>
) { ... }

// Haal scenario op met teams en spelers
export async function getScenario(id: string) { ... }

// Haal alle scenario's op voor een blauwdruk
export async function getScenarios(blauwdrukId: string) { ... }
```

**Step 4: Scenario-overzichtspagina**

Create `src/app/scenarios/page.tsx`:
- Lijst van bestaande scenario's met naam, status, aantal teams, validatiestatus
- "Nieuw scenario" knop → dialoog:
  - Naam invoeren
  - Per twijfelpunt een keuze maken (radio buttons)
  - Toelichting (optioneel)
  - "Aanmaken" → createScenario + redirect naar editor

**Step 5: Placeholder scenario-editor**

Create `src/app/scenarios/[id]/page.tsx`:
- Laadt scenario uit DB
- Toont voorlopig alleen de twijfelpuntkeuzes en een lijst van (lege) teams
- Het drieluik wordt in de volgende tasks gebouwd

**Step 6: Verifieer**

Run: `pnpm dev:ti`.
Expected: scenario's overzicht toont lijst, nieuw scenario aanmaken werkt, redirect naar editor.

**Step 7: Commit**

```bash
git add packages/database/ apps/team-indeling/src/
git commit -m "feat: scenario aanmaak met twijfelpuntkeuzes en teamstructuur-calculator"
```

---

## Task 6: Drieluik — Navigator (linkerpaneel)

Het linkerpaneel van de scenario-editor: team-navigator met checkboxes.

**Files:**
- Create: `src/components/scenario/Navigator.tsx`
- Create: `src/components/scenario/TeamGroep.tsx`
- Modify: `src/app/scenarios/[id]/page.tsx`

**Step 1: TeamGroep component**

Create `src/components/scenario/TeamGroep.tsx`:
- Props: `label: string`, `teams: Team[]`, `selected: Set<string>`, `onToggle: (teamId) => void`
- Render: heading + per team een checkbox met teamnaam en spelersaantal

**Step 2: Navigator component**

Create `src/components/scenario/Navigator.tsx`:
- Client component
- Props: `teams: Team[]`, `selectedTeamIds: Set<string>`, `onSelectionChange: (ids: Set<string>) => void`
- Groepeert teams dynamisch:
  - Jeugd B-categorie (per kleur: Blauw, Groen, Geel, Oranje, Rood)
  - Jeugd A-categorie (U15, U17, U19)
  - Senioren (genummerd, A/B label)
  - Overig (Recreanten, Midweek, Kangaroes)
- "Alles selecteren" / "Niets selecteren" per groep
- Scroll als lijst lang wordt (max-h met overflow-y-auto)

**Step 3: Integreer in scenario-editor**

Update `src/app/scenarios/[id]/page.tsx`:
- State: `selectedTeamIds: Set<string>`
- Layout: `<div className="flex h-screen">` met Navigator links (w-64)
- Content area (midden + rechts) bevat voorlopig placeholder

**Step 4: Verifieer**

Expected: navigator toont teams gegroepeerd, checkboxes werken, selectie is responsive.

**Step 5: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: team-navigator in scenario-editor"
```

---

## Task 7: Drieluik — Spelerspool (rechterpaneel)

Het rechterpaneel: zoekbare, filterbare lijst van alle spelers.

**Files:**
- Create: `src/components/scenario/SpelersPool.tsx`
- Create: `src/components/scenario/SpelerKaart.tsx`
- Create: `src/components/scenario/SpelerDetail.tsx` (dialoog)
- Create: `src/components/scenario/SpelerFilters.tsx`

**Step 1: SpelerKaart component**

Create `src/components/scenario/SpelerKaart.tsx`:
- Props: `speler: SpelerData` (uitgebreid met vorig team, status)
- Compact design:
  - Naam (roepnaam + achternaam)
  - Leeftijd (berekend op peildatum: 31 december seizoensjaar)
  - Geslacht icoon (♂/♀)
  - Vorig team (klein, grijs)
  - Status-bolletje (groen/oranje/rood/blauw)
- Draggable (dnd-kit `useDraggable`)
- onClick → opent SpelerDetail dialoog

**Step 2: SpelerDetail dialoog**

Create `src/components/scenario/SpelerDetail.tsx`:
- Modal/dialog met uitgebreide info:
  - Naam, geboortedatum, geslacht
  - Spelerspad (alle seizoenen: team, kleur, niveau)
  - Evaluaties (als beschikbaar)
  - Notities
  - Huidige status + status wijzigen
- Sluit met Escape of buiten klikken

**Step 3: SpelerFilters component**

Create `src/components/scenario/SpelerFilters.tsx`:
- Zoekbalk (naam)
- Radio buttons:
  - Zonder team (niet ingedeeld in dit scenario)
  - Passend bij geselecteerde teams (leeftijd/kleur match)
  - Al ingedeeld
  - Alle

**Step 4: SpelersPool component**

Create `src/components/scenario/SpelersPool.tsx`:
- Client component
- Props: `spelers: Speler[]`, `teams: Team[]`, `selectedTeamIds: Set<string>`
- Bevat `<SpelerFilters>` + scrollbare lijst van `<SpelerKaart>` items
- Filtert spelers op basis van gekozen filter + zoekterm
- "Passend" filter: berekent welke spelers qua leeftijd/geslacht passen bij de geselecteerde teams

**Step 5: Integreer in scenario-editor**

Update `src/app/scenarios/[id]/page.tsx`:
- SpelersPool rechts (w-80)
- Midden is nog placeholder

**Step 6: Verifieer**

Expected: spelerspool toont alle spelers, zoeken werkt, filters werken, detail-dialoog opent.

**Step 7: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: spelerspool met zoeken, filters en detail-dialoog"
```

---

## Task 8: Drieluik — Werkgebied met drag-and-drop

De kern: teamkaarten in het midden met dnd-kit drag-and-drop.

**Files:**
- Create: `src/components/scenario/Werkgebied.tsx`
- Create: `src/components/scenario/TeamKaart.tsx`
- Create: `src/components/scenario/TeamSpelerRij.tsx`
- Create: `src/components/scenario/DndContext.tsx`
- Create: `src/components/scenario/NieuwTeamDialoog.tsx`
- Modify: `src/app/scenarios/[id]/page.tsx`
- Modify: `src/app/scenarios/actions.ts`

**Step 1: DndContext wrapper**

Create `src/components/scenario/DndContext.tsx`:
- Wrap de hele scenario-editor in dnd-kit `<DndContext>` + `<DragOverlay>`
- Gebruik `closestCenter` collision detection
- Handle `onDragEnd`:
  - Speler van pool naar team → voeg toe
  - Speler van team naar team → verplaats
  - Speler van team naar pool → verwijder uit team
- Optimistic updates: state wijzigt direct, Server Action confirmt async

**Step 2: TeamKaart component**

Create `src/components/scenario/TeamKaart.tsx`:
- Props: `team: Team` (met spelers, staf, validatie)
- Droppable container (dnd-kit `useDroppable`)
- **Hele kaart is drop-zone**
- Toont:
  - Header: teamnaam + A/B badge + stoplicht-badge
  - Staf (trainer/coach namen)
  - Spelerslijst (draggable items)
  - Footer: gem. leeftijd (berekend), genderverdeling (X♂ Y♀), J-nummer indicatie
- Visuele feedback bij drag-over (highlight border)

**Step 3: TeamSpelerRij component**

Create `src/components/scenario/TeamSpelerRij.tsx`:
- Props: `speler: SpelerData`, `teamId: string`
- Draggable (dnd-kit `useDraggable`)
- Compact: naam + leeftijd + geslacht icoon + status bolletje
- Drag handle (grip icoon links)

**Step 4: Werkgebied component**

Create `src/components/scenario/Werkgebied.tsx`:
- Props: `teams: Team[]`, `selectedTeamIds: Set<string>`
- Responsive grid van `<TeamKaart>` voor geselecteerde teams
- "Nieuw team" knop → opent NieuwTeamDialoog

**Step 5: NieuwTeamDialoog**

Create `src/components/scenario/NieuwTeamDialoog.tsx`:
- Modal met formulier:
  - Teamnaam (tekst)
  - Categorie (dropdown: Senioren / A-categorie / B-categorie)
  - Kleur (dropdown, alleen bij B-categorie)
  - A/B classificatie (bij senioren)
- Submit → Server Action → nieuw team in DB

**Step 6: Server Actions uitbreiden**

Add to `src/app/scenarios/actions.ts`:

```typescript
// Voeg speler toe aan team
export async function addSpelerToTeam(teamId: string, spelerId: string) { ... }

// Verwijder speler uit team
export async function removeSpelerFromTeam(teamId: string, spelerId: string) { ... }

// Verplaats speler naar ander team
export async function moveSpeler(spelerId: string, vanTeamId: string, naarTeamId: string) { ... }

// Maak nieuw team aan in scenario
export async function createTeam(versieId: string, data: { naam, categorie, kleur?, ... }) { ... }

// Verwijder team
export async function deleteTeam(teamId: string) { ... }
```

**Step 7: Integreer alles**

Update `src/app/scenarios/[id]/page.tsx`:
- Wrap in `<DndContext>`
- Layout: Navigator (w-64) | Werkgebied (flex-1) | SpelersPool (w-80)
- State management: teams + spelers als React state, optimistic updates

**Step 8: Verifieer**

Run: `pnpm dev:ti`.
Expected: teams tonen in werkgebied, spelers zijn draggable, drop op team werkt, verplaatsen tussen teams werkt, terug naar pool werkt.

**Step 9: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: werkgebied met dnd-kit drag-and-drop"
```

---

## Task 9: Selecties koppelen

Twee teams verbinden als selectie: visueel één blok, gedeelde staf.

**Files:**
- Create: `src/components/scenario/SelectieBlok.tsx`
- Modify: `src/components/scenario/Werkgebied.tsx`
- Modify: `src/app/scenarios/actions.ts`
- Modify: `packages/database/prisma/schema.prisma` (selectie-relatie op Team)

**Step 1: Schema uitbreiden**

Voeg toe aan `Team` model:

```prisma
selectieGroepId String?
selectieGroep   Team?   @relation("SelectieGroep", fields: [selectieGroepId], references: [id])
selectieLeden   Team[]  @relation("SelectieGroep")
```

Run: `pnpm db:generate` en `pnpm db:push`.

**Step 2: SelectieBlok component**

Create `src/components/scenario/SelectieBlok.tsx`:
- Props: `teams: Team[]` (de gekoppelde teams)
- Visueel één blok met gedeelde header (selectienaam)
- Binnen het blok: per team een sub-sectie met eigen spelers
- Staf op selectieniveau tonen
- "Ontkoppel" knop

**Step 3: Server Actions**

Add:
```typescript
export async function koppelSelectie(teamIds: string[]) { ... }
export async function ontkoppelSelectie(selectieGroepId: string) { ... }
```

**Step 4: Werkgebied aanpassen**

Modify Werkgebied: als 2 teams zijn geselecteerd (checkbox), toon "Koppel als selectie" knop. Gekoppelde teams renderen als `<SelectieBlok>` in plaats van losse `<TeamKaart>`.

**Step 5: Verifieer**

Expected: 2 teams koppelen → worden visueel 1 blok. Ontkoppelen → weer los. Drag-drop werkt binnen selectie.

**Step 6: Commit**

```bash
git add packages/database/ apps/team-indeling/src/
git commit -m "feat: selecties koppelen in werkgebied"
```

---

## Task 10: Realtime validatie

Validatie-stoplicht per team, live bij elke drag-actie.

**Files:**
- Create: `src/components/scenario/ValidatieBadge.tsx`
- Create: `src/components/scenario/ValidatieMeldingen.tsx`
- Create: `src/hooks/useValidatie.ts`
- Modify: `src/components/scenario/TeamKaart.tsx`

**Step 1: useValidatie hook**

Create `src/hooks/useValidatie.ts`:

```typescript
import { valideerTeam, valideerDubbeleSpelersOverTeams, TeamData, TeamValidatie } from "@/lib/validatie/regels";

// Valideert alle teams in het scenario
// Returns: Map<teamId, TeamValidatie>
export function useValidatie(teams: TeamData[], seizoenJaar: number): Map<string, TeamValidatie>
```

- Herberekent bij elke teams-wijziging (useMemo)
- Inclusief dubbele-spelers check over alle teams
- Client-side: regels.ts draait in de browser

**Step 2: ValidatieBadge component**

Create `src/components/scenario/ValidatieBadge.tsx`:
- Props: `status: ValidatieStatus`
- Visueel: groen/oranje/rood cirkel met tooltip

**Step 3: ValidatieMeldingen component**

Create `src/components/scenario/ValidatieMeldingen.tsx`:
- Props: `meldingen: ValidatieMelding[]`
- Hover/click op ValidatieBadge → toont lijst meldingen
- Per melding: icoon (ernst) + tekst

**Step 4: J-nummer indicatie**

In `TeamKaart.tsx`: bereken gemiddelde leeftijd van alle spelers, toon als "~J12" indicatie. Dit is puur informatief.

**Step 5: Integreer**

Modify `TeamKaart.tsx`:
- ValidatieBadge in header
- Rode/oranje border bij ROOD/ORANJE status
- ValidatieMeldingen als popover

**Step 6: Drag-feedback**

Modify `DndContext.tsx`: bij drag-over berekent de validatie preview wat er zou veranderen als de speler wordt gedropt. Toon subtiele hint op de drop-zone (groen = OK, rood = overtreding).

**Step 7: Verifieer**

Expected: teams tonen stoplicht, meldingen bij hover, border kleurt mee, drag-preview hint.

**Step 8: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: realtime validatie met stoplicht en drag-feedback"
```

---

## Task 11: On-demand validatie-rapport

Uitgebreid validatierapport over alle teams.

**Files:**
- Create: `src/components/scenario/ValidatieRapport.tsx`
- Create: `src/components/scenario/ImpactOverzicht.tsx`
- Modify: `src/app/scenarios/[id]/page.tsx` (knop toevoegen)

**Step 1: ValidatieRapport component**

Create `src/components/scenario/ValidatieRapport.tsx`:
- Full-screen overlay/panel
- Per team: naam, status, meldingen
- Samenvatting bovenaan: X OK / Y aandacht / Z kritiek
- Dubbele spelers over teams heen
- Sorteer op ernst (kritiek eerst)

**Step 2: ImpactOverzicht component**

Create `src/components/scenario/ImpactOverzicht.tsx`:
- Gebruikt `berekenImpact()` uit `@/lib/validatie/impact`
- Per team: huidig / best case / verwacht / worst case
- Visueel: tabel of kaarten met kleurcodering

**Step 3: Integreer**

Voeg "Validatie-rapport" knop toe in scenario-editor toolbar. Opent ValidatieRapport als slide-over panel.

**Step 4: Verifieer**

Expected: rapport toont alle teams met meldingen, impact-analyse per team, samenvatting klopt.

**Step 5: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: on-demand validatierapport met impact-analyse"
```

---

## Task 12: Claude AI — startvoorstel

Claude genereert een eerste teamindeling op basis van blauwdruk + leden.

**Files:**
- Create: `src/app/api/ai/voorstel/route.ts`
- Create: `src/lib/ai/prompt.ts`
- Create: `src/components/scenario/VoorstelDialoog.tsx`
- Modify: `src/app/scenarios/[id]/page.tsx`

**Step 1: Prompt builder**

Create `src/lib/ai/prompt.ts`:

```typescript
// Bouwt een prompt voor Claude op basis van blauwdruk + spelersdata
export function buildVoorstelPrompt(
  blauwdruk: Blauwdruk,
  spelers: Speler[],
  twijfelpuntKeuzes: Record<string, string>,
  seizoenJaar: number
): string
```

De prompt bevat:
- KNKV-regels (samengevat)
- OW-voorkeuren (samengevat)
- Beschikbare spelers (naam, leeftijd, geslacht, vorig team, status)
- Twijfelpuntkeuzes (welke teams gewenst)
- Instructie: maak teams, wijs spelers toe, motiveer keuzes

**Step 2: API route**

Create `src/app/api/ai/voorstel/route.ts`:
- POST: ontvang scenarioId
- Laad blauwdruk + spelers + twijfelpuntKeuzes uit DB
- Bouw prompt via `buildVoorstelPrompt`
- Roep Claude API aan (streaming)
- Parse response: JSON met teamindeling
- Sla teams + spelers op in DB
- Return resultaat

**Step 3: VoorstelDialoog**

Create `src/components/scenario/VoorstelDialoog.tsx`:
- Knop "Genereer voorstel" in scenario-editor
- Toont loading state tijdens Claude-aanroep
- Na voltooiing: teams verschijnen in werkgebied

**Step 4: Configuratie-opties**

In het dialoog:
- Teamgrootte voorkeur (slider: minimaal ↔ maximaal)
- Prioriteiten per leeftijdsgroep (sociaal vs ontwikkeling vs prestatie)
- Deze worden meegegeven aan de prompt

**Step 5: Verifieer**

Expected: "Genereer voorstel" → Claude maakt indeling → teams verschijnen met spelers → validatie draait direct.

**Step 6: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: Claude AI startvoorstel voor teamindeling"
```

---

## Task 13: Claude AI — advies en what-if

Advies bij acties en what-if analyse.

**Files:**
- Create: `src/app/api/ai/advies/route.ts`
- Create: `src/app/api/ai/whatif/route.ts`
- Create: `src/components/scenario/AdviesPanel.tsx`
- Create: `src/components/scenario/WhatIfDialoog.tsx`

**Step 1: Advies API**

Create `src/app/api/ai/advies/route.ts`:
- POST: ontvang actie (speler X naar team Y), huidige scenario-staat
- Claude geeft korte feedback: risico's, alternatieven
- Streaming response

**Step 2: AdviesPanel**

Create `src/components/scenario/AdviesPanel.tsx`:
- Klein paneel onderaan of als sidebar
- Toont laatste advies van Claude
- Kan aan/uit gezet worden
- Triggert automatisch na elke verplaatsing (debounced)

**Step 3: What-if API**

Create `src/app/api/ai/whatif/route.ts`:
- POST: ontvang vraag ("Wat als speler X stopt?")
- Claude analyseert impact op alle teams
- Retourneert: getroffen teams, suggesties, herverdelingsplan

**Step 4: WhatIfDialoog**

Create `src/components/scenario/WhatIfDialoog.tsx`:
- Input: selecteer een speler of type een vraag
- Resultaat: overzicht van impact + suggesties
- "Pas toe" knop om suggesties over te nemen

**Step 5: Verifieer**

Expected: advies verschijnt na verplaatsing, what-if toont impact met suggesties.

**Step 6: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: Claude advies bij acties en what-if analyse"
```

---

## Task 14: Scenario-vergelijking

Side-by-side vergelijking van twee scenario's.

**Files:**
- Create: `src/app/vergelijk/page.tsx`
- Create: `src/components/vergelijk/ScenarioVergelijk.tsx`
- Create: `src/components/vergelijk/TeamDiff.tsx`

**Step 1: Vergelijkpagina**

Create `src/app/vergelijk/page.tsx`:
- Server Component
- URL params: `?a=scenarioIdA&b=scenarioIdB`
- Laadt beide scenario's met teams en spelers
- Rendert ScenarioVergelijk

**Step 2: ScenarioVergelijk component**

Create `src/components/vergelijk/ScenarioVergelijk.tsx`:
- Side-by-side layout
- Per team in scenario A → match met zelfde team in B
- Highlight spelers die verschillen (groen = alleen in dit scenario, rood = verplaatst)
- Statistieken: gem. leeftijd, teamgrootte, genderverdeling

**Step 3: TeamDiff component**

Create `src/components/vergelijk/TeamDiff.tsx`:
- Twee kolommen: Team in scenario A vs Team in scenario B
- Spelers die in beide zitten: normaal
- Spelers die alleen in A zitten: gemarkeerd
- Spelers die alleen in B zitten: gemarkeerd

**Step 4: Verifieer**

Expected: twee scenario's naast elkaar, verschillen zijn duidelijk zichtbaar.

**Step 5: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: scenario vergelijking side-by-side"
```

---

## Task 15: Definitief en export

Scenario definitief maken, besluitenlog, export.

**Files:**
- Create: `src/app/definitief/page.tsx`
- Create: `src/components/definitief/BesluitenLog.tsx`
- Create: `src/components/definitief/ExportPanel.tsx`
- Modify: `src/app/scenarios/actions.ts`

**Step 1: Scenario definitief markeren**

Add Server Action:
```typescript
export async function markeerDefinitief(scenarioId: string) {
  // Zet status op DEFINITIEF
  // Archiveer alle andere scenario's
}
```

**Step 2: Definitief-pagina**

Create `src/app/definitief/page.tsx`:
- Toont het definitieve scenario (als er een is)
- Overzicht van alle teams met spelers
- Validatierapport (alles moet groen zijn)
- BesluitenLog: tijdlijn van alle wijzigingen (uit LogEntry tabel)

**Step 3: BesluitenLog**

Create `src/components/definitief/BesluitenLog.tsx`:
- Tijdlijn van LogEntry records
- Per entry: datum, auteur, actie, details
- Filterable op team of type actie

**Step 4: ExportPanel**

Create `src/components/definitief/ExportPanel.tsx`:
- Export als CSV (per team: spelerslijst)
- Export als PDF (visueel overzicht)
- Print-friendly view

**Step 5: Verifieer**

Expected: scenario definitief markeren werkt, overzicht toont alle teams, export genereert bestanden.

**Step 6: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: definitief markeren, besluitenlog en export"
```

---

## Task 16: Auth (NextAuth)

TC-leden als editors, rest als viewers.

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Modify: `src/app/layout.tsx`
- Modify: relevante Server Actions (auth checks)

**Step 1: NextAuth configuratie**

Create `src/lib/auth.ts`:
- PrismaAdapter met het bestaande User model
- Provider: credentials of magic link (simpel voor 3 TC-leden)
- Rollen: EDITOR (TC), VIEWER (rest)

**Step 2: API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
- Standard NextAuth handler

**Step 3: Auth guards**

Modify Server Actions: check of gebruiker EDITOR rol heeft voor schrijfacties. Lees-acties zijn voor iedereen.

**Step 4: Layout aanpassen**

Wrap children in SessionProvider. Toon gebruikersnaam + rol in sidebar.

**Step 5: Verifieer**

Expected: login werkt, editors kunnen wijzigen, viewers kunnen alleen kijken.

**Step 6: Commit**

```bash
git add apps/team-indeling/src/
git commit -m "feat: NextAuth authenticatie met EDITOR/VIEWER rollen"
```

---

## Samenvatting bouwvolgorde

| # | Task | Kern |
|---|---|---|
| 1 | Fundament | Opschonen, layout, navigatie |
| 2 | Blauwdruk basis | Kaders, speerpunten, toelichting |
| 3 | Blauwdruk status | Spelerstatus-overzicht |
| 4 | Blauwdruk twijfel | Twijfelpunten |
| 5 | Scenario basis | Aanmaak, teamstructuur-calculator |
| 6 | Navigator | Linkerpaneel |
| 7 | Spelerspool | Rechterpaneel met filters |
| 8 | Werkgebied | **Drag-and-drop kern** |
| 9 | Selecties | Teams koppelen |
| 10 | Validatie live | Realtime stoplicht |
| 11 | Validatie rapport | On-demand rapport + impact |
| 12 | AI voorstel | Claude startvoorstel |
| 13 | AI advies | Advies + what-if |
| 14 | Vergelijking | Side-by-side scenarios |
| 15 | Definitief | Besluit + export |
| 16 | Auth | Login + rollen |

**Kritiek pad**: Tasks 1-8 moeten sequentieel. Tasks 9-16 kunnen deels parallel (agents).

**Parallel-kandidaten**:
- Task 10+11 (validatie) parallel met Task 9 (selecties)
- Task 12+13 (AI) parallel met Task 14 (vergelijking)
- Task 15 (definitief) en Task 16 (auth) parallel
