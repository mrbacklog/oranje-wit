# Implementatieplan — Team-/Selectie-presentatielaag (Coverflow)

**Datum:** 2026-06-04
**App:** `apps/ti-studio` (v1, Next.js 16, dark-first)
**Status:** Plan geverifieerd tegen de werkelijke codebase. Klaar om te bouwen.
**Bron:** `../2026-06-04-team-presentatie-coverflow-design.md` (design-spec) + `HANDOVER.md` (hiernaast).

**Vastgelegde beslissingen (defaults, niet opnieuw afwegen):**
- Route-slug: `/presentatie`
- Carrousel: Swiper.js `effect: "coverflow"` (zacht: rotate 0–15°, vooral scale + lichte depth, spacing zodat geen overlap; center ±430px, zijkaarten ±300px @ ~95%).
- Speler-chip: **bewust dupliceren** als read-only component (geen geforceerde werkbord-refactor) — zie Deel B.

---

## Deel A — Verificatie van de codebase-ankers

| Anker (uit spec/handover) | Status | Werkelijkheid |
|---|---|---|
| `werkbord/Ribbon.tsx` — RibbonBtn-patroon | ✅ | `Ribbon` neemt **callback-props** (`onNaarIndeling`, `onNaarKader`, …) + `activeRoute`. Helper `RibbonBtn({ tip, active, onClick, children })`. **Nieuw item vereist een nieuwe prop in `RibbonProps` + doorgeven vanuit de shell** (geen router in Ribbon zelf). |
| `werkbord/TiStudioPageShell.tsx` — navigatie | ✅ | Client-component. Rendert `<Ribbon … onNaarX={() => router.push("/x")} activeRoute={pathname} />`. Heeft `isWerkbord = pathname.startsWith("/indeling")`-tak: werkbord = full-height zonder padding, overige = scrollbare `<main>` met padding. **Relevant voor de carrousel-layout (zie risico's).** |
| `TeamKaart.tsx` — `KNKV_KLEUR`, `bouwSubtitel`, `dedupeStaf`, `StafFooterIcoon`, `TrainerIcoon` | ⚠️ deels | Pad ✅. Alle vijf bestaan, **maar geen enkele is geëxporteerd** (module-private). `KNKV_KLEUR` mist key `paars`. → **kopiëren of extraheren naar gedeeld bestand**, niet importeren. |
| `SpelerKaart.tsx` — avatar/badges/statuswaas | ✅ | Component geëxporteerd maar **drag-georiënteerd** (`draggable`, pointer-capture, drag-image) + `usePeildatum()`-context. Voor read-only ongeschikt om 1:1 te hergebruiken; de **statuswaas/badge-logica** (`waasAchtergrond`, `isAR`/`isStopt`/`stopGezet`, badges) is de bron om te dupliceren. |
| `werkbord/leeftijds-kleuren.ts` — `leeftijdsKleur` | ✅ | `export function leeftijdsKleur(leeftijd)` + `leeftijdsGradient(leeftijd)`. Direct importeerbaar. |
| `indeling/werkindeling-actions.ts` — `getWerkindelingVoorEditor` | ⚠️ | Functie ✅, **maar:** (a) return-type is **niet** `ActionResult` — rauw object of `null`; (b) `werkitems: []` wordt **hardcoded leeg** gezet → memo's apart ophalen; (c) neemt `werkindelingId: string` — via `getOfMaakWerkindelingVoorSeizoen()` uit `indeling/actions.ts`. |
| `indeling/team-config-actions.ts` | ✅ | Referentie voor datamodel-mapping (`KLEUR_MAP`, `TEAM_TYPE_MAP`) + `ActionResult<T>`/`requireTC()`-patroon. |
| Route-map `(protected)/presentatie/` | ✅ bestaat niet | Aan te maken. |
| Swiper.js in `package.json` | ⚠️ ontbreekt | **Niet aanwezig.** Wél: `framer-motion`, `@react-spring/web`, `@use-gesture/react`, `@dnd-kit/*`. → `pnpm --filter @oranje-wit/ti-studio add swiper`. |
| Memo-systeem (`/memo`) | ✅ | Read-model: `prisma.werkitem.findMany({ where: { kadersId, type: "MEMO" }, include: { team, speler, staf, toelichtingen, activiteiten } })`. Counts: `prisma.werkitem.groupBy({ by: ["teamId"], where: { kadersId, type:"MEMO", status: { in:["OPEN","IN_BESPREKING"] } } })`. Mutatie-acties in `indeling/werkitem-actions.ts` (niet nodig — read-only). |
| `SelectieGroep`/`gebundeld` | ✅ | `schema.prisma:833` `model SelectieGroep { gebundeld Boolean @default(false); teams Team[]; spelers SelectieSpeler[]; staf SelectieStaf[] }`. Businessregel (ti-studio/CLAUDE.md, 2026-04-14): `gebundeld=true` → pool via `SelectieSpeler/SelectieStaf`, anders via `TeamSpeler/TeamStaf`. |

**Extra bevestigd:**
- `ActionResult<T>` → `packages/types/src/api.ts`.
- Korfballeeftijd → `packages/types/src/korfballeeftijd.ts`: `korfbalPeildatum(seizoen)`, `berekenKorfbalLeeftijd(geboortedatum, geboortejaar, peildatum)`, `formatKorfbalLeeftijd(leeftijd)`. Uit `@oranje-wit/types`.
- **Dev draait op poort 3001** (`next dev --turbopack --port 3001`), niet 3000. Lokaal: `pnpm --filter @oranje-wit/ti-studio dev` → `http://localhost:3001/presentatie`.

---

## Deel B — Beslissing speler-chip (extract vs. dupliceren)

**Criterium:** extraheer alleen als de gedeelde chip *zonder gedragsverandering* van het werkbord kan.

`SpelerKaart.tsx` is verweven met drag (draggable, pointer-capture, `onDragStart` met drag-image, `vanTeamId`/`vanSelectieGroepId`) en met `usePeildatum()`-context.

**Conclusie: bewust dupliceren.** Een read-only `SpelerPresentatieRij.tsx` herimplementeert de *visuele* logica (avatar + `leeftijdsKleur`-ring, geslachtskleur, `waasAchtergrond`, badges N/?/AR/blessure/⚠/doorhaling) zonder drag-handlers en met peildatum als **prop**. Extraheren zou een geforceerde werkbord-refactor vergen (context loskoppelen, drag-props optioneel maken) — buiten v1-scope. Duplicatie is klein/geïsoleerd; documenteer dit in een comment bovenaan het bestand.

---

## Deel C — Bestand-voor-bestand changelist

### Nieuw aan te maken

```
apps/ti-studio/src/app/(protected)/presentatie/
├── page.tsx                       # server component: data ophalen, client-carrousel renderen
├── actions.ts                     # getTeamsVoorPresentatie(): ActionResult<PresentatieTeam[]>
├── presentatie-types.ts           # PresentatieTeam, PresentatieSpeler, PresentatieStaf, PresentatieOpmerking
└── _components/
    ├── PresentatieCarousel.tsx    # 'use client' — Swiper coverflow + filter-state
    ├── PresentatieFilterBar.tsx   # 'use client' — sticky radio-filter
    ├── TeamPresentatieKaart.tsx   # 'use client' — fidelity-prop "center" | "side"
    ├── SpelerPresentatieRij.tsx   # 'use client' — read-only speler-chip (gedupliceerd)
    └── StafPresentatieLijst.tsx   # 'use client' — staf-kaartjes met rol
```
Plus optioneel `_components/knkv-kleur.ts` (kopie van `KNKV_KLEUR`-map + `bouwSubtitel`-logica uit `TeamKaart.tsx`, omdat die daar niet geëxporteerd zijn).

### Te wijzigen

1. **`werkbord/Ribbon.tsx`** — `RibbonProps` uitbreiden met `onNaarPresentatie: () => void`; nieuw `<RibbonBtn tip="Presentatie" active={activeRoute.includes("/presentatie")} onClick={onNaarPresentatie}>` (na Personen / vóór de scheidingslijn). Inline-SVG 17×17, `stroke="currentColor"`.
2. **`werkbord/TiStudioPageShell.tsx`** — `onNaarPresentatie={() => router.push("/presentatie")}` doorgeven. Overweeg `/presentatie` als full-bleed te behandelen (zie risico 2).
3. **`apps/ti-studio/package.json`** — `swiper` toevoegen.

---

## Deel D — Server-action `getTeamsVoorPresentatie()`

Bestand: `(protected)/presentatie/actions.ts`, `"use server"`.

```ts
export async function getTeamsVoorPresentatie(): Promise<ActionResult<PresentatieTeam[]>> {
  try {
    await requireTC();
    const werkindeling = await getOfMaakWerkindelingVoorSeizoen(); // uit ../indeling/actions
    if (!werkindeling) return { ok: true, data: [] };
    const volledig = await getWerkindelingVoorEditor(werkindeling.id);
    if (!volledig) return { ok: true, data: [] };

    const kadersId = volledig.kaders.id;
    const seizoen = volledig.kaders.seizoen as Seizoen;
    const peildatum = korfbalPeildatum(seizoen);
    const versie = volledig.versies[0];

    // Memo's apart (getWerkindelingVoorEditor zet werkitems: [])
    const teamMemos = await prisma.werkitem.findMany({
      where: { kadersId, type: "MEMO", teamId: { not: null } },
      select: { teamId: true, beschrijving: true, titel: true, status: true, type: true, createdAt: true },
    });
    // groeperen per teamId, open-count = status OPEN | IN_BESPREKING

    // Map versie.teams + versie.selectieGroepen → PresentatieTeam[]
    //  - gebundelde SelectieGroep => 1 kaart met gepoolde spelers/staf (SelectieSpeler/SelectieStaf)
    //  - ongebundeld => losse team-kaarten (TeamSpeler/TeamStaf), filter-groepering apart
    return { ok: true, data: teams };
  } catch (error) {
    logger.error("getTeamsVoorPresentatie mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

**Hergebruikte bron:** `getWerkindelingVoorEditor(werkindelingId)` → per versie `teams` (`spelers.include.speler`, `staf.include.staf`, `volgorde`) + `selectieGroepen` (`spelers`/`staf` includes + `gebundeld`, `naam`). Memo's apart via `prisma.werkitem`.

**Velden per `PresentatieTeam` (spec §7):**
- `id`, `naam`, `kleur` (lowercase token), `teamCategorie`, `teamType` (viertal/achttal), `niveau`/poule, `volgorde`, `isSelectie`/`gebundeld`, `selectieNaam`.
- `dames[]` / `heren[]` als `PresentatieSpeler`: `relCode` (= `speler.id`, **enige sleutel**), `roepnaam`, `achternaam`, `tussenvoegsel`, `geslacht`, `geboortedatum`/`geboortejaar`, `fotoUrl` (`heeftFoto ? "/api/scouting/spelers/{relCode}/foto" : null`), `status` (effectief), `isNieuw`, `huidigTeam`. **Korfballeeftijd NIET als getal serveren** — geef geboortedatum/-jaar + lever `peildatum` aan de client, die rekent met de helpers.
- `staf[]` als `PresentatieStaf`: `stafId`, `naam`, `rol` — gededupeerd voor selecties (kopie `dedupeStaf` op `stafId`).
- Afgeleiden: `aantalDames`, `aantalHeren`, `gemiddeldeLeeftijd`, `validatieCount`/aandachtspunten, `openMemoCount`.
- `opmerkingen[]` als `PresentatieOpmerking`: `{ bron, type, status, datum (ISO), tekst }` — alleen team-MEMO's.

**Conventies:** `ActionResult<PresentatieTeam[]>`; `requireTC()`; `logger` uit `@oranje-wit/types`; geen mutaties/`revalidatePath`; alle `Date` → `toISOString()` vóór de client-grens.

**page.tsx** (server, `export const dynamic = "force-dynamic"`): roept de action aan; `ok:false` → nette foutstaat; `ok:true` → `<PresentatieCarousel teams={data} peildatum={…} />`.

---

## Deel E — Ribbon-item + shell-navigatie

`Ribbon.tsx`:
```ts
interface RibbonProps {
  // …bestaand
  onNaarPresentatie: () => void;
}
```
```tsx
<RibbonBtn tip="Presentatie" active={activeRoute.includes("/presentatie")} onClick={onNaarPresentatie}>
  {/* inline SVG 17×17, stroke=currentColor, stijl gelijk aan andere icons */}
</RibbonBtn>
```
`TiStudioPageShell.tsx`, in de `<Ribbon …>`-render: `onNaarPresentatie={() => router.push("/presentatie")}`.

---

## Deel F — Coverflow-config (Swiper)

`PresentatieCarousel.tsx` = `"use client"`:
```ts
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Mousewheel, Keyboard, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
```
```tsx
<Swiper
  modules={[EffectCoverflow, Mousewheel, Keyboard, Pagination]}
  effect="coverflow"
  grabCursor
  centeredSlides
  slidesPerView="auto"
  spaceBetween={40}
  mousewheel={{ forceToAxis: true }}
  keyboard={{ enabled: true }}
  pagination={{ clickable: true }}
  coverflowEffect={{ rotate: 8, stretch: 0, depth: 120, scale: 0.95, slideShadows: false, modifier: 1 }}
  style={{ paddingBlock: 24 }}
>
  {teams.map((t) => (
    <SwiperSlide key={t.id} style={{ width: 430 }}>
      {({ isActive }) => (
        <TeamPresentatieKaart team={t} peildatum={peildatum} fidelity={isActive ? "center" : "side"} />
      )}
    </SwiperSlide>
  ))}
</Swiper>
```
- Slide-breedte `430px` = center-doel; zijkaarten via `scale: 0.95` + `spaceBetween` als overlap-buffer.
- Filter narrowt de `teams`-array.
- "Vrij houden / vergelijken": coverflow snapt standaard naar dichtstbijzijnde slide; `freeMode`/`resistanceRatio` later afstemmen — niet vereist voor v1-acceptatie.

---

## Deel G — OW-conventies

- `logger` uit `@oranje-wit/types`; **nooit** `console.log`.
- Korfballeeftijd uitsluitend via `berekenKorfbalLeeftijd`/`formatKorfbalLeeftijd` met `korfbalPeildatum(seizoen)`; peildatum als **prop** (niet de werkbord-`usePeildatum`-context overnemen).
- `rel_code` (= `speler.id`) is de enige speler-sleutel; geen naam-matching.
- Dark-first: alleen `var(--ow-*)` / bestaande tokens. Geen hardcoded kleuren (Ribbon's logo-gradient is bestaande code, niet kopiëren). Importeer `tokens.css` zoals de werkbord-componenten.
- Server actions → `ActionResult<T>`, `requireTC()`, read-only (geen `revalidatePath`).
- Taal Nederlands, informeel/direct.

---

## Deel H — Bouwvolgorde (met verificatie)

1. **Data-laag.** `swiper` toevoegen; `presentatie-types.ts` + `actions.ts`. *Test:* tijdelijk `JSON.stringify(data)` in `page.tsx` → teams, gepoolde selecties, ♀/♂-counts, staf-dedupe, opmerkingen.
2. **Route + shell + ribbon.** `page.tsx` (placeholder), Ribbon-prop + shell-callback. *Test:* menu-item zichtbaar/actief, navigatie werkt, `(protected)`-guard actief.
3. **Carrousel-skelet.** `PresentatieCarousel.tsx` + kaartstub. *Test:* 3 kaarten leesbaar, geen overlap, muiswiel/drag/klik-op-zijkaart, paginatie.
4. **Center-kaart.** `TeamPresentatieKaart` (`fidelity="center"`): header (kleurstrip, categorie-driehoek, naam, `bouwSubtitel`, meta-pills), spelers in 2 kolommen via `SpelerPresentatieRij`. *Test:* leeftijdsring, statuswaas/badges vs. werkbord; leeftijd via helpers.
5. **Filter.** `PresentatieFilterBar` sticky radio (Categorie / Selecties / Kleur met `KNKV_KLEUR`-bolletjes). *Test:* één filter actief, set narrowt, center re-centreert.
6. **Staf + opmerkingen.** `StafPresentatieLijst` (groen accent, rol, dedupe) + opmerkingen-blok (oranje accent, bron·type·datum). *Test:* gedeelde selectie-staf één keer; alleen team-MEMO's, read-only.
7. **Polish + side-variant.** `fidelity="side"` compacter (1 kolom kernspelers, geen opmerkingen), responsive breakpoints (center 430→500px), animaties. *Test:* breed scherm groeit center mee; smaller blijft 3-leesbaar.

---

## Deel I — Verificatie / E2E

- Lokaal: `pnpm --filter @oranje-wit/ti-studio dev` → `http://localhost:3001/presentatie` (**poort 3001**).
- E2E (Playwright, auth-bypass):
  - Navigatie: Presentatie-ribbon → URL `/presentatie`, carrousel zichtbaar.
  - **3 kaarten zichtbaar:** ≥3 `SwiperSlide`-kaarten visible, center heeft `swiper-slide-active`.
  - Interactie: muiswiel/`ArrowRight` verandert actieve slide; klik op zijkaart centreert.
  - Read-only: geen drag-handles, geen mutatie-endpoints/`AgentMutatie`. Géén cleanup nodig (geen writes).
  - Filter: elk filter → correcte subset.

---

## Deel J — Risico's / aandachtspunten

1. **SSR / `'use client'`.** Swiper = client-side; alle interactieve `_components` krijgen `"use client"`. `page.tsx` blijft server. Swiper-CSS in de client-component importeren.
2. **Layout-conflict met de shell.** Niet-werkbord-pagina's krijgen een scrollbare `<main>` met padding. Full-bleed coverflow wil dat misschien niet → overweeg `/presentatie` als `isWerkbord`-tak (full-height, geen padding) of geef de carrousel een eigen `height:100%`-container. Visueel bevestigen.
3. **Bundle-grootte.** Swiper ~30–50KB; ok voor desktop-only. Alleen de gebruikte modules importeren.
4. **Responsive breakpoints.** Center 430→500px via `breakpoints` of viewport-afgeleide slide-`width`; `spaceBetween` mee schalen zodat "3 leesbaar, geen overlap" blijft.
5. **Hergebruik-illusie.** `KNKV_KLEUR`/`bouwSubtitel`/`dedupeStaf`/`StafFooterIcoon`/`TrainerIcoon` zijn **niet geëxporteerd** → kopiëren of werkbord-bestand uitbreiden met exports (kleine, veilige wijziging). `KNKV_KLEUR` mist `paars` (map paars→blauw).
6. **`getWerkindelingVoorEditor` quirks.** Geen `ActionResult`, `werkitems: []` → zelf wikkelen + memo's apart. `null`-paden afvangen met lege lijst.
7. **Selectie-pool.** `gebundeld=true` → `SelectieSpeler/SelectieStaf`; `gebundeld=false` → losse teams, onder "Selecties"-filter groeperen. Toets met `regel-checker`/validatie.
8. **Datum-serialisatie.** `geboortedatum` + memo-`createdAt` → ISO-string vóór server→client (zoals `indeling/page.tsx`, `memo/page.tsx`).

---

## Critical files

- `apps/ti-studio/src/app/(protected)/presentatie/actions.ts` (nieuw — data-action)
- `apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.ts` (`getWerkindelingVoorEditor` — bron)
- `apps/ti-studio/src/components/werkbord/TeamKaart.tsx` (kaart-stijl + `KNKV_KLEUR`/`bouwSubtitel`/`dedupeStaf` om te kopiëren)
- `apps/ti-studio/src/components/werkbord/Ribbon.tsx` + `TiStudioPageShell.tsx` (menu + navigatie)
- `apps/ti-studio/src/components/werkbord/SpelerKaart.tsx` (status/badge/waas-logica om te dupliceren)
