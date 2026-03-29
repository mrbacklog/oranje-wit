# TI Studio Dark Mode Migratie — Plan

**Datum**: 2026-03-29
**Auteur**: frontend (agent)
**Status**: Analyse & planning
**Scope**: `apps/web/src/app/(teamindeling-studio)/` + `apps/web/src/components/teamindeling/`

---

## 1. Samenvatting

TI Studio is het enige domein in de geconsolideerde app dat nog `data-theme="light"` gebruikt. Alle andere domeinen (Portaal, Beheer, Evaluatie, Monitor, Scouting) draaien op `data-theme="dark"`. De migratie behelst het vervangen van **1.002 hardcoded Tailwind-kleurklassen** in **87 bestanden** door design tokens uit `packages/ui/src/tokens/tokens.css`, plus het overschakelen van de layout naar `data-theme="dark"`.

Daarnaast bevatten de TI-componenten **579 semantische hardcoded kleurklassen** (orange, red, green, blue, etc.) die deels functioneel zijn (leeftijdskleuren, validatiestatus) en deels moeten migreren naar token-variabelen.

---

## 2. Inventarisatie

### 2.1 Totaalcijfers

| Categorie | `(teamindeling-studio)/` | `components/teamindeling/` | Totaal |
|---|---|---|---|
| `text-gray-*` | 54 | 446 | **500** |
| `bg-gray-*` | 10 | 109 | **119** |
| `bg-white` | 4 | 38 | **42** |
| `border-gray-*` | 9 | 120 | **129** |
| `hover:bg-gray-*` | 1 | 46 | **47** |
| `divide-gray-*` | 0 | 2 | **2** |
| `ring-gray-*` | 0 | 2 | **2** |
| `text-gray-* (subtotaal)` | - | - | **500** |
| **Grijs/wit/zwart subtotaal** | **78** | **763** | **841** |
| Semantisch hardcoded (orange, red, green, blue, amber, neutral, etc.) | 8 | 579 | **587** |
| **TOTAAL** | **86** | **1.342** | **1.428** |

> NB: Van de 587 semantische kleuren is een deel **functioneel** (leeftijdskleuren KNKV, validatiestatus, scenario-vergelijking). Deze moeten niet vervangen worden door surface/text tokens maar door de juiste semantische token-variabelen.

### 2.2 Top-varianten `text-gray-*` (componenten)

| Variant | Aantal | Token-vervanging |
|---|---|---|
| `text-gray-400` | 135 | `text-[var(--text-tertiary)]` |
| `text-gray-500` | 104 | `text-[var(--text-secondary)]` |
| `text-gray-700` | 83 | `text-[var(--text-primary)]` of `text-[var(--ow-zwart-700)]` |
| `text-gray-600` | 73 | `text-[var(--text-secondary)]` |
| `text-gray-900` | 40 | `text-[var(--text-primary)]` |
| `text-gray-800` | 28 | `text-[var(--text-primary)]` |
| `text-gray-300` | 11 | `text-[var(--text-tertiary)]` |
| `text-white` | 37 | `text-[var(--text-inverse)]` (of behouden in gradient-context) |

### 2.3 Top-varianten achtergrond/border

| Variant | Aantal | Token-vervanging |
|---|---|---|
| `border-gray-200` | 58 | `border-[var(--border-default)]` |
| `border-gray-100` | 34 | `border-[var(--border-light)]` |
| `border-gray-300` | 25 | `border-[var(--border-strong)]` |
| `bg-white` | 42 | `bg-[var(--surface-card)]` |
| `bg-gray-100` | 29 | `bg-[var(--surface-sunken)]` |
| `bg-gray-50` | 27 | `bg-[var(--surface-page)]` of `bg-[var(--surface-sunken)]` |
| `hover:bg-gray-100` | 19 | `hover:bg-[var(--state-hover)]` |
| `hover:bg-gray-50` | 16 | `hover:bg-[var(--state-hover)]` |
| `hover:bg-gray-200` | 11 | `hover:bg-[var(--state-pressed)]` |
| `bg-gray-400` | 6 | `bg-[var(--text-tertiary)]` (gebruikt als indicator) |
| `ring-gray-300` | 2 | `ring-[var(--border-strong)]` |
| `divide-gray-100` | 2 | `divide-[var(--border-light)]` |

### 2.4 Impact per feature-groep

| Groep | Bestanden | Hardcoded | Prioriteit |
|---|---|---|---|
| `scenario/` | 55 | 452 | HOOG - kern van de app |
| `blauwdruk/` | 18 | 273 | HOOG - dagelijks gebruikt |
| `scenarios/` (wizard, lijst) | 6 | 68 | MIDDEN |
| `werkbord/` | 7 | 45 | MIDDEN |
| `vergelijk/` | 2 | 31 | MIDDEN |
| `timeline/` | 2 | 23 | LAAG |
| `instellingen/` | 3 | 13 | LAAG |
| `dashboard/` | 2 | 10 | LAAG |
| `layout/` | 2 | 2 | LAAG (al bijna clean) |
| `ui/` | 3 | 2 | LAAG |
| `app/(teamindeling-studio)/` | 37 | 86 | MIDDEN |

### 2.5 Top-25 zwaarste bestanden

| # | Bestand | Hardcoded |
|---|---|---|
| 1 | `scenario/SpelerDetail.tsx` | 38 |
| 2 | `scenario/TeamEditPanel.tsx` | 37 |
| 3 | `blauwdruk/BesluitenOverzicht.tsx` | 32 |
| 4 | `scenario/ValidatieRapport.tsx` | 30 |
| 5 | `blauwdruk/LedenDashboard.tsx` | 29 |
| 6 | `scenarios/wizard-stappen.tsx` | 28 |
| 7 | `scenario/ScenarioWerkbordPanel.tsx` | 28 |
| 8 | `blauwdruk/GezienOverzicht.tsx` | 28 |
| 9 | `blauwdruk/UitgangspositiePanel.tsx` | 27 |
| 10 | `blauwdruk/CategorieKaart.tsx` | 27 |
| 11 | `scenario/view/ViewTeamKaart.tsx` | 26 |
| 12 | `scenario/SelectieBlok.tsx` | 26 |
| 13 | `blauwdruk/HerberekenDialoog.tsx` | 26 |
| 14 | `scenario/TeamKaart.tsx` | 25 |
| 15 | `scenario/view/ViewSelectieBlok.tsx` | 22 |
| 16 | `scenario/VerdeelDialoog.tsx` | 22 |
| 17 | `vergelijk/ScenarioVergelijk.tsx` | 21 |
| 18 | `blauwdruk/LedenSyncPreview.tsx` | 21 |
| 19 | `scenario/types.ts` | 20 |
| 20 | `timeline/ActivityTimeline.tsx` | 19 |
| 21 | `blauwdruk/LedenSyncDialoog.tsx` | 19 |
| 22 | `blauwdruk/PinsOverzicht.tsx` | 17 |
| 23 | `werkbord/WerkbordOverzicht.tsx` | 16 |
| 24 | `blauwdruk/CategorieSettingsDialog.tsx` | 16 |
| 25 | `scenario/KleurRangesInfo.tsx` | 15 |
| | `app/.../over/page.tsx` | 36 |
| | `app/.../scenarios/page.tsx` | 13 |
| | `app/.../vergelijk/page.tsx` | 11 |
| | `app/.../blauwdruk/categorie-kaders.ts` | 11 |

---

## 3. Mapping-tabel

### 3.1 Grijs-schaal (gray) naar tokens

De huidige code gebruikt Tailwind `gray-*` in een light context. Na de switch naar dark moeten deze worden vervangen door semantische tokens die automatisch schakelen.

| Huidige klasse | Semantische rol | Token-vervanging |
|---|---|---|
| **Tekst** | | |
| `text-gray-900` | Primaire tekst (koppen, labels) | `text-[var(--text-primary)]` |
| `text-gray-800` | Primaire tekst (body, zwaar) | `text-[var(--text-primary)]` |
| `text-gray-700` | Primaire/secundaire tekst | `text-[var(--text-primary)]` |
| `text-gray-600` | Secundaire tekst (sublabels) | `text-[var(--text-secondary)]` |
| `text-gray-500` | Secundaire tekst (muted) | `text-[var(--text-secondary)]` |
| `text-gray-400` | Tertiaire tekst (hints, placeholders) | `text-[var(--text-tertiary)]` |
| `text-gray-300` | Gedempte tekst / disabled | `text-[var(--text-disabled)]` |
| `text-white` | Inverse tekst (op donkere bg) | `text-[var(--text-inverse)]` * |
| **Achtergrond** | | |
| `bg-white` | Card/panel achtergrond | `bg-[var(--surface-card)]` |
| `bg-gray-50` | Pagina/sunken achtergrond | `bg-[var(--surface-sunken)]` |
| `bg-gray-100` | Sunken/secondary achtergrond | `bg-[var(--surface-sunken)]` |
| `bg-gray-200` | Hover-achtergrond of indicator | `bg-[var(--state-hover)]` |
| `bg-gray-300` | Sterker hover/indicator | `bg-[var(--state-pressed)]` |
| `bg-gray-400` | Status-indicator (inactief) | `bg-[var(--text-tertiary)]` |
| `bg-gray-500` | Status-indicator (neutraal) | `bg-[var(--text-secondary)]` |
| `bg-gray-600` | Donkere achtergrond | `bg-[var(--ow-zwart-600)]` |
| `bg-gray-700` | Donkere achtergrond | `bg-[var(--ow-zwart-700)]` |
| `bg-black` | Scrim/overlay | `bg-[var(--surface-scrim)]` of `bg-black` (bewust) |
| **Borders** | | |
| `border-gray-100` | Lichte border | `border-[var(--border-light)]` |
| `border-gray-200` | Standaard border | `border-[var(--border-default)]` |
| `border-gray-300` | Sterke border | `border-[var(--border-strong)]` |
| `border-gray-800` | Extra sterke border (dark) | `border-[var(--border-strong)]` |
| `divide-gray-100` | Lichte divider | `divide-[var(--border-light)]` |
| **Interactie** | | |
| `hover:bg-gray-50` | Hover state | `hover:bg-[var(--state-hover)]` |
| `hover:bg-gray-100` | Hover state | `hover:bg-[var(--state-hover)]` |
| `hover:bg-gray-200` | Pressed/active state | `hover:bg-[var(--state-pressed)]` |
| `ring-gray-300` | Focus ring | `ring-[var(--border-strong)]` |
| `ring-white` | Ring op donkere bg | `ring-[var(--surface-card)]` |
| **Focus** | | |
| `focus:ring-*` | Focus indicator | `focus:ring-[var(--border-focus)]` |
| `focus:border-*` | Focus border | `focus:border-[var(--border-focus)]` |

\* `text-white` op gradient-achtergronden (leeftijdskleuren) mag behouden blijven omdat die gradients altijd donker zijn.

### 3.2 Semantische kleuren

De 579 semantische hardcoded kleuren vallen in twee categorieen:

#### A. Functionele kleuren (BEHOUDEN met token-vervanging)

Deze kleuren drukken een **betekenis** uit en moeten vervangen worden door de juiste token:

| Patroon | Betekenis | Token-vervanging |
|---|---|---|
| `bg-orange-500/600`, `text-orange-*` | OW accent / oranje | `var(--ow-oranje-500)` t/m `var(--ow-oranje-700)` |
| `bg-red-500`, `text-red-600/700` | Error / gevaar / KNKV rood | `var(--color-error-*)` of `var(--knkv-rood-*)` |
| `bg-green-500`, `text-green-700` | Success / beschikbaar | `var(--color-success-*)` of `var(--knkv-groen-*)` |
| `bg-blue-*`, `text-blue-*` | Info / KNKV blauw | `var(--color-info-*)` of `var(--knkv-blauw-*)` |
| `bg-yellow-*`, `text-yellow-*` | Warning / KNKV geel | `var(--color-warning-*)` of `var(--knkv-geel-*)` |
| `bg-amber-*`, `text-amber-*` | Warning variant | `var(--color-warning-*)` |
| `bg-pink-*`, `text-pink-*` | Gender-indicator (V) | Bewuste keuze, via token |
| `bg-neutral-800` | Donkere UI-elementen | `var(--surface-raised)` |
| `text-neutral-200/400` | Tekst op donkere bg | `var(--text-primary)` / `var(--text-tertiary)` |

#### B. Kleur-constanten in `types.ts` (CENTRAAL PUNT)

Het bestand `scenario/types.ts` definieert kleur-constanten die door veel componenten worden ge-importeerd:

```typescript
// LEEFTIJDS_KLEUREN — nu: "bg-blue-400", "bg-yellow-400", etc.
// MOET WORDEN: "bg-[var(--knkv-blauw-400)]", etc.

// STATUS_KLEUREN — nu: "bg-green-500", "bg-orange-500", "bg-red-500"
// MOET WORDEN: "bg-[var(--color-success-500)]", etc.

// CATEGORIE_BADGE_KLEUREN — nu: "bg-blue-100 text-blue-700"
// MOET WORDEN: token-gebaseerde badge classes

// COMPETITIE_CATEGORIE_KLEUREN — nu: "bg-orange-100 text-orange-700"
// MOET WORDEN: token-gebaseerde classes
```

Dit bestand is een **force multiplier**: als je hier de constanten goed zet, krijg je gratis correcte kleuren in tientallen componenten die deze constanten importeren.

---

## 4. CSS-wijzigingen in `teamindeling.css`

### Huidige staat

Het bestand `teamindeling.css` (339 regels) is al grotendeels op tokens gebouwd. Dialogen, buttons, inputs, cards, badges en stat-elementen gebruiken `var(--surface-*)`, `var(--text-*)`, `var(--border-*)` tokens. Dit is positief nieuws.

### Wat moet veranderen

1. **Niets verwijderen** — de CSS-classes zijn al dark-compatible via tokens
2. **Header-commentaar aanpassen**: "WIT THEMA (light-only)" wordt misleidend na de migratie
3. **Controleer `btn-secondary`**: gebruikt `var(--ow-zwart-700)` voor tekst, wat in dark mode donkere tekst op donkere achtergrond geeft. Overweeg `var(--text-primary)` als vervanging
4. **Badge-kleuren**: gebruiken `var(--color-success-700)` op `var(--color-success-50)` — in dark mode moet de `*-50` variant donkerder zijn. Dit wordt al correct afgehandeld door de `[data-theme]` override in `tokens.css`

### Conclusie

`teamindeling.css` is GEEN blocker. Het bestand is al op tokens gebouwd en zal correct reageren op `data-theme="dark"` zodra de layout wordt omgeschakeld.

---

## 5. Layout-wijziging

### Enige wijziging in `layout.tsx`

```diff
- data-theme="light"
+ data-theme="dark"
```

Bestand: `apps/web/src/app/(teamindeling-studio)/layout.tsx`, regel 37.

De inline `style` op die div gebruikt al `var(--surface-page)` en `var(--text-primary)`, dus die zullen automatisch de juiste dark-waarden overnemen zodra het thema schakelt.

### TIDomainShell

Controleer `apps/web/src/components/teamindeling/layout/ti-domain-shell.tsx` of deze ook `theme="light"` doorgeeft aan de gedeelde `DomainShell`. Zo ja, dan moet dat ook naar `"dark"` of verwijderd worden.

---

## 6. Risico's

### 6.1 Visuele breuk (HOOG)

Bij het schakelen van `data-theme="light"` naar `"dark"` zullen alle **niet-gemigreerde** hardcoded lichte kleuren (text-gray-900, bg-white, etc.) visueel breken: donkere tekst op donkere achtergrond, witte vlakken op donkere pagina.

**Mitigatie**: Migreer ALLE hardcoded kleuren VOOR het schakelen van het thema. De layout-switch is de LAATSTE stap.

### 6.2 Kleur-constanten in `types.ts` (HOOG)

Als de constanten in `types.ts` niet mee-gemigreerd worden, breken tientallen componenten die deze importeren. Dit is een cascading failure.

**Mitigatie**: `types.ts` migreren in fase 1, als eerste bestand.

### 6.3 Leeftijdskleuren / functionele kleuren (MIDDEN)

KNKV-leeftijdskleuren (blauw, groen, geel, oranje, rood) worden nu als Tailwind classes gebruikt maar bestaan ook als tokens (`--knkv-blauw-*`, `--age-*-gradient`). De migratie moet consistent kiezen voor de token-variant.

**Mitigatie**: Gebruik de KNKV-tokens uit `tokens.css` voor alle leeftijdsgerelateerde kleuren.

### 6.4 Drag-and-drop visuele feedback (MIDDEN)

De scenario-editor (`DndContext`, `GestureCanvas`, `Werkgebied`) gebruikt achtergrondkleuren voor drag-over feedback. Na de switch naar dark moeten deze subtiele kleurverschillen nog zichtbaar zijn.

**Mitigatie**: Test drag-and-drop interacties apart na migratie.

### 6.5 `text-white` ambiguiteit (LAAG)

37 voorkomens van `text-white` in componenten. Sommige zijn correct (tekst op gradient/gekleurde achtergrond), andere moeten `text-[var(--text-inverse)]` worden. Elke plek moet individueel beoordeeld worden.

### 6.6 Visual regression tests (LAAG)

Er zijn geen TI Studio-specifieke visual regression tests. De bestaande `design-system.spec.ts` (24 tests) dekt de gedeelde UI-componenten maar niet de TI-pagina's.

**Mitigatie**: Overweeg om na fase 1 screenshot-tests toe te voegen voor de zwaarste TI-pagina's.

### 6.7 Printing / PDF-export (LAAG)

Als er print-stylesheets of PDF-export functionaliteit bestaat, kan dark mode ongewenst zijn op papier.

**Mitigatie**: Controleer of `@media print` overrides nodig zijn.

---

## 7. Stappenplan

De migratie wordt uitgevoerd in **5 fasen**, van binnenuit naar buiten. Elke fase is zelfstandig testbaar.

### Fase 0: Voorbereiding (1 uur)

- [ ] Bevestig met ux-designer dat het dark-design consistent moet zijn met bestaande dark-domeinen (Portaal, Beheer, Scouting)
- [ ] Maak een feature-branch `feat/ti-dark-mode`
- [ ] Maak screenshots van alle TI-pagina's in light mode als referentie

### Fase 1: Constanten en gedeelde definities (2 uur)

**Waarom eerst**: deze bestanden worden door veel componenten geimporteerd.

1. **`scenario/types.ts`** (20 hardcoded)
   - Vervang alle Tailwind-kleurklassen door token-varianten
   - `LEEFTIJDS_KLEUREN`, `STATUS_KLEUREN`, `CATEGORIE_BADGE_KLEUREN`, `COMPETITIE_CATEGORIE_KLEUREN`

2. **`blauwdruk/categorie-kaders.ts`** (11 hardcoded)
   - Vervang hardcoded kleuren door tokens

3. **`teamindeling.css`**
   - Update header-commentaar
   - Controleer `btn-secondary` kleurcontrast

### Fase 2: Blauwdruk-componenten (4-6 uur)

**Waarom**: blauwdruk is het op-een-na-zwaarste feature met 273 hardcoded kleuren in 18 bestanden.

Volgorde (zwaarst eerst):
1. `BesluitenOverzicht.tsx` (32)
2. `LedenDashboard.tsx` (29)
3. `GezienOverzicht.tsx` (28)
4. `UitgangspositiePanel.tsx` (27)
5. `CategorieKaart.tsx` (27)
6. `HerberekenDialoog.tsx` (26)
7. `LedenSyncPreview.tsx` (21)
8. `LedenSyncDialoog.tsx` (19)
9. `PinsOverzicht.tsx` (17)
10. `CategorieSettingsDialog.tsx` (16)
11. Overige 8 bestanden (52 totaal)

### Fase 3: Scenario-componenten (6-8 uur)

**Waarom**: zwaarste groep met 452 hardcoded kleuren in 55 bestanden. Opgesplitst in subgroepen.

#### 3a: Kern-editor componenten
1. `SpelerDetail.tsx` (38)
2. `TeamEditPanel.tsx` (37)
3. `ScenarioWerkbordPanel.tsx` (28)
4. `SelectieBlok.tsx` (26)
5. `TeamKaart.tsx` (25)
6. `VerdeelDialoog.tsx` (22)
7. `ValidatieRapport.tsx` (30)

#### 3b: View-modus componenten
1. `view/ViewTeamKaart.tsx` (26)
2. `view/ViewSelectieBlok.tsx` (22)
3. `view/ViewWerkgebied.tsx` (minimal)

#### 3c: Editor (fullscreen/gesture)
1. `editor/EditorToolbar.tsx` (8+)
2. `editor/GestureCanvas.tsx` (5+)
3. `editor/Drawer.tsx` (4+)
4. `editor/ScenarioEditorFullscreen.tsx` (2+)

#### 3d: Overige scenario-componenten
- `SpelerKaart.tsx`, `SpelersPool.tsx`, `SpelerFilters.tsx`, `SpelerStatusTab.tsx`
- `TeamSpelerRij.tsx`, `PanelSpelerRij.tsx`, `RankingBadge.tsx`, `RatingEditor.tsx`
- `OpmerkingPopover.tsx`, `SelectieKoppelaar.tsx`, `NieuwTeamDialoog.tsx`
- `Werkgebied.tsx`, `DndContext.tsx`, `ImpactOverzicht.tsx`
- `KleurRangesInfo.tsx`, `EvaluatieScores.tsx`, `ValidatieMeldingen.tsx`
- `ValidatieBadge.tsx`, `AfmeldBadge.tsx`, `MaakDefinitiefKnop.tsx`
- `SelectieSpelerGrid.tsx`

### Fase 4: Overige componenten (3-4 uur)

1. **`scenarios/`** (68 in 6 bestanden)
   - `wizard-stappen.tsx`, `NieuwScenarioWizard.tsx`, `StapMethode.tsx`
   - `Prullenbak.tsx`, `HernoemScenarioKnop.tsx`, `VerwijderScenarioKnop.tsx`

2. **`werkbord/`** (45 in 7 bestanden)
   - `WerkbordOverzicht.tsx`, `WerkitemKaart.tsx`, `WerkitemDialoog.tsx`
   - `WerkbordFilters.tsx`, `WerkbordBadge.tsx`, `BlockerChecklist.tsx`

3. **`vergelijk/`** (31 in 2 bestanden)
   - `ScenarioVergelijk.tsx`, `TeamDiff.tsx`

4. **`timeline/`** (23 in 2 bestanden)
   - `ActivityTimeline.tsx`, `ActiviteitForm.tsx`

5. **`instellingen/`** (13 in 3 bestanden)
   - `ImportBeheer.tsx`, `MijlpaalBeheer.tsx`, `SeizoenBeheer.tsx`

6. **`dashboard/`** (10 in 2 bestanden)
   - `MijlpalenTimeline.tsx`, `ScenarioStatus.tsx`

7. **`layout/`** (2) en **`ui/`** (2)

### Fase 5: App-pagina's en layout-switch (2 uur)

1. **App-pagina's migreren** (86 hardcoded in 8 bestanden):
   - `over/page.tsx` (36)
   - `scenarios/page.tsx` (13)
   - `vergelijk/page.tsx` (11)
   - `page.tsx` (3), `werkbord/page.tsx` (3), `error.tsx` (3)
   - `loading.tsx` (2), `instellingen/page.tsx` (1)

2. **Layout-switch**: `data-theme="light"` naar `data-theme="dark"` in `layout.tsx`

3. **TIDomainShell**: controleer en update `theme` prop

4. **Visuele controle**: elke pagina doorlopen op 1280px (desktop) en 430px (mobile)

---

## 8. Geschatte doorlooptijd

| Fase | Uren | Complexiteit |
|---|---|---|
| Fase 0: Voorbereiding | 1 | Laag |
| Fase 1: Constanten | 2 | Midden |
| Fase 2: Blauwdruk | 4-6 | Hoog |
| Fase 3: Scenario | 6-8 | Hoog |
| Fase 4: Overig | 3-4 | Midden |
| Fase 5: Pagina's + switch | 2 | Laag |
| **Totaal** | **18-23 uur** | |

### Aanpak per bestand

Elk bestand volgt dezelfde procedure:
1. Zoek alle hardcoded kleurklassen met regex
2. Bepaal per klasse de semantische rol (tekst, achtergrond, border, interactie)
3. Vervang door de bijpassende token uit de mapping-tabel (sectie 3)
4. Controleer visueel in de browser (light mode, want we schakelen pas in fase 5)

### Tussentijds testen

Na elke fase: bouw de app (`pnpm build`) om TypeScript-fouten uit te sluiten. De visuele check in dark mode kan pas na fase 5, maar elke fase moet compileren zonder fouten.

---

## 9. Buiten scope

De volgende items zijn **niet** onderdeel van dit migratieplan:

- **Mobile TI (`scenario/mobile/`)**: 0 hardcoded kleuren gevonden, al op tokens
- **Server Actions**: geen visuele wijzigingen nodig
- **Test-bestanden**: `.test.ts` bestanden bevatten geen kleuren
- **packages/ui/ componenten**: al 100% op tokens (GROEN in audit)
- **Andere domeinen**: Monitor teams (59), Scouting (17) — apart migratieplan
- **PWA-configuratie**: apart werkstroom

---

## 10. Afhankelijkheden

| Van | Nodig | Status |
|---|---|---|
| ux-designer | Bevestiging dat TI dark design identiek is aan bestaande dark apps | OPEN |
| ux-designer | Design-review van `btn-secondary` contrast in dark mode | OPEN |
| ux-designer | Beslissing over leeftijdskleur-badges in dark context | OPEN |
| ontwikkelaar | Geen gelijktijdige refactors in TI-componenten | OPEN |
| e2e-tester | Visual regression baselines na migratie | NA AFLOOP |
