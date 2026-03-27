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

## Visual regression tests

- Bestand: `e2e/tests/design-system.spec.ts`
- Catalog: `/design-system` route in team-indeling app
- Draai: `pnpm test:e2e:design-system`
- Update baselines: `pnpm test:e2e:design-system -- --update-snapshots`
