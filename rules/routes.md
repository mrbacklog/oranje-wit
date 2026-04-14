---
paths:
  - "apps/web/src/app/**"
  - "apps/ti-studio/src/app/**"
  - "packages/ui/src/navigation/**"
---

# Routes & Navigatie

## Apps

Platform draait in twee Next.js 16 apps:

| App | Service | URL |
|---|---|---|
| `apps/web` | `ckvoranjewit.app` | `www.ckvoranjewit.app` |
| `apps/ti-studio` | `ti-studio` | `teamindeling.ckvoranjewit.app` |

## Routes in apps/web (`www.ckvoranjewit.app`)

| Route | Domein | Was |
|---|---|---|
| `/` | Mijn Oranje Wit (hub, taken, nieuws, profiel) | portaal.ckvoranjewit.app |
| `/monitor/*` | Verenigingsmonitor | monitor.ckvoranjewit.app |
| `/evaluatie/*` | Evaluatie | evaluatie.ckvoranjewit.app |
| `/scouting/*` | Scouting | scout.ckvoranjewit.app |
| `/beheer/*` | TC Beheer (9 domeinen) | beheer.ckvoranjewit.app |
| `/beleid/*` | Beleid (visie, doelgroepen, presentatie) | nieuw |
| `/ti-studio/*` | → **308 redirect** naar `teamindeling.ckvoranjewit.app/ti-studio/*` | legacy |
| `/teamindeling/*` | → **308 redirect** naar `teamindeling.ckvoranjewit.app/ti-studio` | legacy, mobile TI verwijderd |

## Routes in apps/ti-studio (`teamindeling.ckvoranjewit.app`)

| Route | Onderdeel |
|---|---|
| `/ti-studio` | Dashboard (landing) |
| `/ti-studio/kader` | Teamkaders + memo's per doelgroep |
| `/ti-studio/indeling` | Werkbord — drag & drop teamindeling |
| `/ti-studio/personen` | Spelers + staf beheer |
| `/ti-studio/personen/spelers` | Spelersoverzicht (inline bewerkbaar) |
| `/ti-studio/personen/staf` | Stafoverzicht (team + rol koppeling) |
| `/ti-studio/memo` | Memo's / werkitems overzicht |
| `/api/...` | TI-specifieke server actions + API routes |

## Belangrijk voor agents

- **Team-indeling URL's staan in `apps/ti-studio`.** Voeg geen `/ti-studio/*`
  of `/teamindeling/*` routes toe aan `apps/web` — die worden geredirect via
  `apps/web/proxy.ts` (stap 0).
- Mobile TI is **weg** (Fase B). Herbouw kan alleen binnen `apps/ti-studio`.

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
| Mijn OW | Overzicht | Taken | Nieuws | Profiel | `#f97316` |
| Monitor | Overzicht | Teams | Analyse | Signalen | `#22c55e` |
| Team-Indeling | Overzicht | Kaders | Werkbord | Scenario's | `#3b82f6` |
| Evaluatie | Overzicht | Rondes | Teams | Resultaten | `#eab308` |
| Scouting | Overzicht | Opdrachten | Zoeken | Profiel | `#ff6b00` |
| Beheer | Planning | Inrichting | Data | Gebruikers | `#9ca3af` |
| Beleid | Verhaal | Doelgroepen | Bronnen | Delen | `#a855f7` |
