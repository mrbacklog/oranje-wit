# Team-Indeling Tool — c.k.v. Oranje Wit

Intelligente tool voor het samenstellen van teamindelingen per seizoen.

## Stack
- **Framework**: Next.js 16 (TypeScript)
- **Styling**: Tailwind CSS 4
- **Database**: @oranje-wit/database (Prisma, gedeeld package)
- **Drag-and-drop**: @dnd-kit
- **Auth**: NextAuth v5 via `@oranje-wit/auth` (Google OAuth, actief)

## Procesmodel

```
① BLAUWDRUK — regels, kaders, speerpunten, gepinde feiten
      ↓
② CONCEPTEN — uitgangsprincipes, keuzes, niet-gepinde aannames
      ↓
③ SCENARIO'S — concrete teamindelingen, drag-drop, validatie
      ↓
④ DEFINITIEF — gekozen scenario, besluitenlog, communicatie
```

## Pin-systeem
- **Gepind** = bevestigd feit → geldt voor ALLE concepten en scenario's
- **Niet-gepind** = aanname → kan per concept/scenario verschillen
- Types: SPELER_STATUS, SPELER_POSITIE, STAF_POSITIE

## Spelerstatus
- ✓ Beschikbaar (groen) — standaard
- ? Twijfelt (oranje) — onzeker
- ✕ Gaat stoppen (rood) — verwachte uitstroom
- + Nieuw (blauw) — nieuwe aanmelding

## Import

Data komt uit de Verenigingsmonitor via export-JSON:
- Bron: `data/export/export-YYYY-YYYY.json`
- Script: `scripts/import/import-data.ts`
- Logica: `src/lib/import.ts`
- Commando: `pnpm import`

Evaluaties komen uit de native evaluatie-app (`apps/evaluatie/`):
- Direct opgeslagen in PostgreSQL via de evaluatie-app
- Legacy import: `scripts/import/import-evaluaties.ts` (Lovable JSON, verouderd)

## Business Logic

| Bestand | Doel |
|---|---|
| `src/lib/import.ts` | Import: upsert spelers/staf, referentieteams, blauwdruk |
| `src/lib/validatie/regels.ts` | Validatie-engine: KNKV hard rules, OW soft rules |
| `src/lib/validatie/impact.ts` | Impact-analyse: best/expected/worst case |
| `src/lib/db/prisma.ts` | Re-export van @oranje-wit/database |

## Pagina's

| Route | Bestand | Doel |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard met seizoensoverzicht, statuskaarten en processtappen |
| `/blauwdruk` | `app/blauwdruk/page.tsx` | Strategische kaders, speerpunten, werkbord en uitgangspositie per seizoen |
| `/scenarios` | `app/scenarios/page.tsx` | Overzicht van alle scenario's met aanmaak-wizard en vergelijklink |
| `/scenarios/[id]` | `app/scenarios/[id]/page.tsx` | Fullscreen scenario-editor met drag-and-drop teamindeling |
| `/vergelijk` | `app/vergelijk/page.tsx` | Side-by-side vergelijking van twee scenario's |
| `/definitief` | `app/definitief/page.tsx` | Definitieve indeling met teams, besluitenlog en exportpanel |
| `/import` | `app/import/page.tsx` | Importhistorie en instructies voor data-import vanuit de Verenigingsmonitor |
| `/login` | `app/login/page.tsx` | Google OAuth loginpagina |
| `/over` | `app/over/page.tsx` | Uitleg procesmodel, begrippen en de Oranje Draad |

## Server Actions

| Bestand | Key functies |
|---|---|
| `app/blauwdruk/actions.ts` | `getBlauwdruk`, `getSpelersUitgebreid`, `getLedenStatistieken`, `updateCategorieKaders`, `updateSpelerStatus` |
| `app/scenarios/actions.ts` | `getScenario`, `getScenarios`, `getAlleSpelers`, `moveSpeler`, `addSpelerToTeam`, `markeerDefinitief` |
| `app/scenarios/team-actions.ts` | `updateTeam`, `deleteTeam`, `koppelSelectie`, `ontkoppelSelectieMetVerdeling`, `updateSelectieNaam` |
| `app/scenarios/wizard-actions.ts` | `createScenarioVanuitBlauwdruk`, `createLeegScenario`, `kopieerScenario`, `getSpelerBasisData` |
| `app/scenarios/team-volgorde-actions.ts` | `updateTeamVolgorde` |
| `app/pins/actions.ts` | `createPin`, `deletePin`, `getPinsVoorScenario` |
| `app/rating/actions.ts` | `herbereken` |
| `app/werkbord/actions.ts` | `getWerkitems`, `createWerkitem`, `updateWerkitemStatus`, `createActiepunt`, `getTimelineVoorSubject` |

## Hooks

| Hook | Bestand | Doel |
|---|---|---|
| `useValidatie` | `src/hooks/useValidatie.ts` | Mapt UI-teamdata naar de validatie-engine en retourneert teamvalidaties en selectievalidaties |
| `useScenarioEditor` | `src/components/scenario/hooks/useScenarioEditor.ts` | Centrale state-management voor scenario-editor: teams, selectiegroepen, pins en optimistic updates |
| `useSelectieHandlers` | `src/components/scenario/hooks/useSelectieHandlers.ts` | Handlers voor speler-verplaatsingen, selectie-koppeling en -ontkoppeling |
| `useCanvasGesture` | `src/components/scenario/hooks/useCanvasGesture.ts` | Pan- en zoom-gestures voor het vrije canvas in de scenario-editor |
| `useCardPositions` | `src/components/scenario/hooks/useCardPositions.ts` | Positiebeheer en persistentie van teamkaarten op het canvas |
