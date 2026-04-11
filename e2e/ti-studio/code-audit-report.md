# Code Audit Rapport — TI Studio

**Scope:** `apps/web/src/components/ti-studio/werkbord/`, `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/`, `apps/web/src/app/api/ti-studio/`

**Datum:** 2026-04-11

---

## Kritisch (moet gefixed voor release)

### K1 — `verwerpWhatIf` heeft geen auth guard
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-resolve-actions.ts:211`

De server action `verwerpWhatIf` schrijft naar de database (`whatIf.update` op status VERWORPEN) zonder enige `requireTC()` aanroep. Elke ingelogde gebruiker kan hiermee what-ifs archiveren.

Fix: `await requireTC()` als eerste statement toevoegen.

Confidence: 100

### K2 — `pasWhatIfToe` roept `requireTC()` alleen conditioneel aan
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-resolve-actions.ts:26,137,173`

`requireTC()` zit binnen de `$transaction` callback en alleen bereikbaar als `validatie.heeftAfwijkingen && toelichtingAfwijking` true is. Bij een what-if zonder kaderafwijkingen wordt de auth-check nooit uitgevoerd, terwijl de functie destructieve DB-operaties uitvoert (nieuwe versie aanmaken, what-if status wijzigen).

Fix: `await requireTC()` als eerste statement van `pasWhatIfToe`, vóór de validatie.

Confidence: 95

### K3 — `hernoem`, `voegSpelerToeAanTeam`, `verwijderSpelerUitTeam`, `verwijderWerkindeling`, `slaPositiesOp` missen `requireTC()`
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts:122,127,137,153,159`

Vijf write-actions beschermen alleen met `assertBewerkbaar`/`assertTeamBewerkbaar`/`assertVersieBewerkbaar` (seizoenscheck, geen auth). Elke ingelogde gebruiker kan werkindelingen hernoemen, spelers verplaatsen en werkindelingen verwijderen.

Fix: `await requireTC()` als eerste statement in elk van de vijf functies.

Confidence: 90

### K4 — `getVersiesVoorDrawer` heeft geen auth guard
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.ts:45`

Leest versie-metadata én what-if vragen van een werkindeling zonder `requireTC()`. What-if vragen kunnen gevoelige TC-discussies bevatten.

Confidence: 85

### K5 — Geen rollback van optimistic update bij mislukte `speler_verplaatst` mutatie
`apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.ts:325-340`

`verplaatsSpeler` past de lokale state direct aan en stuurt daarna de mutatie. Als de server-PUT mislukt blijft de UI in de foutieve staat. De SSE-stream corrigeert dit alleen als andere gebruikers daarna mutaties uitvoeren — niet als rollback.

`onDropSpelerOpSelectieFn` (regel 279) heeft wel een server-side rollback, maar de lokale state-verwijdering van de bronlocatie wordt bij falen ook niet hersteld.

Confidence: 85

---

## Waarschuwing (tech debt, niet blokkerend)

### W1 — Zware `any`-casting op DB→component grens in `indeling/page.tsx`
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx:157-278`

Regels 157, 158, 159, 187, 219, 255, 272, 282, 294 casten Prisma-queryresultaten naar `any[]` bij het mappen naar `WerkbordTeam`/`WerkbordSpeler`. Schema-wijzigingen geven geen TypeScript-fouten, pas runtime.

Confidence: 90

### W2 — Lege `catch {}` blocks in SSE stream
`apps/web/src/app/api/ti-studio/indeling/[versieId]/stream/route.ts:25,40,48,60,69`

Vijf lege catch-blocks. Schending van ESLint `no-empty` (error) en projectrichtlijn. De catch op regel 25 (DB-verbindingsfout) retourneert wel een 503 maar logt niets.

Confidence: 88

### W3 — Lokale constante `HUIDIG_SEIZOEN_EINDJAAR = 2026` i.p.v. import van `PEILJAAR`
`apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx:8`

Schending van projectregel: importeer `PEILJAAR` uit `@oranje-wit/types`, definieer niet lokaal.

Fix: `import { PEILJAAR } from "@oranje-wit/types"` + gebruik `seizoenEindjaar={PEILJAAR}`.

Confidence: 95

### W4 — `stuurMutatie` logt geen warning bij `!resp.ok`
`apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.ts:307-323`

Non-2xx HTTP-responses worden stil genegeerd. `logger.warn` is alleen bereikbaar bij een thrown exception, niet bij HTTP-foutresponse. Stil dataverlies mogelijk.

Confidence: 82

### W5 — `onDropSpelerOpSelectieFn` faalt stil bij server error
`apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.ts:279-282`

Als `voegSelectieSpelerToe` mislukt wordt `verwijderSelectieSpeler` fire-and-forget aangeroepen. Geen lokale state rollback, geen gebruikersfeedback, geen logging.

Confidence: 82

### W6 — `logger.info` gebruikt in productie server actions
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts:43,69,84`, `drawer-actions.ts:152`, `versies-actions.ts:27,82`, `whatif-resolve-actions.ts:205`

CLAUDE.md: "`logger.info` alleen in development." Operationele events worden gelogd met `logger.info` — in productie mogelijk gesuppressed.

Confidence: 88

### W7 — `ussScore` is placeholder-berekening
`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx:264`

USS-score wordt berekend als `Math.round((6.2 + ((team.volgorde * 0.17 + i * 0.31) % 2.1)) * 100) / 100`. Dummy-formule, misleidend voor TC-gebruikers bij "Score" toggle.

---

## Info (observaties)

**Data flow speler drop → state → PUT → DB: volledig aanwezig**
Het volledige pad is aanwezig: `SpelerKaart.onDragStart` → `TeamKaart.handleDrop` → `WerkbordCanvas.onDropSpelerOpTeam` → `useWerkbordState.verplaatsSpeler` → optimistic lokale update + `stuurMutatie` POST → `prisma.teamSpeler.upsert` → `pg_notify` → SSE terugkoppeling. Rollback op falen ontbreekt (K5).

**SSE implementatie: functioneel correct, cleanup adequaat**
`LISTEN` bij start, `UNLISTEN` + `pgClient.end()` in abort-handler én `cancel()`. Keepalive elke 25 seconden. Eigen sessie-filtering via `sessionId`. Dubbele cleanup is defensief maar kan "already closed" race veroorzaken — gevangen door lege catches (W2).

**API contract: klopt**
Het type dat `/api/ti-studio/indeling/[versieId]` retourneert matched wat `useWerkbordState.stuurMutatie` verwacht. Zod-schema voor request body klopt met de drie mutatietypen.

**Dubbele `@keyframes dropLandSpeler` definitie**
`TeamKaartSpelerRij.tsx` en `SpelerKaart.tsx` definiëren dezelfde animatie in inline `<style>` tags. Functioneel OK.

**`_zoneGeslacht` bewust genegeerd**
`TeamKaart.tsx:114`: drop-zone (V/M) genegeerd, speler altijd op basis van `data.speler.geslacht`. Korfbal-logisch, `_` prefix bevestigt intentie.

---

## Samenvatting

**Totaal kritisch: 5 | Totaal waarschuwingen: 7**

Meest urgent: ontbrekende auth guards (K1–K4). `verwerpWhatIf` heeft helemaal geen auth, `pasWhatIfToe` alleen conditioneel, vijf write-actions missen `requireTC()`. Dit zijn de enige bevindingen die directe toegangscontrole-omzeiling mogelijk maken.

K5 (ontbrekende rollback) is een data-integriteitsrisico bij netwerkstoringen.
