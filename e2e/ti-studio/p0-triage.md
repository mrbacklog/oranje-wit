# P0-triage — TI Studio

Uitgevoerd op 2026-04-11. Bronbestanden onderzocht: `TiStudioShell.tsx`, `TeamKaart.tsx`, `WerkbordCanvas.tsx`, `useWerkbordState.ts`, `validatie-engine.ts`, `page.tsx`. `ValidatieDrawer.tsx` bestaat **niet** in de main branch (alleen in worktrees).

---

## P0-items

| Item | Al geïmplementeerd? | Blokkerend? | Workaround | Complexiteit | Advies |
|---|---|---|---|---|---|
| Kaartformaat auto-update (viertal→achtal bij ≥5 spelers) | **nee** | nee | TC sleept naar achtal-team in plaats van viertal; formaat staat vast na aanmaken | klein | fix |
| V/M-balans validatie in ValidatieDrawer | **nee** (ValidatieDrawer bestaat niet in main) | nee | TeamDrawer toont validatie-dot + count; validatie-engine berekent dames/heren-min/max wel correct | middel | fix |
| Toast bij opslaan succes/fout | **nee** | nee | Optimistic UI werkt stil; bij API-fout blijft UI intact maar TC ziet geen feedback | klein | fix |
| Speler-duplicaat blokkeren met UI-feedback | **gedeeltelijk** | ja | `handleDrop` in `TeamKaart.tsx` blokkeert drop als `vanTeamId === team.id` (zelfde team), maar blokkeert **niet** als speler al in een ander team zit. Geen visuele feedback. | klein | fix |

---

## Toelichting per P0-item

### 1. Kaartformaat auto-update
`verplaatsSpelerLokaal` in `useWerkbordState.ts` past het `formaat`-veld van een team nooit aan — het formaat is initieel bepaald op basis van `teamType` in de DB en wijzigt alleen bij selectie-koppeling/ontkoppeling. Er is geen trigger op spelertotaal ≥5. Blokkerend is dit **niet**: een achtal-team accepteert gewoon meer spelers en de dropzone heeft ruimte voor 8. Het risico is dat een viertal-team visueel krap wordt bij overplaatsing, maar dagelijks gebruik is mogelijk.

### 2. V/M-balans validatie (ValidatieDrawer)
`ValidatieDrawer.tsx` bestaat **niet** in de main branch. De `validatie-engine.ts` bevat wel volledige dames/heren-min/max logica (regels 100-136) en V/M-balans wordt correct berekend. De validatie-uitkomst is zichtbaar via de gekleurde dot op elke teamkaart en de `validatieCount` in de footer. Afzonderlijke drawer ontbreekt, maar de TC kan via TeamDrawer de validatie inzien. **Niet blokkerend**, maar de workaround vereist extra klikken.

### 3. Toast bij opslaan succes/fout
Geen `Toast.tsx`, geen `sonner`, geen `alert()` — nergens in `TiStudioShell.tsx` of `useWerkbordState.ts`. Mutaties worden via `stuurMutatie()` fire-and-forget verstuurd. Bij API-fout logt het systeem `logger.warn("stuurMutatie fout ...")` maar de TC ziet niets. Risico: stille dataverlies bij netwerkstoringen. Niet acuut blokkerend maar onwenselijk voor productie.

### 4. Speler-duplicaat blokkeren
`handleDrop` in `TeamKaart.tsx` (regel 121) checkt alleen `data.vanTeamId === team.id` (al in hetzelfde team). Als een speler al in **een ander team** zit en opnieuw gedropt wordt, voert `verplaatsSpelerLokaal` de verplaatsing door: de speler verschijnt in twee teams tegelijk totdat de API de validatie teruggeeft. Er is geen visuele blokkering, geen warning, geen rollback bij duplicaat. Dit is **blokkerend** voor betrouwbaar gebruik.

---

## P1-items (korte scan)

| Item | Al geïmplementeerd? |
|---|---|
| Canvas panning (achtergrond slepen) | **ja** — `handleBgMouseDown` + `panState` volledig geïmplementeerd in `WerkbordCanvas.tsx` |
| Validatielogica leeftijdscategorieën (KNKV) | **ja** — `validatie-engine.ts` bevat leeftijdsbandbreedte + max leeftijd per speler (regels 164-196) |
| Kaartposities laden uit DB bij page-load | **ja** — `page.tsx` leest `versie.posities` (regel 154) en past canvas X/Y toe met grid-fallback |
| SSE-verbindingsindicator | **nee** — `useWerkbordState.ts` opent EventSource maar toont geen UI-indicator voor verbindingsstatus; disconnect wordt niet zichtbaar gemeld |

---

## Aanbeveling

### Voor release (P0-fixes, alle klein-middel)

**Fix nu (blokkerend):**
- **Duplicaat blokkeren**: voeg check toe in `verplaatsSpelerLokaal` — als `alleSpelers[id].teamId !== null && teamId !== naarTeamId`, blokkeer de drop en toon inline warning op de kaart. Geschatte tijd: ~1u.

**Fix voor productie (niet blokkerend maar verwacht door TC):**
- **Toast bij opslaan**: voeg een lichtgewicht toast-mechanisme toe (native of sonner). Koppel aan `stuurMutatie` succes/fout. ~45 min.
- **ValidatieDrawer**: bestaande worktree-versie (`.worktrees/versies-whatif-drawer`) is functioneel en toont echte data via `validatie`-prop. Port naar main. ~1-2u.
- **Kaartformaat auto-update**: voeg in `verplaatsSpelerLokaal` een check toe: als resulterende `dames + heren >= 5` en `formaat === "viertal"`, zet formaat op `achtal`. ~30 min.

### Na release (P1)
- **SSE-indicator**: klein maar verbetert vertrouwen bij meerdere TC-leden die tegelijk werken. ~1u.
