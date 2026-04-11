# apps/web — Next.js frontend

## Framework & taal
- Next.js 16, React, TypeScript, Tailwind CSS
- Taal: altijd Nederlands (comments, variabelen, labels)

## Design system
- **Dark-first**: TI Studio gebruikt dark mode (CSS variabelen)
- **Light**: Monitor en overige domeinen gebruiken light mode
- Gedeelde UI-componenten staan in `packages/ui/` (`@oranje-wit/ui`)
- Design tokens: zie `rules/design-system.md`

## Patronen
- **Server Components** voor data-fetching (geen client-side fetch tenzij nodig)
- **Server Actions** voor formulier-submits en interne UI-interactie — return type altijd `ActionResult<T>` uit `@oranje-wit/types`
- **API Routes** voor externe clients, file uploads en CORS — gebruik `ok()`/`fail()`/`parseBody()` uit `@/lib/api`
- Auth in server actions: `requireTC()` (throwt); in API routes: `guardTC()` (returnt Result)

## Logging & constanten
- Nooit `console.log` — gebruik `logger` uit `@oranje-wit/types`
- Importeer `PEILJAAR`, `HUIDIG_SEIZOEN`, `PEILDATUM` uit `@oranje-wit/types`, definieer nooit lokaal

## Domeinen
| Route group | Domein | Mode |
|---|---|---|
| `(teamindeling-studio)` | TI Studio — drag-drop editor | Dark |
| `(teamindeling)` | Teamindeling (legacy/mobile) | Dark |
| `(monitor)` | Verenigingsmonitor | Light |
| `(evaluatie)` | Evaluaties | Light |
| `(scouting)` | Scouting | Light |
| `(beheer)` | Beheer | Light |
