# Design System Regels — c.k.v. Oranje Wit

## Dark-first

Alle apps gebruiken een dark-first design. De design tokens in `packages/ui/src/tokens/tokens.css` zijn de single source of truth.

### Verboden
- Hardcoded lichte kleuren: `bg-white`, `text-gray-900`, `border-gray-200`, `#ffffff`, `#f3f4f6`
- Nieuwe CSS kleurwaarden buiten het token systeem
- Frontend-wijzigingen zonder design system componenten te checken
- Visuele beslissingen zonder ux-designer approval

### Verplicht
- Gebruik semantic tokens: `var(--surface-card)`, `var(--text-primary)`, `var(--border-default)`
- Gebruik componenten uit `packages/ui/` waar mogelijk
- `data-theme="dark"` op het `<html>` element van elke app
- Framer Motion voor animaties (niet CSS-only voor interactieve states)
- Touch targets minimaal 44px op mobile
- Visual regression tests draaien na frontend-wijzigingen

## Component hiërarchie

1. **Gedeeld** (`packages/ui/src/`): Componenten die in meerdere apps worden gebruikt
2. **App-specifiek** (`apps/<app>/src/components/`): Componenten die alleen in één app worden gebruikt
3. **Prototype** (`docs/design/prototypes/`): HTML prototypes voor design exploratie

Nieuwe gedeelde componenten worden ALTIJD eerst door de ux-designer ontworpen.

## Design tokens

| Token | Gebruik |
|---|---|
| `--surface-page` | Pagina-achtergrond |
| `--surface-card` | Kaarten, panels |
| `--surface-raised` | Verhoogde elementen (modals, drawers) |
| `--surface-sunken` | Verzonken elementen (input achtergrond) |
| `--text-primary` | Primaire tekst |
| `--text-secondary` | Secundaire tekst |
| `--text-tertiary` | Gedempte tekst |
| `--border-default` | Standaard borders |
| `--ow-oranje-500` | Primaire accent (oranje) |

## Navigatie-architectuur

**Single Source of Truth**: `packages/ui/src/navigation/manifest.ts`
Alle navigatiestructuur per domein-app is daar gedefinieerd. DomainShell-componenten importeren hieruit.

### Universeel patroon (alle 5 apps)

```
TopBar (fixed, blur, domein-accent lijn)
Pills (optioneel, sub-navigatie binnen een sectie)
Content area
BottomNav (fixed) — [1] [2] [3] [4] [Apps]
```

### Componenten

| Component | Locatie | Functie |
|---|---|---|
| `TopBar` | `packages/ui` | Fixed top, app-naam, domein-accent kleur |
| `BottomNav` | `packages/ui` | 4 functionele knoppen + Apps |
| `Pills` | `packages/ui` | Horizontale tabs voor sub-onderdelen |
| `AppSwitcher` | `packages/ui` | Bottom sheet, 3x2 grid, alle apps |
| `DomainShell` | `packages/ui` | Wrapper die alles combineert |

### Regels (VERPLICHT)

1. **4+1**: precies 4 functionele knoppen + 1 Apps-knop = 5 posities totaal
2. **Geen "Home"**: positie 1 is de primaire functie van de app, niet "Home"
3. **Geen sidebar**: navigatie is mobile-first via BottomNav + Pills. Desktop schaalt mee maar voegt geen sidebar toe
4. **Geen hamburger**: als het niet in de BottomNav past, is het bereikbaar via Pills of content-links
5. **Geen "Meer"-knop**: positie 5 is altijd de AppSwitcher, nooit een catch-all menu
6. **Pills max 5**: bij meer dan 5 pills, heroverweeg de informatiearchitectuur
7. **Touch targets**: minimaal 44px op mobile
8. **Domein-accent**: elke app gebruikt zijn accent-kleur in TopBar, actieve BottomNav-item en actieve Pill

### Domein-accent kleuren

Elke app heeft een eigen accent-kleur die subtiel door de UI schemerT voor locatiebewustzijn:

| App | Accent | Gebruik in |
|---|---|---|
| Monitor | `#22c55e` groen | TopBar accent-lijn, active nav, active pill |
| Team-Indeling | `#3b82f6` blauw | TopBar accent-lijn, active nav, active pill |
| Evaluatie | `#eab308` geel | TopBar accent-lijn, active nav, active pill |
| Scouting | `#ff6b00` oranje | TopBar accent-lijn, active nav, active pill |
| Beheer | `#9ca3af` grijs | TopBar accent-lijn, active nav, active pill |

### Bottom nav per domein-app

| App | Pos 1 | Pos 2 | Pos 3 | Pos 4 | Pos 5 |
|---|---|---|---|---|---|
| **Monitor** | Overzicht | Teams | Analyse | Signalen | Apps |
| **Team-Indeling** | Overzicht | Blauwdruk | Werkbord | Scenario's | Apps |
| **Evaluatie** | Overzicht | Rondes | Teams | Resultaten | Apps |
| **Scouting** | Overzicht | Opdrachten | Zoeken | Profiel | Apps |
| **Beheer** | Planning | Inrichting | Data | Gebruikers | Apps |

### Pills per sectie

| App | Sectie | Pills |
|---|---|---|
| Monitor | Analyse | Retentie / Samenstelling / Projecties |
| Team-Indeling | Blauwdruk | Kaders / Spelers / Staf / Teams |
| Scouting | Opdrachten | Openstaand / Afgerond |
| Beheer | Planning | Kalender / Mijlpalen / Trainingen / Wedstrijden |
| Beheer | Inrichting | Jeugd / Scouting / Evaluatie / Werving |
| Beheer | Data | Teams / Sync / Import / Archief |

### Evaluatie: minimal mode

Evaluatie is een hybride app. Smartlink-gebruikers (trainers, spelers via `?token=`) zien GEEN navigatie. Coordinatoren en TC zien de volledige BottomNav. De `skipRoutes` zijn:
- `/evaluatie/invullen`, `/evaluatie/invullen/bedankt`
- `/evaluatie/zelf`, `/evaluatie/zelf/bedankt`

### Beheer ↔ Domein-app koppeling

De pill-labels in "Inrichting" benoemen expliciet de domein-app: Jeugd, Scouting, Evaluatie, Werving. Zo weet een TC-lid: "Inrichting > Evaluatie = het beheer van de Evaluatie-app"

## Visual regression tests

- Bestand: `e2e/tests/design-system.spec.ts`
- Catalog: `/design-system` route in team-indeling app
- Draai: `pnpm test:e2e:design-system`
- Update baselines: `pnpm test:e2e:design-system -- --update-snapshots`
