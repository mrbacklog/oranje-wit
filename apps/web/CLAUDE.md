# Web App — apps/web/

Geconsolideerde Next.js 16 app voor alle NIET-teamindeling-domeinen.

## Route Groups
```
apps/web/src/app/
├── (monitor)/monitor/       # Dashboards, signalering, retentie
├── (evaluatie)/evaluatie/   # Rondes, invullen, zelfevaluatie
├── (scouting)/scouting/     # Verzoeken, rapporten, kaarten
├── (beheer)/beheer/         # 9 TC-domeinen, gebruikersbeheer
└── (beleid)/beleid/         # Visie, doelgroepen, Oranje Draad
```

## Teamindeling — NIET hier
Team-indeling (mobile + desktop TI Studio) draait in **`apps/ti-studio`**, bereikbaar op
`teamindeling.ckvoranjewit.app`. Na Fase B van de splitsing (2026-04-14) is alle
TI-code uit apps/web verwijderd. `proxy.ts` redirect `/ti-studio/*` en
`/teamindeling/*` met een 308 naar de ti-studio service.

**Gevolg:** als een issue of feature Teams, Spelers, Staf, Werkindeling, Kader,
Selectie of Werkbord raakt → het hoort in `apps/ti-studio`, NIET hier.

## Design System
- **Dark-first** voor alle domeinen
- Tokens in `packages/ui/src/tokens/`
- CSS classes in `apps/web/src/app/globals.css` — gebruik `.btn`, `.card`, `.badge`, etc.
- **NOOIT** hardcoded kleuren — altijd `var(--ow-*)` tokens of Tailwind

## Tailwind CSS 4
- Config via CSS: `@import "tailwindcss"` + `@theme inline { ... }`
- **GEEN** `tailwind.config.ts`
- `@apply` alleen met standaard Tailwind utilities

## Server Actions vs API Routes
- **Server action**: UI-interactie, formulier-submit, `revalidatePath()`
- **API route**: externe clients, smartlinks, file uploads, CORS

## AI Endpoints
- `/api/ai/chat` — contextgevoelige chat (Daisy, alleen planning + monitor tools)

Details routes: `rules/routes.md`