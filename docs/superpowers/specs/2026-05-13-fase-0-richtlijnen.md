# Fase 0 v2 — Coördinatie-richtlijnen

**Doel**: Fundament voor TI Studio v2 (apps/ti-studio-v2) — snelle, testbare componenten.

**Niet**: Volledige spec. Zie `2026-05-08-ti-studio-v2-test-strategie.md` + `2026-05-08-ti-studio-v2-deployment-plan.md` voor detail.

---

## Drag-drop library

**Gebruik**: **Pragmatic Drag and Drop** (`@atlaskit/pragmatic-drag-and-drop`)

```bash
pnpm add @atlaskit/pragmatic-drag-and-drop
```

**Waarom**: Native HTML5 drag-drop API. Playwright `page.dragTo()` werkt out-of-the-box. Geen custom Pointer synthesis nodig.

**Implementatie**:
```tsx
// Component
<div draggable="true" data-testid="speler-card-REL001-werkbord">
  {speler.voornaam}
</div>

// Drop-zone
<div data-testid="drop-zone-team-A1" onDrop={handleDrop}>
  Plaats spelers hier
</div>
```

**E2E test**:
```typescript
const spelerCard = page.locator("[data-testid='speler-card-REL001-werkbord']");
const dropZone = page.locator("[data-testid='drop-zone-team-A1']");
await spelerCard.dragTo(dropZone);
```

---

## data-testid op alle interactieve elementen

**Conventie**:

| Element | Format | Voorbeeld |
|---------|--------|-----------|
| Speler-kaart | `speler-card-{rel_code}-{context}` | `speler-card-LS00123-werkbord` |
| Team-kaart | `team-kaart-{owCode}-{versie}` | `team-kaart-A1-huidig` |
| Drop-zone | `drop-zone-{type}-{target}` | `drop-zone-team-A1` |
| Memo-rij | `memo-rij-{uuid}-{context}` | `memo-rij-abc123-gesprekken` |
| Button/control | `{component}-{action}` | `btn-save-versie`, `toolbar-toggle-pool` |

**Contexten**:
- Spelers: `werkbord` | `spelerpool` | `team-{owCode}` | `whatif-canvas`
- Teams: `huidig` (live) | `whatif` (what-if versie)

**Implementatie checklist**:
- [ ] Alle speler-kaarten: rel_code + context
- [ ] Alle team-kaarten: owCode + versie
- [ ] Alle drop-zones: type + target
- [ ] Alle buttons: `{name}-{action}`

---

## Database

**Test-DB**: `oranjewit-test` (PostgreSQL op Railway)

**Snapshot-restore** vóór E2E-run:
```bash
# CI
SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts
pnpm test:e2e:ti-studio-v2

# Lokaal (optioneel)
SNAPSHOT_TARGET=local pnpm tsx scripts/snapshot-prod-to-dev.ts
```

**App ENV**: `playwright.config.ts` zet `DATABASE_URL` naar test-DB automatisch.

---

## Sportlink sync

**Status**: **UIT** in fase 0-2

```typescript
// .env
SPORTLINK_ENABLED=false
```

Zodra UI stabiel, zet aan voor live data.

---

## E2E tests

**Locatie**: `e2e/ti-studio-v2/`

**Structuur per pagina**:
- `werkbord.spec.ts` — Canvas, drag-drop, what-if
- `personen.spec.ts` — Spelers, staf, reserveringen
- `memo.spec.ts` — Kanban, move, filter
- `kader.spec.ts` — Rollen, validatie
- `homepage.spec.ts` — Ring, tiles, nav

**Minimaal per pagina**: 5 scenario's
- 1x Layout/load
- 2x User interaction (selectors, search, filter)
- 1x Drag-drop (indien van toepassing)
- 1x Persist/reload

**Visual snapshots**: Selectief (homepage, kader, memo). NIET werkbord.

**Draai lokaal**:
```bash
pnpm test:e2e:ti-studio-v2
pnpm test:e2e:ti-studio-v2 -- -g "werkbord"
pnpm test:e2e:ti-studio-v2 -- --update-snapshots  # Update baselines
```

---

## Commando's

```bash
# Dev server (poort 3002)
pnpm dev:ti-studio-v2

# Tests
pnpm test:e2e:ti-studio-v2

# Snapshot-restore (CI prep)
SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts
```

---

## CI-workflow

**Bestand**: `.github/workflows/ci-v2.yml` (aangemaaktevens fase 0)

**Trigger**: Path-filter op `apps/ti-studio-v2/**` en `e2e/ti-studio-v2/**`

**Jobs**:
1. Fast-gate (typecheck, lint, format, unit)
2. Snapshot-restore → `SNAPSHOT_TARGET=railway-test ...`
3. E2E (4 workers)
4. Upload report artefact

---

## Vragen

- **Drag-drop**: Pragmatic PDND OK, of voorkeur voor iets anders?
- **data-testid**: Format OK, of aanpassingen?
- **Snapshots**: 3 baselines per pagina genoeg?
- **CI**: Aparte `ci-v2.yml` OK tot cutover (fase 4)?

→ Contact E2E tester (`/team-e2e`)
