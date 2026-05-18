# V1 → V2 portering — fixes uit week 11-18 mei

**Aangemaakt**: 2026-05-18
**Status**: punten 1+2 geïmplementeerd, punten 3+4 wachten op v2-feature

## Context

Tussen 11 en 18 mei zijn er 16 patch-commits op `apps/ti-studio` (v1) gedaan
terwijl `apps/ti-studio-v2` parallel werd opgebouwd. Onderstaande tabel houdt
bij welke fixes wel/niet naar v2 hoeven en wanneer.

## Status

| # | V1-commit | Wat | Status in v2 |
|---|---|---|---|
| 1 | a3ba7609 | Pool sluit niet-indeelbaren uit (RECREANT, GAAT_STOPPEN) | ✅ 2026-05-18: `NIET_INDEELBAAR`-set in `SpelersPoolDrawer.tsx` |
| 2 | e619fcde + 3a94bb0a | `isNieuw` op basis van `lidSinds >= 1 juli (startjaar-1)` + ✦ marker | ✅ 2026-05-18: `bepaalIsNieuw()` in `queries.ts`, marker in `WbSpelerRij` en `TeamKaart.DetailRij` |
| 3 | eef4e4af + 8e54a0a8 | Memo-create vanaf werkbord: User upsert + `werkbord:memo-delta` live update | ⏳ open — zie ▼ |
| 4 | 594cca5f | `effectieveSpelerStatus()` — Sportlink-afmelding wint van TC-statusOverride | ⏳ open — zie ▼ |

## 3. Memo-create vanaf v2-werkbord

**Trigger**: zodra v2 een `createWerkitem`-server-action krijgt (nu alleen read
via `memo-actions.ts`).

**Te porten uit v1**:
- `apps/ti-studio/src/app/(protected)/indeling/werkitem-actions.ts` —
  `prisma.user.upsert()` op session-email i.p.v. `findUnique()`. Reden:
  allowlist-gebruikers hebben pas na eerste mutatie een `User`-rij; zonder
  upsert faalt `auteurId` op productie.
- Live update: `WerkitemPanel` dispatcht `window.dispatchEvent(new CustomEvent("werkbord:memo-delta", { detail: { ... } }))`
  bij create/status-wissel/delete. `useWerkbordState` luistert en past
  `openMemoCount` per speler/team direct aan zonder reload.

**Acceptatie**:
- Memo aanmaken werkt voor allowlist-gebruiker zonder bestaande `User`-rij.
- ▲-indicator op `TeamKaart`, `WbTeamRij`, `WbSpelerRij` updatet binnen
  100 ms na create (geen page-refresh nodig).

**Bestanden om aan te raken in v2** (verwacht):
- nieuw: `apps/ti-studio-v2/src/actions/werkitem-actions.ts`
- nieuw: `apps/ti-studio-v2/src/components/werkbord/WerkitemPanel.tsx` (of
  uitbreiden van bestaande memo-pagina-component)
- uitbreiden: state-hook in `_components/hooks/` met `useEffect` listener
  voor `werkbord:memo-delta`.

## 4. effectieveSpelerStatus() helper

**Trigger**: zodra v2 `KadersSpeler.statusOverride` ondersteunt (op dit moment
niet — v2 gebruikt alleen `Speler.status` rechtstreeks).

**Te porten uit v1**:
- `apps/ti-studio/src/lib/teamindeling/speler-status.ts` — helper
  `effectieveSpelerStatus(speler, kadersSpeler)`.
- Invariant: een afmeld-status (`GAAT_STOPPEN`, `NIET_SPELEND`, `GESTOPT`)
  op `Speler` **wint altijd** van een legacy `KadersSpeler.statusOverride`.
  Zonder helper verschijnen afgemelde leden als `BESCHIKBAAR` zodra er een
  override staat.

**Acceptatie**:
- Op alle plekken waar v2 `speler.status` toont (pool, team-kaart,
  hover-card, dialog) wordt `effectieveSpelerStatus()` gebruikt zodra een
  override-bron bestaat.
- Unit-test: speler met `status=GAAT_STOPPEN` + override `BESCHIKBAAR`
  rendert als `GAAT_STOPPEN`.

**Bestanden om aan te raken in v2** (verwacht):
- nieuw: `apps/ti-studio-v2/src/lib/speler-status.ts` (port van v1).
- uitbreiden: `_data/queries.ts` mapping van TeamKaartSpeler/PoolSpeler.
- toepassen in `TeamKaart`, `WbSpelerRij`, `SpelerDialog`, `HoverKaartSpeler`.

## Verwijzingen

- V1-fix overzicht: deze sessie 2026-05-18, samenvatting in conversatie.
- V2 werkbord-spec: `docs/superpowers/specs/2026-05-13-werkbord-pagina-v2.md`.
- V2 memo-pagina-spec: `docs/superpowers/specs/2026-05-13-memo-pagina-v2.md`.
