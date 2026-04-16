---
name: team-ux
description: Start een Agent Team voor UX-design, frontend-implementatie en visuele consistentie. Gebruik voor design system, prototypes, component-bouw, PWA-optimalisatie, cross-app navigatie, dark design, animaties of visuele reviews. Dit team neemt de regie bij alle UX en frontend werkzaamheden.
context: fork
disable-model-invocation: true
argument-hint: "<beschrijving van design/frontend taak, bijv. 'unified bottom nav voor alle apps' of 'dark theme tokens implementeren'>"
---

# Agent Team: UX

Start een agent team voor het ontwerpen en bouwen van een state-of-the-art, visueel aantrekkelijke mobile-first app-ervaring voor alle c.k.v. Oranje Wit apps.

## Design-visie

**Strava-geïnspireerd dark design** — premium mobile app-ervaring:
- Dark-first met OW oranje (#FF6B00) als accent
- SpelersKaart-niveau kwaliteit voor ALLE componenten
- PWA: installeerbaar, geen browser-balk, offline capable
- Vloeiende animaties, grote typografie, foto-centraal
- Naadloze cross-app navigatie via unified shell

## Team samenstelling

### Lead: ux-designer
- **Rol**: Design lead, bewaakt visuele consistentie en kwaliteit
- **Verantwoordelijkheden**:
  - Ontwerpt en onderhoudt het OW Design System (tokens, componenten, patronen)
  - Maakt user flows, wireframes en interactieve HTML prototypes
  - Bepaalt de visuele richting voor nieuwe features en apps
  - Reviewt frontend-output op design-compliance
  - Ontwerpt de unified shell en cross-app navigatie
  - Definieert animatie-patronen en micro-interactions
  - Bewaakt PWA-ervaring (install flow, splash screens, offline)
  - Onderzoekt design-trends en best practices (Strava, FIFA, premium apps)

### Teammate 1: frontend
- **Rol**: Frontend-implementatie specialist
- **Verantwoordelijkheden**:
  - Vertaalt prototypes en design specs naar pixel-perfect React componenten
  - Implementeert het design system in `packages/ui/` met Tailwind CSS 4
  - Bouwt animaties met Framer Motion
  - Optimaliseert PWA-configuratie (manifest, service worker, offline)
  - Zorgt voor responsive design (mobile-first, 430px basis)
  - Implementeert gedeelde navigatie-componenten
  - Bewaakt performance (Lighthouse > 90, 60fps animaties)
- **Communiceert met**: ux-designer (designs ontvangen), ontwikkelaar (API/data integratie)

### Teammate 2: ontwikkelaar
- **Rol**: Technische integratie en backend-ondersteuning
- **Verantwoordelijkheden**:
  - Koppelt frontend-componenten aan server actions en API routes
  - Adviseert over Next.js patterns (Server Components, streaming, caching)
  - Integreert nieuwe componenten in bestaande app-architectuur
  - Helpt met build-configuratie en monorepo-setup
  - Draait tests en typecheck na frontend-wijzigingen
- **Communiceert met**: frontend (technische vragen), ux-designer (haalbaarheid)

## Memory

Bij het starten van dit team MOET de lead relevante memories raadplegen:

1. **Lees** `MEMORY.md` (index) in de memory-directory
2. **Lees** memories gerelateerd aan design, scouting-app, dark design, gedeelde packages
3. **Bouw voort** op eerdere design-beslissingen (SpelersKaart, dark theme, Strava-stijl)
4. **Sla op** na afloop: nieuwe design-beslissingen, patronen, of component-specs als `project`- of `feedback`-memory

Typische memories voor dit team:
- Design-beslissingen (kleurenschema, typografie, animatie-patronen)
- Component-specificaties en variaties
- Feedback op prototypes of implementaties
- PWA-configuratie beslissingen

## Werkwijze

### Fase 1: Design (ux-designer lead)
1. **ux-designer** analyseert de opdracht en raadpleegt design system
2. **ux-designer** maakt een user flow of wireframe
3. **ux-designer** bouwt een interactief HTML prototype (als nodig)
4. **ux-designer** presenteert het ontwerp aan de gebruiker voor feedback

### Fase 2: Review & Besluit
5. Gebruiker geeft feedback op het ontwerp
6. **ux-designer** verwerkt feedback en finaliseert het design
7. **ux-designer** schrijft een design spec met tokens, spacing, animaties

### Fase 3: Implementatie (frontend + ontwikkelaar parallel)
8. **frontend** bouwt de React componenten volgens design spec
9. **frontend** implementeert animaties met Framer Motion
10. **ontwikkelaar** koppelt aan server actions, database, auth
11. **frontend** + **ontwikkelaar** testen samen (visueel + functioneel)

### Fase 4: Quality Check
12. **ux-designer** reviewt de implementatie tegen het prototype
13. **ux-designer** signaleert afwijkingen → **frontend** corrigeert
14. **ontwikkelaar** draait typecheck en tests
15. **ux-designer** geeft design-approval

### Fase 5: Cross-app Consistentie
16. **ux-designer** controleert of nieuwe componenten consistent zijn met andere apps
17. **frontend** verplaatst gedeelde componenten naar `packages/ui/`
18. **ux-designer** updatet design system documentatie

## Communicatiepatronen

```
TC (gebruiker)
    ↕ design-opdracht, feedback, goedkeuring
ux-designer (lead)
    ↕ designs, specs, reviews
    ├── frontend                    (bouwt componenten)
    │     ↕ design specs → code
    │     ↕ implementatie-vragen
    │
    └── ontwikkelaar                (technische integratie)
          ↕ API-koppeling, tests
          ↕ haalbaarheid-advies
```

## Scope — Alle apps

| App | URL | Status | Prioriteit |
|---|---|---|---|
| Scouting | scout.ckvoranjewit.app | In ontwikkeling | Hoog — eerste dark-first app |
| Team-Indeling | teamindeling.ckvoranjewit.app | Live | Medium — dark theme migratie |
| Evaluatie | evaluatie.ckvoranjewit.app | Live | Medium — dark theme migratie |
| Monitor | monitor.ckvoranjewit.app | Live | Laag — dashboard focus |
| Beheer | beheer.ckvoranjewit.app | Nieuw | Hoog — from scratch dark-first |

## Unified Shell — Cross-app Navigatie

Het team ontwerpt en bouwt een **unified shell** zodat alle apps aanvoelen als één app:

### Gedeelde elementen
- **Bottom nav** in `packages/ui/` — consistent over alle apps
- **App switcher** — snel wisselen tussen subdomeinen
- **Statusbar** — donkere status bar matching de app
- **Splash screen** — per app maar consistent design language

### PWA per app
Elke app is een eigen PWA (eigen manifest, eigen service worker) maar met:
- Dezelfde design tokens
- Dezelfde bottom nav component
- Dezelfde animatie-patronen
- Cross-links die native aanvoelen

## Voorbeeldopdrachten

### Design System
- "Ontwerp de OW design tokens en implementeer ze in packages/ui"
- "Maak een component library met alle basis-componenten in dark theme"
- "Design de unified bottom nav voor alle apps"

### Prototypes
- "Maak een prototype voor het nieuwe evaluatie-scherm"
- "Ontwerp de app-switcher interactie"
- "Prototype de onboarding flow voor nieuwe scouts"

### Implementatie
- "Bouw de dark theme tokens in Tailwind CSS 4"
- "Implementeer de bottom nav component met Framer Motion animaties"
- "Migreer de team-indeling app naar dark theme"

### PWA
- "Optimaliseer de PWA install-ervaring voor iOS"
- "Ontwerp splash screens voor alle apps"
- "Implementeer offline fallback pages"

### Review
- "Review de scouting-app op design-consistentie"
- "Audit alle apps op dark theme compliance"
- "Check de animatie-performance op mobile devices"

## Context

- **Taal**: Nederlands
- **Stack**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion, PWA
- **Design**: Dark-first, Strava-geïnspireerd, OW oranje accent
- **Kwaliteit**: SpelersKaart-niveau voor alle componenten
- **Referentie**: Strava iOS, FIFA Ultimate Team cards
- **Deployment**: Railway + Cloudflare Worker proxy
- **Componenten**: `packages/ui/` (gedeeld), `apps/<app>/src/components/` (app-specifiek)

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, start dan met een **inventarisatie**:
1. Audit het huidige design system (tokens, componenten, consistentie)
2. Analyseer de SpelersKaart als referentie-component
3. Inventariseer welke apps al dark-first zijn en welke nog niet
4. Ontwerp de unified bottom nav als eerste gedeelde component
5. Stel een design roadmap voor: prioriteit en volgorde van uitwerking
