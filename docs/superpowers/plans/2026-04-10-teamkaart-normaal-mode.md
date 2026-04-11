# Teamkaart Normaal Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Herontwerp de normaal-mode teamkaart (80–120% zoom) met spelersrijen van 1 regel hoog (stip · naam · korfballeeftijd), stafsectie in paars, en dynamische kaarthoogte.

**Architecture:** Zes gerichte aanpassingen in volgorde: (1) zoom-drempel + CSS-token, (2) frontend types uitbreiden, (3) staf-data surfacen vanuit bestaande server-query, (4) NormaalSpelerRij component, (5) TeamKaart normaal-mode body vervangen, (6) WerkbordCanvas minimap aanpassen. Geen nieuwe bestanden — alles gaat in bestaande files.

**Tech Stack:** Next.js 16, React (client components), TypeScript, inline styles, Vitest

---

## Bestandsoverzicht

| Bestand | Wijziging |
|---|---|
| `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts` | `< 1.0` → `< 1.2` |
| `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts` | Tests aanpassen voor nieuwe drempel |
| `apps/web/src/components/ti-studio/werkbord/tokens.css` | `--purple: #a855f7;` toevoegen |
| `apps/web/src/components/ti-studio/werkbord/types.ts` | `WerkbordStafInTeam` + `staf` op `WerkbordTeam` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` | Staf mappen naar `WerkbordTeam.staf` |
| `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx` | `NormaalSpelerRij` component + prop `isNormaal` |
| `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx` | Normaal-mode body, stafsectie, dynamische hoogte |
| `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx` | Minimap `KAART_HOOGTE` vervangen door schatting |

---

### Task 1: Zoom-drempel aanpassen + tests bijwerken

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts:11`
- Modify: `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts`

- [ ] **Stap 1: Schrijf de falende tests**

Vervang de volledige inhoud van `useZoom.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoom } from "./useZoom";

describe("useZoom", () => {
  it("begint op 0.75 — compact (onder breakpoint 0.80)", () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoom).toBe(0.75);
    expect(result.current.zoomLevel).toBe("compact");
  });

  it("zoomLevel is normaal bij zoom >= 0.80 en < 1.20", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.8));
    expect(result.current.zoomLevel).toBe("normaal");
    act(() => result.current.setZoom(1.0));
    expect(result.current.zoomLevel).toBe("normaal");
    act(() => result.current.setZoom(1.19));
    expect(result.current.zoomLevel).toBe("normaal");
  });

  it("zoomLevel is compact bij zoom < 0.80", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.79));
    expect(result.current.zoomLevel).toBe("compact");
    act(() => result.current.setZoom(0.5));
    expect(result.current.zoomLevel).toBe("compact");
  });

  it("zoomLevel is detail bij zoom >= 1.20", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(1.2));
    expect(result.current.zoomLevel).toBe("detail");
    act(() => result.current.setZoom(1.5));
    expect(result.current.zoomLevel).toBe("detail");
  });

  it("clamp: zoom blijft tussen 0.4 en 1.5", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.1));
    expect(result.current.zoom).toBe(0.4);
    act(() => result.current.setZoom(9.9));
    expect(result.current.zoom).toBe(1.5);
  });
});
```

- [ ] **Stap 2: Draai tests — verwacht FAIL**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm test -- --testPathPattern="useZoom"
```

Verwacht: FAIL — "zoomLevel is normaal bij zoom >= 0.80 en < 1.20" en "zoomLevel is detail bij zoom >= 1.20" mislukken.

- [ ] **Stap 3: Pas de drempel aan in useZoom.ts**

In `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts`, vervang regel 12:

```ts
// Voor
  if (zoom < 1.0) return "normaal";

// Na
  if (zoom < 1.2) return "normaal";
```

- [ ] **Stap 4: Draai tests — verwacht PASS**

```bash
pnpm test -- --testPathPattern="useZoom"
```

Verwacht: 5/5 PASS.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts
git commit -m "feat(ti-studio): normaal-mode drempel 80-119%, detail >= 120%"
```

---

### Task 2: --purple token + types uitbreiden

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/tokens.css`
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts`

- [ ] **Stap 1: Voeg --purple token toe aan tokens.css**

Voeg na `--blue: #60a5fa;` de volgende regel toe:

```css
  --purple: #a855f7;
```

Zodat de sectie eruitziet als:
```css
  --pink: #ec4899;
  --blue: #60a5fa;
  --purple: #a855f7;

  --cat-blauw: #3b82f6;
```

- [ ] **Stap 2: Voeg WerkbordStafInTeam toe aan types.ts**

Voeg na de `WerkbordSpelerInTeam` interface (na regel 47) het volgende toe:

```ts
export interface WerkbordStafInTeam {
  id: string;
  stafId: string;
  naam: string;
  rol: string;
}
```

- [ ] **Stap 3: Voeg staf-veld toe aan WerkbordTeam**

In `WerkbordTeam`, voeg na `heren: WerkbordSpelerInTeam[];` het volgende toe:

```ts
  staf: WerkbordStafInTeam[];
```

- [ ] **Stap 4: Typecheck**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: typefouten in `page.tsx` (staf-veld ontbreekt nog) — dat is normaal en wordt opgelost in Task 3. Geen andere fouten.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/tokens.css apps/web/src/components/ti-studio/werkbord/types.ts
git commit -m "feat(ti-studio): --purple token + WerkbordStafInTeam type"
```

---

### Task 3: Staf-data surfacen in page.tsx

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx:165-189`

De server-query haalt al `staf: { include: { staf: true } }` op (regel 83 in werkindeling-actions.ts). In page.tsx ontbreekt alleen de mapping naar `WerkbordTeam.staf`.

- [ ] **Stap 1: Voeg de staf-mapping toe in het return-object van de teams.map()**

Zoek in `page.tsx` naar het `return {` van de teams.map, na regel ~165. Voeg `staf:` toe voor `notitie: null`:

```ts
    staf: (team.staf as any[]).map((ts: any) => ({
      id: ts.id,
      stafId: ts.stafId,
      naam: ts.staf?.naam ?? "?",
      rol: ts.rol ?? "",
    })),
```

Het volledige return-blok eindigt dan zo (de `staf`-regel vóór `notitie`):

```ts
    return {
      id: team.id,
      naam: team.naam,
      categorie: String(team.categorie),
      kleur,
      formaat,
      volgorde: team.volgorde,
      canvasX: 40 + col * 320,
      canvasY: 60 + rij * 240,
      dames,
      heren,
      staf: (team.staf as any[]).map((ts: any) => ({
        id: ts.id,
        stafId: ts.stafId,
        naam: ts.staf?.naam ?? "?",
        rol: ts.rol ?? "",
      })),
      notitie: null,
      ussScore: ...,
      // (rest ongewijzigd)
    };
```

- [ ] **Stap 2: Typecheck — verwacht geen fouten**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: 0 fouten.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git commit -m "feat(ti-studio): staf surfacen in WerkbordTeam vanuit server-query"
```

---

### Task 4: NormaalSpelerRij component

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx`

- [ ] **Stap 1: Schrijf test voor berekenKorfbalLeeftijd — exporteer de functie eerst**

Maar wacht — `berekenKorfbalLeeftijd` staat in `SpelerKaart.tsx`. Voor de `NormaalSpelerRij` kopiëren we de logica inline als lokale hulpfunctie. Geen aparte test nodig (de functie is al getest via SpelerKaart). Ga direct naar implementatie.

- [ ] **Stap 2: Voeg de NormaalSpelerRij-component toe aan TeamKaartSpelerRij.tsx**

Pas eerst de props-interface aan en de switch-logica, dan voeg je de component toe onderaan het bestand.

**Nieuwe interface en export-functie (vervang de huidige):**

```tsx
const HUIDIG_SEIZOEN_EINDJAAR = 2026;

interface TeamKaartSpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  zoomLevel: "compact" | "normaal" | "detail";
}

export function TeamKaartSpelerRij({ spelerInTeam, teamId, zoomLevel }: TeamKaartSpelerRijProps) {
  if (zoomLevel === "detail") {
    return (
      <SpelerKaart
        speler={spelerInTeam.speler}
        vanTeamId={teamId}
        seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
      />
    );
  }

  if (zoomLevel === "normaal") {
    return (
      <NormaalSpelerRij
        speler={spelerInTeam.speler}
        teamId={teamId}
      />
    );
  }

  return (
    <CompactSpelerRij
      speler={spelerInTeam.speler}
      teamId={teamId}
    />
  );
}
```

**Nieuwe NormaalSpelerRij component (voeg toe na de `CompactSpelerRij` component):**

```tsx
function berekenKorfbalLeeftijdNormaal(
  geboortedatum: string | null,
  geboortejaar: number,
  seizoenEindjaar: number
): number {
  if (geboortedatum) {
    const peildatum = new Date(seizoenEindjaar, 0, 1);
    const geboorte = new Date(geboortedatum);
    return Math.floor(((peildatum.getTime() - geboorte.getTime()) / (365.25 * 24 * 3600 * 1000)) * 100) / 100;
  }
  return seizoenEindjaar - geboortejaar;
}

function NormaalSpelerRij({ speler, teamId }: { speler: WerkbordSpeler; teamId: string }) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const stipKleur = geslacht === "v" ? "rgba(236,72,153,.7)" : "rgba(96,165,250,.7)";
  const naam = `${speler.roepnaam} ${speler.achternaam.charAt(0)}.`;
  const leeftijd = berekenKorfbalLeeftijdNormaal(
    speler.geboortedatum,
    speler.geboortejaar,
    HUIDIG_SEIZOEN_EINDJAAR
  );
  const leeftijdTekst = leeftijd.toFixed(2);

  return (
    <>
      {/* Verborgen SpelerKaart — alleen als drag-image bron */}
      <div
        ref={ghostRef}
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: 220,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <SpelerKaart
          speler={speler}
          vanTeamId={teamId}
          seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
          asGhost
        />
      </div>

      {/* Normaal rij */}
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData(
            "speler",
            JSON.stringify({ speler, vanTeamId: teamId })
          );
          e.dataTransfer.effectAllowed = "move";
          if (ghostRef.current) {
            e.dataTransfer.setDragImage(ghostRef.current, 20, 24);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 6px 0 8px",
          height: 21,
          flexShrink: 0,
          cursor: "grab",
          borderBottom: "1px solid rgba(255,255,255,.04)",
        }}
      >
        {/* Sekse-stip */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: stipKleur,
            flexShrink: 0,
          }}
        />
        {/* Naam */}
        <div
          style={{
            flex: 1,
            fontSize: 10.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--text-1)",
          }}
        >
          {naam}
        </div>
        {/* Korfballeeftijd */}
        <div
          style={{
            fontSize: 9,
            color: "var(--text-3)",
            flexShrink: 0,
            minWidth: 28,
            textAlign: "right",
          }}
        >
          {leeftijdTekst}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Stap 3: Typecheck**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: 1 typefout — `TeamKaart.tsx` geeft nog `isDetail` in plaats van `zoomLevel`. Dat wordt opgelost in Task 5.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
git commit -m "feat(ti-studio): NormaalSpelerRij — stip + naam + korfballeeftijd"
```

---

### Task 5: TeamKaart normaal-mode body vervangen

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`

Dit is de grootste taak. De normaal/detail section wordt volledig herschreven:
- `isDetail`-prop naar `TeamKaartSpelerRij` vervangen door `zoomLevel`
- Stafsectie toegevoegd boven de footer (alleen bij `staf.length > 0`)
- Vaste hoogte `kaartHoogte` verwijderd — kaart wordt `height: "auto"` in normaal/detail mode
- USS swap is al gedaan — controleer dat USS links staat, gem. leeftijd rechts in de footer

- [ ] **Stap 1: Verwijder de vaste hoogte-constanten en pas de outer div aan**

Verwijder bovenaan het bestand:
```ts
const KAART_HOOGTE_NORMAAL = 210;
const KAART_HOOGTE_DETAIL = 380;
```

Verwijder in de component:
```ts
const kaartHoogte = isDetail ? KAART_HOOGTE_DETAIL : KAART_HOOGTE_NORMAAL;
```

In de outer `<div>` style, vervang:
```ts
height: kaartHoogte,
```
door:
```ts
height: isCompact ? 210 : "auto",
```

- [ ] **Stap 2: Vervang de normaal/detail body**

Vervang het gehele `{/* ── NORMAAL / DETAIL MODE ── */}` blok (vanaf `{!isCompact && (` tot aan de sluitende `)}`) door de volgende nieuwe implementatie:

```tsx
{/* ── NORMAAL / DETAIL MODE ── */}
{!isCompact && (
  <div
    style={{
      padding: "0 0 0 14px",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Header — 34px, drag handle voor kaart verplaatsen */}
    <div
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onHeaderMouseDown(e, team.id);
      }}
      style={{
        height: 34,
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderBottom: "1px solid var(--border-0)",
        flexShrink: 0,
        paddingRight: 8,
        cursor: "grab",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {team.naam}
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 5px",
            borderRadius: 4,
            background: "rgba(236,72,153,.12)",
            color: "var(--pink)",
          }}
        >
          ♀ {team.dames.length}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 5px",
            borderRadius: 4,
            background: "rgba(96,165,250,.12)",
            color: "var(--blue)",
          }}
        >
          ♂ {team.heren.length}
        </span>
      </div>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: VAL_KLEUR[team.validatieStatus],
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenTeamDrawer(team.id);
        }}
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>

    {/* Spelers — achtal: 2 kolommen, viertal: 1 kolom */}
    <div
      style={{
        display: "flex",
        flexDirection: team.formaat === "viertal" ? "column" : "row",
      }}
    >
      {/* Dames kolom/sectie */}
      <div
        onDragOver={(e) => handleDragOver(e, "V")}
        onDragLeave={() => setDropOverGeslacht(null)}
        onDrop={(e) => handleDrop(e, "V")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: team.formaat === "viertal" ? "none" : "1px solid var(--border-0)",
          borderBottom: team.formaat === "viertal" ? "1px solid var(--border-0)" : "none",
          background: dropOverGeslacht === "V" ? "rgba(236,72,153,.07)" : "transparent",
          transition: "background 120ms ease",
          paddingRight: team.formaat === "viertal" ? 8 : 0,
        }}
      >
        {/* Kolomlabel */}
        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: "rgba(236,72,153,.65)",
            padding: "3px 8px 2px",
            borderBottom: "1px solid rgba(255,255,255,.04)",
          }}
        >
          Dames
        </div>
        {team.dames.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={team.id}
            zoomLevel={zoomLevel}
          />
        ))}
      </div>

      {/* Heren kolom/sectie */}
      <div
        onDragOver={(e) => handleDragOver(e, "M")}
        onDragLeave={() => setDropOverGeslacht(null)}
        onDrop={(e) => handleDrop(e, "M")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: dropOverGeslacht === "M" ? "rgba(96,165,250,.07)" : "transparent",
          transition: "background 120ms ease",
          paddingRight: 8,
        }}
      >
        {/* Kolomlabel */}
        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: "rgba(96,165,250,.65)",
            padding: "3px 8px 2px",
            borderBottom: "1px solid rgba(255,255,255,.04)",
          }}
        >
          Heren
        </div>
        {team.heren.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={team.id}
            zoomLevel={zoomLevel}
          />
        ))}
      </div>
    </div>

    {/* Stafsectie — alleen tonen als er staf is */}
    {team.staf.length > 0 && (
      <div
        style={{
          borderTop: "1px solid var(--border-0)",
          background: "rgba(255,255,255,.015)",
        }}
      >
        {team.staf.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px 0 0",
              height: 20,
            }}
          >
            {/* Staf-vierkantje */}
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: 2,
                background: "var(--purple)",
                opacity: 0.7,
                flexShrink: 0,
              }}
            />
            {/* Naam — rol */}
            <div
              style={{
                fontSize: 9.5,
                color: "rgba(168,85,247,.85)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
            >
              {s.naam} — {s.rol}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Footer — 26px */}
    <div
      style={{
        height: 26,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px 0 0",
        borderTop: "1px solid var(--border-0)",
        flexShrink: 0,
      }}
    >
      {showScores && team.ussScore !== null && (
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>
          USS{" "}
          <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
            {team.ussScore.toFixed(2)}
          </span>
        </div>
      )}
      {team.validatieCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            color: "var(--warn)",
            background: "rgba(234,179,8,.08)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          ⚠ {team.validatieCount}
        </div>
      )}
      <div style={{ flex: 1 }} />
      {team.gemiddeldeLeeftijd !== null && (
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>
          Gem.{" "}
          <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
            {team.gemiddeldeLeeftijd.toFixed(1)}j
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Stap 3: Verwijder ongebruikte imports/constanten bovenaan TeamKaart.tsx**

Na de wijzigingen zijn `KAART_HOOGTE_NORMAAL` en `KAART_HOOGTE_DETAIL` verwijderd. Controleer ook of `flex: 1, minHeight: 0, overflow: "hidden"` nog ergens overblijft in het oude patroon — die horen weg bij dynamische hoogte.

Verwijder ook `isDragging` uit de interface en de component-signature als dat nog aanwezig is (was al verwijderd door linter, maar controleer):

```ts
// Interface: verwijder isDragging als aanwezig
isDragging: boolean;  // ← weg

// Destructuring: verwijder isDragging als aanwezig
isDragging,  // ← weg
```

- [ ] **Stap 4: Typecheck + unit tests**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
pnpm test -- --testPathPattern="useZoom"
```

Verwacht: 0 typefouten, 5/5 tests PASS.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
git commit -m "feat(ti-studio): TeamKaart normaal-mode — spelersrijen + stafsectie + dynamische hoogte"
```

---

### Task 6: WerkbordCanvas minimap aanpassen

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx:53,151,428`

De vaste `KAART_HOOGTE = 210` in de canvas werkt niet meer — normaal/detail kaarten zijn nu dynamisch hoog. Voor de minimap gebruiken we een schatting op basis van formaat en aantal spelers.

- [ ] **Stap 1: Vervang de KAART_HOOGTE constante door een schattingsfunctie**

In `WerkbordCanvas.tsx`, verwijder:
```ts
const KAART_HOOGTE = 210;
```

En voeg toe (op dezelfde plek):
```ts
function schatKaartHoogte(team: WerkbordTeam, zoomLevel: ZoomLevel): number {
  if (zoomLevel === "compact") return 210;
  const aantalSpelers = team.dames.length + team.heren.length;
  const aantalStaf = team.staf.length;
  const rijHoogte = zoomLevel === "detail" ? 48 : 21;
  const labelHoogte = 14; // kolomlabel per sectie
  const headerHoogte = 34;
  const footerHoogte = 26;
  const stafHoogte = aantalStaf > 0 ? aantalStaf * 20 + 1 : 0; // 1px border
  if (team.formaat === "viertal") {
    // 2 labels + alle spelers in 1 kolom
    return headerHoogte + 2 * labelHoogte + aantalSpelers * rijHoogte + stafHoogte + footerHoogte;
  }
  // achtal: hoogte bepaald door langste kolom (dames of heren)
  const maxKolom = Math.max(team.dames.length, team.heren.length);
  return headerHoogte + labelHoogte + maxKolom * rijHoogte + stafHoogte + footerHoogte;
}
```

Zorg dat `WerkbordTeam` en `ZoomLevel` geïmporteerd zijn (check bestaande imports bovenaan het bestand).

- [ ] **Stap 2: Gebruik de schattingsfunctie op de twee plaatsen**

**Plaats 1** — canvas bounding box (regel ~151):
```ts
// Voor
const maxY = Math.max(...teams.map((t) => t.canvasY + KAART_HOOGTE)) + margin;

// Na
const maxY = Math.max(...teams.map((t) => t.canvasY + schatKaartHoogte(t, zoomLevel))) + margin;
```

Controleer of `zoomLevel` beschikbaar is op die plek. Als de functie buiten de component staat, geef het als parameter. Als het binnen de component staat, gebruik de lokale variabele.

**Plaats 2** — minimap teamblokjes (regel ~428):
```ts
// Voor
height: Math.max(2, (KAART_HOOGTE / CANVAS_H) * MINIMAP_H),

// Na
height: Math.max(2, (schatKaartHoogte(team, zoomLevel) / CANVAS_H) * MINIMAP_H),
```

- [ ] **Stap 3: Typecheck**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: 0 fouten.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
git commit -m "feat(ti-studio): minimap gebruikt dynamische kaarthoogte-schatting"
```

---

## Eindcontrole

Na alle 6 taken:

```bash
pnpm test
pnpm --filter web exec tsc --noEmit
```

Verwacht: alle unit tests PASS, 0 typefouten.

Controleer visueel in de browser (`pnpm dev`, ga naar `/ti-studio/indeling`):
- Zoom 75% → compact mode (tellerkaartjes, geen rijen)
- Zoom 85% → normaal mode (stip · naam · leeftijd per rij)
- Zoom 120% → detail mode (SpelerKaart per rij)
- Staf van een team verschijnt in paars boven de footer
- USS staat links in de footer, gem. leeftijd rechts
