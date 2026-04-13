# Web App — apps/web/

Geconsolideerde Next.js 16 app met alle domeinen.

## Route Groups
```
apps/web/src/app/
├── (monitor)/monitor/       # Dashboards, signalering, retentie
├── (teamindeling)/          # Mobile TI (dark mode)
├── (ti-studio)/ti-studio/   # Desktop TI workspace (light mode)
├── (evaluatie)/evaluatie/   # Rondes, invullen, zelfevaluatie
├── (scouting)/scouting/     # Verzoeken, rapporten, kaarten
├── (beheer)/beheer/         # 9 TC-domeinen, gebruikersbeheer
└── (beleid)/beleid/         # Visie, doelgroepen, Oranje Draad
```

## Design System
- **Dark-first** voor alle domeinen behalve TI Studio (light)
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
- `/api/ai/voorstel` — startvoorstel genereren
- `/api/ai/chat` — contextgevoelige chat
- `/api/ai/advies` — spelersadvies
- `/api/ai/whatif` — what-if analyse

Details routes: `rules/routes.md`
