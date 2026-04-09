# UX-spec: What-if model voor TI Studio (desktop)

**Datum**: 2026-03-29
**Auteur**: UX-designer (lead)
**Status**: Ter review (product-owner, ontwikkelaar, frontend)
**Bron**: `docs/specs/2026-03-29-what-if-model-design.md` (goedgekeurd design)
**Scope**: Fase 1 (werkindeling) + fase 2 (what-if basis) — desktop TI Studio

---

## Inhoudsopgave

1. [Werkindeling als startscherm](#1-werkindeling-als-startscherm)
2. [What-if start-dialoog](#2-what-if-start-dialoog)
3. [What-if editor overlay](#3-what-if-editor-overlay)
4. [What-if zijbalk](#4-what-if-zijbalk)
5. [Toepassen-flow](#5-toepassen-flow)
6. [Componentenlijst](#6-componentenlijst)
7. [Navigatie-impact](#7-navigatie-impact)
8. [Design tokens & visuele richtlijnen](#8-design-tokens--visuele-richtlijnen)

---

## 1. Werkindeling als startscherm

### 1.1 Huidige situatie

De huidige TI Studio gebruikt een scenario-lijst (`/ti-studio/scenarios`) als startpunt. Elk scenario is een volledige kopie van de indeling. De gebruiker kiest een scenario en opent de fullscreen-editor.

De navigatie in de BottomNav is nu:

```
Overzicht | Blauwdruk | Werkbord | Scenario's | Apps
```

### 1.2 Nieuwe situatie

"Scenario's" wordt vervangen door "Werkindeling". De werkindeling is het enige actieve scenario (`isWerkindeling: true`). Er is geen lijst meer om uit te kiezen.

**Nieuwe BottomNav:**

```
Overzicht | Blauwdruk | Werkbord | Indeling | Apps
```

De route `/ti-studio/scenarios` wordt `/ti-studio/indeling`.

### 1.3 Werkindeling-dashboard

Als er nog geen werkindeling bestaat, toont `/ti-studio/indeling` een onboarding-scherm. Als er wel een werkindeling bestaat, opent het direct de editor.

**Geen werkindeling (onboarding):**

```
┌─────────────────────────────────────────────────────┐
│ TopBar [TI Studio]                     [Gebruiker]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ┌───────────────────────────┐               │
│         │                           │               │
│         │     (illustratie)         │               │
│         │                           │               │
│         │   Nog geen werkindeling   │               │
│         │                           │               │
│         │  Start de werkindeling    │               │
│         │  vanuit de blauwdruk.     │               │
│         │                           │               │
│         │  [=== Start indeling ===] │               │
│         │       (oranje knop)       │               │
│         │                           │               │
│         └───────────────────────────┘               │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Overzicht | Blauwdruk | Werkbord |*Indeling*| Apps  │
└─────────────────────────────────────────────────────┘
```

De "Start indeling"-knop opent dezelfde wizard als het huidige "Nieuw scenario", maar met de tekst "Start werkindeling vanuit blauwdruk". Na aanmaken wordt het scenario gemarkeerd als `isWerkindeling: true` en navigeert de gebruiker automatisch naar de editor.

**Werkindeling bestaat:**

De route `/ti-studio/indeling` opent direct de fullscreen-editor met de werkindeling. Geen tussenscherm. De huidige `ScenarioEditorFullscreen` wordt hergebruikt, maar met aanpassingen (zie sectie 3).

### 1.4 Sidebar-structuur (desktop)

De huidige editor heeft side-tabs (links: spelerspool, rechts: validatie + werkbord). In de nieuwe opzet wordt rechts een derde tab toegevoegd: "What-ifs".

```
┌──────────────────────────────────────────────────────────┐
│ EditorToolbar                                            │
│ [X Sluiten]  Werkindeling  [17/22 teams]  [...knoppen]  │
├──┬───────────────────────────────────────────────────┬───┤
│  │                                                   │   │
│ S│                                                   │ W │
│ P│            Werkgebied                             │ h │
│ E│          (drag & drop canvas)                     │ a │
│ L│                                                   │ t │
│ E│                                                   │ - │
│ R│         ┌──────┐  ┌──────┐  ┌──────┐             │ i │
│ S│         │Team 1│  │Team 2│  │Team 3│             │ f │
│  │         └──────┘  └──────┘  └──────┘             │ s │
│ P│                                                   │   │
│ O│         ┌──────┐  ┌──────┐                       │ V │
│ O│         │Team 4│  │Team 5│                       │ a │
│ L│         └──────┘  └──────┘                       │ l │
│  │                                                   │ i │
│  │                                                   │ d │
│  │                                                   │ . │
│  │                                                   │   │
├──┴───────────────────────────────────────────────────┴───┤
│ Overzicht | Blauwdruk | Werkbord |*Indeling*| Apps       │
└──────────────────────────────────────────────────────────┘
```

De rechter side-tabs worden:

```
┌─────────┐
│ What-if │  ← NIEUW
│  (W)    │
├─────────┤
│ Validat │  ← bestaand
│  (V)    │
├─────────┤
│ Werkbrd │  ← bestaand
│  (B)    │
└─────────┘
```

### 1.5 Navigatie van scenario-lijst naar editor

| Huidige flow | Nieuwe flow |
|---|---|
| BottomNav "Scenario's" | BottomNav "Indeling" |
| Scenario-lijst pagina | Direct naar editor (als werkindeling bestaat) |
| Klik op scenario-kaart | N.v.t. (er is maar een werkindeling) |
| Fullscreen editor opent | Editor opent direct |

### 1.6 Archief

De oude scenario's die niet de werkindeling zijn, worden bereikbaar via een "Archief"-link in de EditorToolbar of via het Overzicht-dashboard. Dit is geen primaire navigatie.

---

## 2. What-if start-dialoog

### 2.1 Trigger: waar start je een what-if?

Er zijn drie triggers om een what-if te starten:

**Trigger A: What-if knop in de toolbar**

In de EditorToolbar van de werkindeling zit een knop "What-if" naast "Nieuw team":

```
[Compact] [Score] [Nieuw team] [What-if] [Preview/Bewerken]
                                  ^
                                  accent-border-left als visueel onderscheid
```

Dit opent de what-if start-dialoog zonder voorgeselecteerde teams.

**Trigger B: Context-actie op team(s)**

Als de gebruiker een of meer teamkaarten selecteert (via klik + Cmd/Ctrl of via lasso-selectie) verschijnt een floating action bar:

```
         ┌──────────────────────────────────────────┐
         │  2 teams geselecteerd                     │
         │  [Koppel selectie] [What-if] [Verbergen] │
         └──────────────────────────────────────────┘
```

"What-if" opent de start-dialoog met de geselecteerde teams al aangevinkt.

**Trigger C: What-if zijbalk**

De "[+ Nieuwe what-if]" knop in de what-if zijbalk (zie sectie 4) opent dezelfde dialoog.

### 2.2 De start-dialoog

De dialoog is een centered modal (Dialog-component uit `packages/ui/`):

```
┌─────────────────────────────────────────────┐
│ Nieuwe what-if                          [X] │
├─────────────────────────────────────────────┤
│                                             │
│  Vraag *                                    │
│  ┌─────────────────────────────────────┐    │
│  │ Wat als we een 3e senioren team     │    │
│  │ maken?                              │    │
│  └─────────────────────────────────────┘    │
│  Beschrijf wat je wilt onderzoeken.         │
│                                             │
│  Teams                                      │
│  ┌─────────────────────────────────────┐    │
│  │ [v] Senioren 1                      │    │
│  │ [v] Senioren 2                      │    │
│  │ [ ] U17                             │    │
│  │ [ ] U17-2                           │    │
│  │ [ ] U15-1                           │    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│  Selecteer de teams die je wilt verkennen.  │
│  Meer teams worden automatisch meegenomen   │
│  als je spelers verplaatst.                 │
│                                             │
│  Afhankelijk van (optioneel)                │
│  ┌─────────────────────────────────────┐    │
│  │ Geen (standaard)               [v]  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│            [Annuleren]  [Start what-if]     │
│                          (accent-knop)      │
└─────────────────────────────────────────────┘
```

**Veldspecificaties:**

| Veld | Type | Verplicht | Toelichting |
|---|---|---|---|
| Vraag | Textarea, 2-3 regels | Ja | Wordt de titel van de what-if. Placeholder: "Wat als we..." |
| Teams | Checkbox-lijst | Min. 1 team | Gegroepeerd per categorie (Senioren, Rood, Oranje, ...). Voorgeselecteerd als via Trigger B gestart |
| Afhankelijk van | Select | Nee | Dropdown met open what-ifs. Standaard "Geen". Alleen zichtbaar als er al what-ifs bestaan |

**Interactie:**

1. Gebruiker vult vraag in
2. Gebruiker vinkt teams aan (of accepteert voorgeselecteerde teams)
3. Klik "Start what-if"
4. Systeem kopieert de huidige staat van de geselecteerde teams
5. De what-if editor overlay opent (zie sectie 3)

**Validatie:**

- Vraag is verplicht (minimaal 5 karakters)
- Minimaal 1 team moet geselecteerd zijn
- "Start what-if" knop is disabled tot beide voorwaarden voldaan zijn

### 2.3 Tokens voor de dialoog

| Element | Token |
|---|---|
| Achtergrond | `var(--surface-raised)` |
| Overlay/scrim | `rgba(0, 0, 0, 0.7)` — `var(--surface-scrim)` |
| Vraag-input achtergrond | `var(--surface-sunken)` |
| Team-lijst achtergrond | `var(--surface-card)` |
| Checkbox checked | `var(--ow-oranje-500)` |
| Start-knop | `var(--ow-oranje-600)` bg, `var(--ow-wit-50)` text |
| Annuleer-knop | `var(--surface-card)` bg, `var(--text-secondary)` text |
| Border | `var(--border-default)` |
| Radius | `var(--radius-xl)` (16px) voor de modal, `var(--radius-md)` (10px) voor inputs |

---

## 3. What-if editor overlay

### 3.1 Overlay-concept

De what-if editor is geen aparte pagina. Het is een **visuele modus** op de bestaande werkindeling-editor. De teams in het werkgebied worden visueel ingedeeld in drie zones.

### 3.2 De drie zones

```
┌──────────────────────────────────────────────────────────────┐
│ WhatIfToolbar                                                │
│ [X Sluiten] "Wat als we een 3e senioren..."  [Impact panel] │
│             status: OPEN                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ╔══════════════════════════════════════╗                     │
│  ║ ZONE 1: ACTIEVE TEAMS               ║                     │
│  ║ (volle helderheid, bewerkbaar)       ║                     │
│  ║                                      ║                     │
│  ║  ┌──────────┐  ┌──────────┐         ║                     │
│  ║  │Senioren 1│  │Senioren 2│         ║                     │
│  ║  │ 12 > 10  │  │ 12 > 9   │         ║                     │
│  ║  │  oranje   │  │   oranje │         ║                     │
│  ║  │  border   │  │   border │         ║                     │
│  ║  └──────────┘  └──────────┘         ║                     │
│  ║                                      ║                     │
│  ║  ┌──────────┐                        ║                     │
│  ║  │Senioren 3│ (nieuw, stippellijn)   ║                     │
│  ║  │ 0 > 8    │                        ║                     │
│  ║  └──────────┘                        ║                     │
│  ╚══════════════════════════════════════╝                     │
│                                                              │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐                    │
│  │ ZONE 2: IMPACT-TEAMS                 │                    │
│  │ (80% opacity, read-only, amber brd)  │                    │
│  │                                       │                    │
│  │  ┌──────────┐                         │                    │
│  │  │ U17      │ "-1 speler"             │                    │
│  │  │ 10 > 9   │  amber border           │                    │
│  │  └──────────┘                         │                    │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘                    │
│                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                    │
│    ZONE 3: ONGERAAKTE TEAMS                                  │
│  │ (40% opacity, collapsed, klikbaar)   │                    │
│                                                              │
│  │  [U15-1] [U15-2] [U13-1] [Groen 1]  │                    │
│    [Groen 2] [Blauw 1] [Blauw 2] ...                        │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [Verwerpen]          [Bewaren]       [Toepassen >>]  │    │
│  │  (danger)             (secondary)     (accent)       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Visueel onderscheid per zone

| Zone | Opacity | Border | Achtergrond | Interactie |
|---|---|---|---|---|
| **Actief** | 100% | 2px solid `var(--ow-oranje-500)` | `var(--surface-card)` | Volledig: drag & drop, spelers toevoegen/verwijderen, team bewerken |
| **Impact** | 80% | 2px dashed `var(--knkv-geel-500)` | `var(--surface-card)` | Read-only. Delta-badge zichtbaar. Klikken op een speler in een impact-team om deze naar een actief team te slepen maakt het impact-team automatisch actief |
| **Ongeraakt** | 40% | 1px solid `var(--border-default)` | `var(--surface-sunken)` | Collapsed (alleen teamnaam + aantal spelers). Openklapbaar voor context. Spelers uit ongeraakte teams zijn "sleepbaar": zodra je dat doet, wordt het team een impact-team |

**Nieuwe teamkaart (in what-if):**

Nieuwe teams (zonder `bronTeamId`) krijgen een gestippelde border in plaats van een solide border:

```
┌ ─ ─ ─ ─ ─ ─ ─ ┐
  Senioren 3
│ (nieuw team)    │
  0 > 8 spelers
│                 │
  [speler] [speler]
│ [speler] ...    │
└ ─ ─ ─ ─ ─ ─ ─ ┘
```

### 3.4 WhatIfToolbar

Vervangt de EditorToolbar wanneer een what-if actief is:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [< Terug]  "Wat als we een 3e senioren team maken?"    [Impact] [X]│
│            OPEN                                          (toggle)   │
└──────────────────────────────────────────────────────────────────────┘
```

| Element | Beschrijving |
|---|---|
| Terug-pijl | Sluit de what-if overlay, gaat terug naar werkindeling. Vraagt "Bewaren?" als er onbewaarde wijzigingen zijn |
| Vraag-titel | De vraag die bij het aanmaken is ingevuld. Truncated op 60 tekens met ellipsis |
| Status-badge | Gekleurde badge: OPEN (blauw), WACHT OP ANTWOORDEN (amber), BESLISBAAR (groen) |
| Impact-toggle | Opent/sluit het impact-panel (zie 3.5) |
| Sluiten (X) | Zelfde als "Terug" |

**Tokens:**

| Element | Token |
|---|---|
| Toolbar achtergrond | `var(--surface-card)` met `backdrop-filter: blur(12px)` |
| Vraag-tekst | `var(--text-primary)`, 14px, font-weight 600 |
| Status OPEN | `var(--knkv-blauw-500)` bg met 10% opacity, `var(--knkv-blauw-500)` tekst |
| Status WACHT | `var(--knkv-geel-500)` bg met 10% opacity, `var(--knkv-geel-500)` tekst |
| Status BESLISBAAR | `var(--color-success)` bg met 10% opacity, `var(--color-success)` tekst |
| Border-bottom | `var(--ow-oranje-600)` 2px — visueel signaal dat je in what-if modus zit |

### 3.5 Impact-panel

Het impact-panel is een rechter Drawer (hergebruik bestaande Drawer-component, side="right", width="w-96") dat opent als de gebruiker op "Impact" klikt in de toolbar.

```
┌─────────────── Impact ───────────────┐
│                                  [X] │
├──────────────────────────────────────┤
│                                      │
│  Gewijzigde teams (3)                │
│  ┌──────────────────────────────┐    │
│  │ Senioren 1       12 > 10    │    │
│  │ -2 spelers            (!)   │    │
│  ├──────────────────────────────┤    │
│  │ Senioren 2       12 > 9     │    │
│  │ -3 spelers            [!]   │    │
│  ├──────────────────────────────┤    │
│  │ Senioren 3       nieuw, 8   │    │
│  │ +8 spelers            OK    │    │
│  └──────────────────────────────┘    │
│                                      │
│  Impact op andere teams (1)          │
│  ┌──────────────────────────────┐    │
│  │ U17              10 > 9     │    │
│  │ -1 speler             OK    │    │
│  └──────────────────────────────┘    │
│                                      │
│  ──────────────────────────────      │
│  Samenvatting                        │
│  Spelers verplaatst:  7             │
│  Nieuwe spelers:      0             │
│  Teams geraakt:       4             │
│  ──────────────────────────────      │
│                                      │
│  Validatie                           │
│  [!] Senioren 2: 9 spelers,         │
│      minimum is 10 (KNKV)           │
│  (!) Blauwdruk: 2 senioren-         │
│      teams, what-if maakt 3         │
│  OK  Geslachtsregels                │
│  OK  Leeftijdsgrenzen               │
│                                      │
└──────────────────────────────────────┘
```

**Visuele indicatoren in het impact-panel:**

| Indicator | Icoon | Kleur | Betekenis |
|---|---|---|---|
| Harde fout | `[!]` filled square | `var(--color-error)` | KNKV-regel of pin geschonden |
| Afwijking | `(!)` circle | `var(--color-warning)` | Blauwdruk-kader overschreden |
| OK | checkmark | `var(--color-success)` | Binnen de lijnen |

**Delta-weergave op teamregel:**

```
Team-naam          oude > nieuwe
wijziging          indicator
```

De delta's worden berekend door de huidige staat van WhatIfTeam-spelers te vergelijken met de bronteam-spelers in de werkindeling.

### 3.6 Afsluiknoppen

De drie afsluiknoppen zitten in een sticky footer-balk onderaan het werkgebied:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [Verwerpen]        [Bewaren]    [Toepassen >>]  │
│                                                  │
└──────────────────────────────────────────────────┘
```

| Knop | Stijl | Shortcut | Gedrag |
|---|---|---|---|
| **Verwerpen** | Ghost, `var(--color-error)` tekst, geen achtergrond | - | Bevestigingsdialoog: "Weet je zeker dat je deze what-if wilt verwerpen? De wijzigingen gaan verloren." [Annuleren] [Verwerpen] |
| **Bewaren** | Secondary, `var(--surface-raised)` bg, `var(--text-primary)` tekst | Cmd+S | Slaat what-if op, sluit overlay, terug naar werkindeling. What-if verschijnt in zijbalk |
| **Toepassen** | Primary, `var(--ow-oranje-600)` bg, wit tekst | Cmd+Enter | Opent de toepassen-flow (zie sectie 5). Disabled als er harde fouten zijn (rode border, tooltip met reden) |

**Footer-balk tokens:**

| Element | Token |
|---|---|
| Achtergrond | `var(--surface-card)` met `backdrop-filter: blur(12px)` |
| Border-top | `var(--border-default)` |
| Padding | `var(--space-4)` (16px) verticaal, `var(--space-6)` (24px) horizontaal |
| Knop hoogte | 44px (touch target) |
| Knop radius | `var(--radius-lg)` (12px) |

### 3.7 Drag & drop in what-if context

De bestaande dnd-kit implementatie wordt hergebruikt, maar met beperkingen:

| Actie | Toegestaan? | Toelichting |
|---|---|---|
| Sleep speler tussen actieve teams | Ja | Normaal drag & drop |
| Sleep speler van actief naar pool | Ja | Speler wordt uit what-if team verwijderd |
| Sleep speler van pool naar actief team | Ja | Speler wordt toegevoegd aan what-if team |
| Sleep speler vanuit impact-team | Ja, maar... | Het impact-team wordt automatisch een actief team. Toast-melding: "U17 is nu onderdeel van deze what-if" |
| Sleep speler vanuit ongeraakt team | Ja, maar... | Het ongeraakte team wordt eerst een impact-team (als er een delta ontstaat). Daarna geldt dezelfde logica als hierboven |
| Sleep speler naar impact-team | Nee | Impact-teams zijn read-only. Visuele feedback: rode border flash, cursor "not-allowed" |
| Sleep speler naar ongeraakt team | Nee | Eerst moet het team actief worden gemaakt |

**Auto-meenemen toast:**

```
┌────────────────────────────────────────────┐
│ (i) U17 is nu onderdeel van deze what-if   │
│     Reden: speler verplaatst naar Sen. 1   │
└────────────────────────────────────────────┘
```

Toast-stijl: info-variant, 4 seconden zichtbaar, auto-dismiss. Kleur: `var(--knkv-blauw-500)` accent.

---

## 4. What-if zijbalk

### 4.1 Locatie

De what-if zijbalk is de bovenste side-tab rechts in de werkindeling-editor. Het is een Drawer (side="right", width="w-72") die opent als de gebruiker op de "What-if" side-tab klikt.

### 4.2 Inhoud

```
┌────────────── What-ifs ──────────────┐
│                                 [X]  │
├──────────────────────────────────────┤
│                                      │
│  [+ Nieuwe what-if]                  │
│  (volledige breedte, ghost-accent)   │
│                                      │
│  ──── Open (2) ────                  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ OK "4-korfbal bij geel"     │    │
│  │    2 teams . 3 wijzigingen  │    │
│  │    Aangemaakt: gisteren      │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ .. "Extra 3e senioren"      │    │
│  │    3 teams . 7 wijzigingen  │    │
│  │    2 open acties             │    │
│  └──────────────────────────────┘    │
│                                      │
│  ──── Afgehandeld (1) ────          │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ V  "Talent doorschuiven"    │    │
│  │    Toegepast op 25 mrt       │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

### 4.3 What-if kaart in de zijbalk

Elke what-if wordt weergegeven als een compacte kaart:

```
┌─────────────────────────────────────┐
│ [status-icoon]  "Vraagtekst..."     │
│                 meta-info           │
└─────────────────────────────────────┘
```

**Status-iconen:**

| Status | Icoon | Kleur |
|---|---|---|
| OPEN | `( )` open cirkel | `var(--knkv-blauw-500)` |
| WACHT_OP_ANTWOORDEN | `(..)` twee puntjes | `var(--knkv-geel-500)` |
| BESLISBAAR | `(v)` checkmark in cirkel | `var(--color-success)` |
| TOEGEPAST | `[v]` filled checkmark | `var(--text-muted)` |
| VERWORPEN | `[x]` filled cross | `var(--text-muted)` |

**Meta-info:**

- Open what-ifs: "{n} teams . {m} wijzigingen" + optioneel "{k} open acties"
- Afgehandelde what-ifs: "Toegepast op {datum}" of "Verworpen op {datum}"

### 4.4 Interactie

| Actie | Gedrag |
|---|---|
| Klik op open what-if | Opent de what-if editor overlay. Als er al een what-if actief is, vraagt het systeem: "Je hebt onbewaarde wijzigingen in '[naam]'. Bewaren en openen?" |
| Klik op afgehandelde what-if | Opent een read-only weergave van de what-if (alleen impact-panel, geen bewerking) |
| Klik op "+ Nieuwe what-if" | Opent de start-dialoog (sectie 2) |
| Hover over what-if kaart | `var(--surface-raised)` achtergrond, subtiele glow als BESLISBAAR |

### 4.5 Lege staat

Als er geen what-ifs zijn:

```
┌────────────── What-ifs ──────────────┐
│                                 [X]  │
├──────────────────────────────────────┤
│                                      │
│        (illustratie: pad-icoon)      │
│                                      │
│    Nog geen what-ifs                 │
│    Verken "wat als...?"-scenario's   │
│    zonder je werkindeling te         │
│    wijzigen.                         │
│                                      │
│    [+ Nieuwe what-if]                │
│                                      │
└──────────────────────────────────────┘
```

### 4.6 Side-tab icoon

De what-if side-tab gebruikt een "branch"-icoon (git-branch visueel). Als er open what-ifs zijn, toont de tab een numeriek badge:

```
┌─────────┐
│ What-if │
│  [W] 2  │  ← badge met aantal open what-ifs
└─────────┘
```

**Badge-tokens:**

- Achtergrond: `var(--ow-oranje-600)`
- Tekst: `var(--ow-wit-50)`
- Grootte: 18px rond, 11px font
- Positie: top-right van het icoon

---

## 5. Toepassen-flow

### 5.1 Stap 1: Merge-overzicht

Wanneer de gebruiker "Toepassen" klikt, opent een fullscreen Dialog (niet een Drawer, maar een centered modal op grotere schermen):

```
┌────────────────────────────────────────────────────────────┐
│ What-if toepassen                                     [X]  │
│ "Wat als we een 3e senioren team maken?"                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Wijzigingen die worden doorgevoerd                        │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Senioren 1                                        │    │
│  │  12 > 10 spelers                                   │    │
│  │  - Klaas de Vries    > Senioren 3                  │    │
│  │  - Piet Jansen       > Senioren 3                  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  Senioren 2                                        │    │
│  │  12 > 9 spelers                      [!] FOUT      │    │
│  │  - Jan de Boer       > Senioren 3                  │    │
│  │  - Lisa van Dam      > Senioren 3                  │    │
│  │  - Mark Visser       > Senioren 3                  │    │
│  │                                                    │    │
│  │  [!] Senioren 2 heeft 9 spelers, minimum is 10    │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  Senioren 3 (NIEUW)                               │    │
│  │  8 spelers                                         │    │
│  │  + Klaas de Vries    < Senioren 1                  │    │
│  │  + Piet Jansen       < Senioren 1                  │    │
│  │  + Jan de Boer       < Senioren 2                  │    │
│  │  + Lisa van Dam      < Senioren 2                  │    │
│  │  + Mark Visser       < Senioren 2                  │    │
│  │  + Sara Bakker       < Senioren 2                  │    │
│  │  + Tim de Jong       < U17                         │    │
│  │  + Eva Mulder        < U17                         │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  U17                                               │    │
│  │  10 > 9 spelers              (impact, read-only)   │    │
│  │  - Tim de Jong       > Senioren 3                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ──────────────────────────────────────                    │
│                                                            │
│  Validatie                                                 │
│                                                            │
│  [!] 1 harde fout — moet eerst opgelost worden             │
│      Senioren 2: onder KNKV-minimum (9/10)                 │
│                                                            │
│  (!) 1 afwijking van blauwdruk                             │
│      Blauwdruk: 2 seniorenteams, what-if: 3               │
│                                                            │
│                            [Terug naar editor]             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Validatie-afhandeling

**Als er harde fouten zijn:**

- De "Toepassen" knop is niet zichtbaar
- In plaats daarvan staat er "Terug naar editor" met uitleg
- De harde fouten worden prominent getoond met `var(--color-error)` achtergrondtint

**Als er alleen afwijkingen zijn (geen harde fouten):**

Het merge-overzicht toont een toelichting-sectie:

```
│  (!) 1 afwijking van blauwdruk                             │
│      Blauwdruk: 2 seniorenteams, what-if: 3               │
│                                                            │
│  Toelichting (verplicht bij afwijking)                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ We hebben genoeg spelers voor 3 teams en de        │    │
│  │ nieuwe trainer is beschikbaar.                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│        [Annuleren]            [Toepassen met toelichting]   │
│                                    (accent-knop)           │
```

**Als alles OK is (geen fouten, geen afwijkingen):**

```
│  OK  Alle regels voldaan                                   │
│  OK  Binnen blauwdruk-kaders                               │
│  OK  Geen pins geschonden                                  │
│                                                            │
│        [Annuleren]                    [Toepassen]          │
│                                       (accent-knop)        │
```

### 5.3 Stap 2: Bevestiging

Na klik op "Toepassen" (of "Toepassen met toelichting"):

```
┌──────────────────────────────────────────┐
│          Wijzigingen toepassen?          │
├──────────────────────────────────────────┤
│                                          │
│  De volgende wijzigingen worden          │
│  doorgevoerd in de werkindeling:         │
│                                          │
│  . 7 spelers verplaatst                 │
│  . 1 nieuw team aangemaakt              │
│  . 4 teams gewijzigd                    │
│                                          │
│  Er wordt een snapshot gemaakt zodat     │
│  je dit kunt terugdraaien.              │
│                                          │
│      [Annuleren]   [Ja, toepassen]       │
│                     (accent-knop)        │
└──────────────────────────────────────────┘
```

Na bevestiging:

1. Korte laadstaat (spinner op de knop, "Toepassen..." tekst)
2. Succes-toast: "What-if toegepast. 7 spelers verplaatst."
3. What-if krijgt status TOEGEPAST
4. Overlay sluit, werkindeling toont de nieuwe staat
5. What-if verschijnt onder "Afgehandeld" in de zijbalk

### 5.4 Tokens voor toepassen-flow

| Element | Token |
|---|---|
| Modal achtergrond | `var(--surface-raised)` |
| Fout-blok achtergrond | `rgba(239, 68, 68, 0.08)` — `var(--color-error)` op 8% |
| Fout-tekst | `var(--color-error)` |
| Afwijking-blok achtergrond | `rgba(234, 179, 8, 0.08)` — `var(--color-warning)` op 8% |
| Afwijking-tekst | `var(--color-warning)` |
| OK-tekst | `var(--color-success)` |
| Spelerverplaatsing ">" | `var(--text-muted)` |
| Spelerverplaatsing "+" | `var(--color-success)` |
| Spelerverplaatsing "-" | `var(--color-error)` |
| Toelichting-input | `var(--surface-sunken)` bg, `var(--border-default)` border |
| Toepassen-knop | `var(--ow-oranje-600)` bg |
| Annuleren-knop | `var(--surface-card)` bg, `var(--text-secondary)` tekst |

---

## 6. Componentenlijst

### 6.1 Nieuwe componenten

| Component | Locatie | Beschrijving |
|---|---|---|
| `WhatIfStartDialog` | `apps/web/src/components/teamindeling/what-if/` | Modal voor het aanmaken van een nieuwe what-if. Bevat vraag-input, team-checkboxlijst, afhankelijkheid-select |
| `WhatIfToolbar` | `apps/web/src/components/teamindeling/what-if/` | Vervangt EditorToolbar in what-if modus. Toont vraagtekst, status-badge, impact-toggle, sluiten |
| `WhatIfActionBar` | `apps/web/src/components/teamindeling/what-if/` | Sticky footer met Verwerpen/Bewaren/Toepassen knoppen |
| `WhatIfSidebar` | `apps/web/src/components/teamindeling/what-if/` | Inhoud van de what-if Drawer: lijst van what-ifs, lege staat, "+ Nieuwe" knop |
| `WhatIfCard` | `apps/web/src/components/teamindeling/what-if/` | Compacte kaart voor een what-if in de zijbalk. Status-icoon, vraagtekst, meta-info |
| `ImpactPanel` | `apps/web/src/components/teamindeling/what-if/` | Inhoud van de impact Drawer: delta-overzicht, samenvatting, validatie |
| `ImpactTeamRow` | `apps/web/src/components/teamindeling/what-if/` | Regel in het impact-panel: teamnaam, delta, indicator |
| `MergeOverzicht` | `apps/web/src/components/teamindeling/what-if/` | Fullscreen Dialog voor de toepassen-flow. Wijzigingen per team, validatie, toelichting |
| `MergeBevestiging` | `apps/web/src/components/teamindeling/what-if/` | Compact bevestigingsdialog na merge-overzicht |
| `WhatIfStatusBadge` | `apps/web/src/components/teamindeling/what-if/` | Badge-component voor what-if status (OPEN, WACHT, BESLISBAAR, TOEGEPAST, VERWORPEN) |
| `TeamZoneWrapper` | `apps/web/src/components/teamindeling/what-if/` | Wrapper die teamkaarten visueel groepeert per zone (actief/impact/ongeraakt) met juiste opacity en borders |
| `WerkindelingOnboarding` | `apps/web/src/components/teamindeling/what-if/` | Lege staat als er nog geen werkindeling is. CTA om werkindeling te starten |
| `FloatingActionBar` | `apps/web/src/components/teamindeling/scenario/editor/` | Bar die verschijnt bij multi-selectie van teams. Bevat "What-if", "Koppel selectie", "Verbergen" |

### 6.2 Hergebruikte componenten (ongewijzigd)

| Component | Locatie | Gebruik in what-if |
|---|---|---|
| `Dialog` | `packages/ui/` | WhatIfStartDialog, MergeBevestiging |
| `Drawer` | `apps/web/src/components/teamindeling/scenario/editor/` | ImpactPanel, WhatIfSidebar (bestaande Drawer met side/width/pin props) |
| `Button` | `packages/ui/` | Alle knoppen |
| `Badge` | `packages/ui/` | Status-badges |
| `Toast` | `packages/ui/` | Auto-meenemen meldingen, succes-meldingen |
| `ConfirmDialog` | `packages/ui/` | Verwerpen-bevestiging |
| `Textarea` | `packages/ui/` | Vraag-input, toelichting-input |
| `Input` | `packages/ui/` | Zoeken in team-lijst |
| `Select` | `packages/ui/` | Afhankelijkheid-dropdown |
| `Skeleton` | `packages/ui/` | Laadstaten |
| `TeamKaart` | `apps/web/src/components/teamindeling/scenario/` | Teamkaarten in het werkgebied (basis voor alle drie zones) |
| `SpelersPool` | `apps/web/src/components/teamindeling/scenario/` | Links in de editor |
| `GestureCanvas` | `apps/web/src/components/teamindeling/scenario/editor/` | Drag & drop canvas |
| `DndProvider` | `apps/web/src/components/teamindeling/scenario/` | dnd-kit wrapper |

### 6.3 Aangepaste componenten

| Component | Aanpassing |
|---|---|
| `ScenarioEditorFullscreen` | Nieuwe prop `isWerkindeling: boolean`. Conditionally renderen van WhatIfToolbar vs EditorToolbar. What-if overlay modus toevoegen. Three-zone rendering in het werkgebied |
| `EditorToolbar` | "What-if" knop toevoegen. "Terug naar scenario's" wordt "Sluiten" (want er is maar een werkindeling). Link naar archief toevoegen |
| `SideTabsRight` | Derde tab toevoegen: "What-if" met badge. Volgorde: What-if, Validatie, Werkbord |
| `TeamKaart` | Nieuwe prop `zone: "actief" | "impact" | "ongeraakt"` voor visueel onderscheid (border-kleur, opacity). Nieuwe prop `delta?: string` voor delta-badge op impact-teams |
| `Werkgebied` | Groepering van teams per zone. Collapsed-weergave voor ongeraakte teams |
| `GestureCard` | Drag-beperkingen per zone (read-only voor impact, niet-sleepbaar voor ongeraakt tenzij auto-meenemen) |
| `NieuwScenarioWizard` | Hernoemen naar "Start werkindeling". Tekstaanpassingen. Na aanmaken: `isWerkindeling: true` zetten |

### 6.4 Componentafhankelijkheden (boomstructuur)

```
ScenarioEditorFullscreen (aangepast)
├── EditorToolbar (aangepast: + What-if knop)
│   └── WhatIfStartDialog (nieuw)
├── WhatIfToolbar (nieuw, vervangt EditorToolbar in what-if modus)
│   └── WhatIfStatusBadge (nieuw)
├── SideTabsRight (aangepast: + what-if tab)
│   └── WhatIfSidebar (nieuw)
│       ├── WhatIfCard (nieuw) [per what-if]
│       └── WhatIfStartDialog (nieuw, via "+ Nieuwe")
├── Werkgebied (aangepast: zone-groepering)
│   └── TeamZoneWrapper (nieuw)
│       └── TeamKaart (aangepast: zone prop)
├── Drawer > ImpactPanel (nieuw)
│   └── ImpactTeamRow (nieuw)
├── WhatIfActionBar (nieuw, sticky footer)
│   └── ConfirmDialog (hergebruik, voor verwerpen)
├── MergeOverzicht (nieuw, fullscreen Dialog)
│   └── MergeBevestiging (nieuw)
├── FloatingActionBar (nieuw, bij multi-selectie)
└── Toast (hergebruik, voor auto-meenemen)
```

---

## 7. Navigatie-impact

### 7.1 Manifest-wijziging

De navigatie-manifest in `packages/ui/src/navigation/manifest.ts` moet worden aangepast:

**Huidig:**

```ts
{ nav: { label: "Scenario's", href: "/ti-studio/scenarios", icon: "SearchIcon" } }
```

**Nieuw:**

```ts
{ nav: { label: "Indeling", href: "/ti-studio/indeling", icon: "SearchIcon" } }
```

### 7.2 Route-wijzigingen

| Huidige route | Nieuwe route | Toelichting |
|---|---|---|
| `/ti-studio/scenarios` | `/ti-studio/indeling` | Werkindeling editor (als werkindeling bestaat) of onboarding |
| `/ti-studio/scenarios/[id]` | `/ti-studio/indeling` | Er is maar een werkindeling, geen ID nodig |
| `/ti-studio/vergelijk` | Vervalt (fase 2+) | What-if vergelijking vervangt scenario-vergelijking |

### 7.3 Redirect

`/ti-studio/scenarios` moet een redirect doen naar `/ti-studio/indeling` voor backward compatibility (bookmarks, links in Slack).

### 7.4 Archief-route

Oude scenario's worden bereikbaar via `/ti-studio/archief`. Dit is geen BottomNav-item maar een link in het Overzicht-dashboard of via de EditorToolbar.

---

## 8. Design tokens & visuele richtlijnen

### 8.1 What-if kleurschema

De what-if modus wordt visueel onderscheiden door een subtiel kleurenschema:

| Element | Dark token | Toelichting |
|---|---|---|
| What-if modus indicator | `var(--ow-oranje-600)` border-bottom op toolbar | Signaleert dat je in what-if modus zit |
| Actieve zone border | `var(--ow-oranje-500)` 2px solid | "Dit bewerk je" |
| Impact zone border | `var(--knkv-geel-500)` 2px dashed | "Dit is geraakt" |
| Ongeraakt zone opacity | 0.4 | "Dit is niet relevant" |
| Auto-meenemen toast | `var(--knkv-blauw-500)` accent | Info-melding |
| What-if badge in sidetab | `var(--ow-oranje-600)` bg | Aantal open what-ifs |

### 8.2 Dark-first migratie-noot

De huidige TI Studio draait in `data-theme="light"` (zie layout.tsx). Het design in deze spec is beschreven met dark-first tokens. Bij implementatie zijn er twee opties:

**Optie A (aanbevolen)**: Migreer TI Studio naar dark in dezelfde sprint als what-if. De design spec gebruikt al consequent `var(--surface-*)`, `var(--text-*)` en `var(--border-*)` tokens die in beide thema's werken.

**Optie B (pragmatisch)**: Implementeer what-if eerst met de huidige light-theme tokens. Plan dark-migratie als apart werkpakket.

De tokens in deze spec zijn thema-agnostisch: ze verwijzen naar semantic tokens, niet naar hardcoded kleuren. Frontend moet de juiste token-waarde gebruiken, niet de hexwaarde.

### 8.3 Animaties

| Transitie | Specificatie |
|---|---|
| What-if overlay openen | `var(--transition-page)` — 400ms cubic-bezier(0.4, 0, 0.2, 1), fade + scale(0.98 > 1.0) |
| Zone-wisseling (team wordt actief) | `var(--transition-default)` — 200ms ease, opacity + border-color |
| Impact-panel openen | Drawer slide-in, 300ms |
| Toast verschijnen | slide-up + fade, 200ms |
| Merge-overzicht openen | Dialog scale-in, `var(--transition-page)` |
| Verwerpen-shake | 200ms horizontal shake op de bevestigingsknop (feedback-animatie) |

### 8.4 Responsive overwegingen

Deze spec beschrijft de desktop-ervaring (>= 1024px). De mobile-ervaring wordt apart ontworpen, maar houdt rekening met:

- Touch targets: alle interactieve elementen zijn minimaal 44px
- Knoppen gebruiken `var(--touch-target-min)` als minimale hoogte
- Drawer-breedte is vast (`w-72`, `w-96`) en niet percentage-gebaseerd — op kleinere schermen wordt dit een full-width bottom sheet

---

## Bijlage A: User journey — "Extra 3e senioren"

Stap-voor-stap beschrijving van een typische what-if flow:

1. TC-lid opent TI Studio, navigeert naar "Indeling"
2. De werkindeling-editor opent met alle 22 teams
3. TC-lid selecteert "Senioren 1" en "Senioren 2" (Cmd+klik)
4. FloatingActionBar verschijnt met "What-if" knop
5. Klik op "What-if" -> WhatIfStartDialog opent
6. Vraag: "Wat als we een 3e senioren team maken?"
7. Teams: Senioren 1 en 2 zijn al aangevinkt
8. Klik "Start what-if"
9. What-if editor overlay opent:
   - Senioren 1 en 2 zijn in de actieve zone (oranje border)
   - Alle andere teams zijn in de ongeraakte zone (40% opacity)
10. TC-lid maakt een nieuw team "Senioren 3" aan (via toolbar)
11. Sleept spelers van Senioren 1 naar Senioren 3
12. Sleept een U17-speler naar Senioren 3
    - Toast: "U17 is nu onderdeel van deze what-if"
    - U17 verschijnt in de impact-zone (amber border)
13. TC-lid opent Impact-panel → ziet overzicht van alle delta's
14. Validatie toont: Senioren 2 onder minimum (harde fout)
15. TC-lid lost dit op door een speler terug te schuiven
16. Validatie nu: alleen afwijking "3 i.p.v. 2 seniorenteams"
17. Klik "Toepassen" → MergeOverzicht opent
18. TC-lid ziet alle verplaatsingen, vult toelichting in bij afwijking
19. Klik "Toepassen met toelichting" → MergeBevestiging
20. Klik "Ja, toepassen"
21. Succes-toast, werkindeling is bijgewerkt, what-if verhuist naar "Afgehandeld"

---

## Bijlage B: Vergelijking met huidig scenario-model

| Aspect | Huidig (scenario's) | Nieuw (werkindeling + what-ifs) |
|---|---|---|
| Startscherm | Lijst van scenario's | Direct in editor |
| Aantal kopieeen | Volledige kopie per scenario | Alleen gewijzigde teams |
| Navigatie | Scenario kiezen, editor opent | Altijd in editor, what-if als overlay |
| Vergelijking | Apart vergelijkingsscherm | Impact-panel toont delta's inline |
| Besluitvorming | "Markeer definitief" op een scenario | "Toepassen" van een what-if |
| Meerdere varianten | Meerdere scenario's naast elkaar | Meerdere what-ifs in zijbalk |
| Domino-effect | Niet zichtbaar (hele indeling gekopieerd) | Real-time zichtbaar via zones |
| Validatie | Validatierapport in Drawer | Inline in impact-panel + bij toepassen |

---

## Bijlage C: Nog niet beschreven (buiten fase 1+2)

De volgende onderdelen worden in latere UX-specs uitgewerkt:

- **Fase 3**: Impact-panel met real-time delta-berekening, automatisch meenemen-logica
- **Fase 4**: Validatie-integratie (KNKV, blauwdruk-kaders, pins) in what-if editor
- **Fase 5**: Acties/vragen bij what-ifs, afhankelijkheden, status-automatisering
- **Mobile**: Read-only weergave van werkindeling en what-ifs op mobile
- **Keyboard shortcuts**: Cmd+S (bewaren), Cmd+Enter (toepassen), Escape (sluiten)
- **Undo/redo**: Within een what-if sessie
