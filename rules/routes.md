---
paths:
  - "apps/web/src/app/**"
  - "packages/ui/src/navigation/**"
---

# Routes & Navigatie

## Routes

| Route | Domein | Was |
|---|---|---|
| `/` | Portaal (app-launcher) | portaal.ckvoranjewit.app |
| `/monitor/*` | Verenigingsmonitor | monitor.ckvoranjewit.app |
| `/teamindeling/*` | Team-Indeling Mobile (dark, review) | nieuw |
| `/ti-studio/*` | Team-Indeling Studio (desktop, bewerken) | teamindeling.ckvoranjewit.app |
| `/evaluatie/*` | Evaluatie | evaluatie.ckvoranjewit.app |
| `/scouting/*` | Scouting | scout.ckvoranjewit.app |
| `/beheer/*` | TC Beheer (9 domeinen) | beheer.ckvoranjewit.app |
| `/beleid/*` | Beleid (visie, doelgroepen, presentatie) | nieuw |

## Navigatie (VERPLICHT — geen afwijkingen)

### Single Source of Truth

**Single Source of Truth**: `packages/ui/src/navigation/manifest.ts`
**Design regels**: `rules/design-system.md` sectie "Navigatie-architectuur"

Agents MOETEN `manifest.ts` raadplegen voor navigatiestructuur. NOOIT zelf navigatie-items verzinnen of hardcoden in domain-shell bestanden zonder dat het manifest de bron is.

### Mobile-first regels

Alle domein-apps volgen hetzelfde navigatiepatroon:
- **Mobile-first**: BottomNav + Pills + TopBar. Geen sidebar, geen hamburger
- **4+1**: precies 4 functionele knoppen + 1 Apps-knop (AppSwitcher)
- **Geen "Home"**: positie 1 heet naar zijn functie ("Overzicht", "Planning"), nooit "Home"
- **Pills**: horizontale tabs voor sub-onderdelen binnen een bottom-nav-sectie
- **Domein-accent**: elke app heeft een eigen kleur (groen, blauw, geel, oranje, grijs) die in TopBar, active nav-item en active pill verschijnt

### 4+1 patroon per domein-app

| App | Pos 1 | Pos 2 | Pos 3 | Pos 4 | Accent |
|---|---|---|---|---|---|
| Monitor | Overzicht | Teams | Analyse | Signalen | `#22c55e` |
| Team-Indeling | Overzicht | Blauwdruk | Werkbord | Scenario's | `#3b82f6` |
| Evaluatie | Overzicht | Rondes | Teams | Resultaten | `#eab308` |
| Scouting | Overzicht | Opdrachten | Zoeken | Profiel | `#ff6b00` |
| Beheer | Planning | Inrichting | Data | Gebruikers | `#9ca3af` |
| Beleid | Verhaal | Doelgroepen | Bronnen | Delen | `#a855f7` |
