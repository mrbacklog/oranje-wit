# TeamDialog + Uniform Memo-patroon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voeg een `TeamDialog` toe aan het TI Studio werkbord met tabs Overzicht/Validatie/Memo, en introduceer een uniform herbruikbaar `MemoPanel` component met open/gesloten/besluit-patroon dat ook op SpelerProfielDialog, kaders-pagina en een nieuwe memo-overzichtspagina wordt toegepast.

**Architecture:** Nieuw standalone `TeamDialog.tsx` (parallel aan `SpelerProfielDialog.tsx`) met herbruikbaar `MemoPanel.tsx`. Trigger via klik op teamtitel in `TeamKaart`. DB migratie voegt `memoStatus` + `besluit` toe aan `Team` en `Speler`. Memo-overzicht is een server component op `/ti-studio/memo`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma (PostgreSQL), inline styles + CSS tokens (`tokens.css`), Vitest, pnpm

---

## Fase A — Fundament (Tasks 1–9)

Bouwt de basis: DB, MemoPanel, TeamDialog, werkbord-integratie.

---

### Task 1: DB migratie — Team en Speler uitbreiden

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Run: `pnpm db:migrate`

- [ ] **Stap 1: Voeg memo-velden toe aan Team model in schema**

Open `packages/database/prisma/schema.prisma`. Zoek het `model Team` block (rond regel 796) en voeg toe na `validatieMeldingen Json?`:

```prisma
model Team {
  id       String @id @default(cuid())
  versie   Versie @relation(fields: [versieId], references: [id], onDelete: Cascade)
  versieId String

  naam      String
  alias     String?
  categorie TeamCategorie
  kleur     Kleur?
  teamType  TeamType?
  niveau    String?
  volgorde  Int      @default(0)

  validatieStatus    ValidatieStatus @default(ONBEKEND)
  validatieMeldingen Json?

  // Memo
  notitie    String?  @db.Text
  memoStatus String   @default("gesloten")
  besluit    String?  @db.Text

  // Selectie-koppeling
  selectieGroepId String?
  selectieGroep   SelectieGroep? @relation(fields: [selectieGroepId], references: [id], onDelete: SetNull)

  // Relaties
  spelers       TeamSpeler[]
  staf          TeamStaf[]
  whatIfKopieen       WhatIfTeam[]
  plaatsreserveringen Plaatsreservering[]

  @@index([versieId])
}
```

- [ ] **Stap 2: Voeg memo-velden toe aan Speler model**

Zoek `model Speler` (rond regel 455). Na de bestaande `notitie String? @db.Text` regel, voeg toe:

```prisma
  notitie       String? @db.Text
  memoStatus    String  @default("gesloten")
  besluit       String? @db.Text
```

- [ ] **Stap 3: Genereer en draai migratie**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm db:migrate
```

Geef de migratie de naam: `add_memo_fields_to_team_and_speler`

Verwacht: migratie slaagt, Prisma client wordt geregenereerd.

- [ ] **Stap 4: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat(db): voeg notitie/memoStatus/besluit toe aan Team + memoStatus/besluit aan Speler"
```

---

### Task 2: WerkbordTeam type uitbreiden

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

- [ ] **Stap 1: Voeg MemoData type en memo-velden toe aan WerkbordTeam**

Open `apps/web/src/components/ti-studio/werkbord/types.ts`. Voeg bovenaan toe:

```ts
export type MemoStatus = "open" | "gesloten";

export interface MemoData {
  tekst: string;           // DB kolom: "notitie"
  memoStatus: MemoStatus;
  besluit: string | null;
}
```

Voeg aan `WerkbordTeam` interface toe (na `notitie: string | null`):

```ts
export interface WerkbordTeam {
  // ...bestaande velden...
  notitie: string | null;
  memoStatus: MemoStatus;      // nieuw
  besluit: string | null;      // nieuw
  // ...rest...
}
```

- [ ] **Stap 2: Vul memo-velden in page.tsx mapping**

Open `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`. In de `teams` mapping (rond regel 170) pas het return object aan:

```ts
return {
  // ...bestaande velden...
  notitie: team.notitie ?? null,
  memoStatus: (team.memoStatus ?? "gesloten") as MemoStatus,
  besluit: team.besluit ?? null,
  // ...rest...
};
```

Voeg bovenaan de import toe:

```ts
import type { WerkbordTeam, WerkbordSpeler, WerkbordSpelerInTeam, MemoStatus } from "@/components/ti-studio/werkbord/types";
```

- [ ] **Stap 3: Controleer TypeScript**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/types.ts apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git commit -m "feat(types): MemoData type + memoStatus/besluit in WerkbordTeam"
```

---

### Task 3: Server actions voor Team memo

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-actions.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-actions.test.ts`

- [ ] **Stap 1: Schrijf de failing tests**

Maak `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

const mockTeamUpdate = vi.fn().mockResolvedValue({ id: "team-1" });

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    team: { update: mockTeamUpdate },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("updateTeamMemo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("slaat memo op als open met tekst", async () => {
    const { updateTeamMemo } = await import("./memo-actions");
    const result = await updateTeamMemo("team-1", {
      tekst: "Overleg over Bram",
      memoStatus: "open",
      besluit: null,
    });
    expect(result.ok).toBe(true);
    expect(mockTeamUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        notitie: "Overleg over Bram",
        memoStatus: "open",
        besluit: null,
      },
    });
  });

  it("slaat memo op als gesloten met besluit", async () => {
    const { updateTeamMemo } = await import("./memo-actions");
    const result = await updateTeamMemo("team-1", {
      tekst: "Overleg over Bram",
      memoStatus: "gesloten",
      besluit: "Bram blijft",
    });
    expect(result.ok).toBe(true);
    expect(mockTeamUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        notitie: "Overleg over Bram",
        memoStatus: "gesloten",
        besluit: "Bram blijft",
      },
    });
  });

  it("verwijst lege tekst met gesloten als fout af", async () => {
    const { updateTeamMemo } = await import("./memo-actions");
    const result = await updateTeamMemo("team-1", {
      tekst: "",
      memoStatus: "gesloten",
      besluit: null,
    });
    expect(result.ok).toBe(false);
    expect(mockTeamUpdate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Stap 2: Run tests — verwacht FAIL**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm test -- memo-actions.test
```

Verwacht: `Cannot find module './memo-actions'`

- [ ] **Stap 3: Implementeer memo-actions.ts**

Maak `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-actions.ts`:

```ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@oranje-wit/types";
import type { MemoData } from "@/components/ti-studio/werkbord/types";

export async function updateTeamMemo(
  teamId: string,
  memo: MemoData
): Promise<ActionResult> {
  await requireTC();
  if (!memo.tekst.trim()) {
    return { ok: false, error: "Memo mag niet leeg zijn" };
  }
  try {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        notitie: memo.tekst,
        memoStatus: memo.memoStatus,
        besluit: memo.besluit,
      },
    });
    revalidatePath("/ti-studio/indeling");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Stap 4: Run tests — verwacht PASS**

```bash
pnpm test -- memo-actions.test
```

Verwacht: 3 tests PASS

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/memo-actions.ts apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/memo-actions.test.ts
git commit -m "feat(actions): updateTeamMemo server action + tests"
```

---

### Task 4: updateSpelerMemo — update bestaande action

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts`
- Modify (tests): `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.test.ts`

- [ ] **Stap 1: Voeg updateSpelerMemo toe aan werkindeling-actions.ts**

Open `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts`. Voeg na de bestaande `updateSpelerNotitie` functie toe:

```ts
import type { MemoData } from "@/components/ti-studio/werkbord/types";

export async function updateSpelerMemo(
  spelerId: string,
  memo: MemoData
): Promise<ActionResult> {
  await requireTC();
  if (!memo.tekst.trim()) {
    return { ok: false, error: "Memo mag niet leeg zijn" };
  }
  try {
    await prisma.speler.update({
      where: { id: spelerId },
      data: {
        notitie: memo.tekst,
        memoStatus: memo.memoStatus,
        besluit: memo.besluit,
      },
    });
    revalidatePath("/ti-studio/indeling");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

Voeg ook de import toe bovenaan als die er nog niet is:

```ts
import type { ActionResult } from "@oranje-wit/types";
```

- [ ] **Stap 2: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/werkindeling-actions.ts
git commit -m "feat(actions): updateSpelerMemo (met memoStatus + besluit)"
```

---

### Task 5: MemoPanel component

**Files:**
- Create: `apps/web/src/components/ti-studio/MemoPanel.tsx`

> **UX noot:** Exacte kleuren, font-groottes en spacing worden afgestemd met de UX designer. Gebruik onderstaande tokens als basis — verander nooit de token-namen, alleen de waarden indien UX dit aangeeft.

- [ ] **Stap 1: Maak MemoPanel.tsx**

```tsx
"use client";

import { useState } from "react";
import type { MemoData, MemoStatus } from "./werkbord/types";

// Design tokens — afstemmen met UX designer
const T = {
  bg1: "#141414",
  bg2: "#1a1a1a",
  bg3: "#111111",
  border0: "#1e1e1e",
  border1: "#2a2a2a",
  accent: "#ff6b00",
  accentDim: "rgba(255,107,0,.12)",
  accentBorder: "rgba(255,107,0,.25)",
  ok: "#4ade80",
  okDim: "rgba(74,222,128,.06)",
  okBorder: "rgba(74,222,128,.15)",
  text1: "#fafafa",
  text2: "#a3a3a3",
  text3: "#555555",
  text4: "#333333",
};

export interface MemoPanelProps {
  memo: MemoData;
  onSave: (data: MemoData) => Promise<void>;
  opslaanBezig?: boolean;
}

export function MemoPanel({ memo, onSave, opslaanBezig = false }: MemoPanelProps) {
  const [tekst, setTekst] = useState(memo.tekst);
  const [memoStatus, setMemoStatus] = useState<MemoStatus>(memo.memoStatus);
  const [besluit, setBesluit] = useState(memo.besluit ?? "");
  const [toonBesluitVeld, setToonBesluitVeld] = useState(false);
  const [lokaalBezig, setLokaalBezig] = useState(false);

  const isOpen = memoStatus === "open";
  const bezig = opslaanBezig || lokaalBezig;

  async function slaOp(nieuweStatus?: MemoStatus, nieuwBesluit?: string) {
    setLokaalBezig(true);
    try {
      await onSave({
        tekst,
        memoStatus: nieuweStatus ?? memoStatus,
        besluit: nieuwBesluit !== undefined ? nieuwBesluit : besluit || null,
      });
      if (nieuweStatus) setMemoStatus(nieuweStatus);
      if (nieuwBesluit !== undefined) setBesluit(nieuwBesluit);
      setToonBesluitVeld(false);
    } finally {
      setLokaalBezig(false);
    }
  }

  return (
    <div
      style={{
        background: T.bg1,
        border: `1px solid ${T.border0}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Status header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.625rem 0.875rem",
          borderBottom: `1px solid ${T.border0}`,
          background: T.bg3,
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            color: isOpen ? T.accent : T.text4,
            filter: isOpen ? `drop-shadow(0 0 3px rgba(255,107,0,.5))` : "none",
          }}
        >
          ▲
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: isOpen ? T.accent : T.text3,
            flex: 1,
          }}
        >
          {isOpen ? "Open — actie vereist" : "Gesloten — besluit genomen"}
        </span>
        {isOpen ? (
          <button
            onClick={() => setToonBesluitVeld(true)}
            disabled={bezig}
            style={{
              padding: "0.2rem 0.625rem",
              borderRadius: 99,
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid rgba(74,222,128,.25)`,
              background: "rgba(74,222,128,.1)",
              color: T.ok,
              fontFamily: "inherit",
            }}
          >
            ✓ Sluiten met besluit
          </button>
        ) : (
          <button
            onClick={() => slaOp("open", "")}
            disabled={bezig}
            style={{
              padding: "0.2rem 0.625rem",
              borderRadius: 99,
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${T.accentBorder}`,
              background: T.accentDim,
              color: T.accent,
              fontFamily: "inherit",
            }}
          >
            ↩ Heropenen
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: T.text4 }}>
          Memo
        </div>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          readOnly={!isOpen}
          placeholder="Schrijf een memo…"
          rows={4}
          style={{
            width: "100%",
            background: isOpen ? T.bg2 : "#0f0f0f",
            border: `1px ${isOpen ? "dashed" : "solid"} ${T.border1}`,
            borderRadius: 8,
            color: isOpen ? T.text1 : T.text3,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "0.8rem",
            padding: "0.625rem 0.75rem",
            resize: "none",
            lineHeight: 1.6,
            outline: "none",
            cursor: isOpen ? "text" : "default",
            boxSizing: "border-box",
          }}
        />

        {/* Besluit blok (gesloten) */}
        {!isOpen && memo.besluit && (
          <div
            style={{
              background: T.okDim,
              border: `1px solid ${T.okBorder}`,
              borderRadius: 8,
              padding: "0.625rem 0.75rem",
            }}
          >
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(74,222,128,.6)", marginBottom: "0.375rem" }}>
              Besluit
            </div>
            <div style={{ fontSize: "0.8rem", color: T.ok, lineHeight: 1.6 }}>
              {memo.besluit}
            </div>
          </div>
        )}

        {/* Besluit invulveld (bij sluiten) */}
        {toonBesluitVeld && (
          <div
            style={{
              background: T.okDim,
              border: `1px solid ${T.okBorder}`,
              borderRadius: 8,
              padding: "0.625rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(74,222,128,.6)" }}>
              Besluit vastleggen
            </div>
            <textarea
              value={besluit}
              onChange={(e) => setBesluit(e.target.value)}
              placeholder="Beschrijf het besluit…"
              rows={2}
              autoFocus
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: T.ok,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.8rem",
                padding: 0,
                resize: "none",
                lineHeight: 1.6,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setToonBesluitVeld(false)}
                style={{ background: "none", border: `1px solid ${T.border1}`, borderRadius: 6, color: T.text3, fontSize: "0.75rem", padding: "0.3rem 0.75rem", cursor: "pointer", fontFamily: "inherit" }}
              >
                Annuleren
              </button>
              <button
                onClick={() => slaOp("gesloten", besluit)}
                disabled={bezig}
                style={{ background: T.ok, color: "#000", border: "none", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.75rem", cursor: "pointer", fontFamily: "inherit" }}
              >
                {bezig ? "Opslaan…" : "Sluiten"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer — opslaan (alleen open) */}
      {isOpen && !toonBesluitVeld && (
        <div
          style={{
            padding: "0.5rem 0.875rem",
            borderTop: `1px solid ${T.border0}`,
            background: "#0f0f0f",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => slaOp()}
            disabled={bezig || !tekst.trim()}
            style={{
              background: T.accent,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "0.35rem 0.875rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: bezig || !tekst.trim() ? "not-allowed" : "pointer",
              opacity: bezig || !tekst.trim() ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {bezig ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Stap 2: Exporteer vanuit index.ts**

Open `apps/web/src/components/ti-studio/index.ts` en voeg toe:

```ts
export { MemoPanel } from "./MemoPanel";
export type { MemoPanelProps } from "./MemoPanel";
```

- [ ] **Stap 3: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/MemoPanel.tsx apps/web/src/components/ti-studio/index.ts
git commit -m "feat(ui): MemoPanel component — uniform open/gesloten/besluit patroon"
```

---

### Task 6: TeamKaart — onTitelKlik prop + ▲ indicator

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`

- [ ] **Stap 1: Voeg onTitelKlik prop toe aan de interface**

Open `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`. Zoek de props-destructuring (rond regel 65–95). Voeg toe:

```ts
// In props interface / destructuring:
onTitelKlik?: (teamId: string) => void;
```

- [ ] **Stap 2: Maak de teamtitel klikbaar in normaal/detail mode**

In de normaal/detail mode header (rond regel 395–475), zoek de div met `{selectieLabel}` (de teamnaam). Wikkel deze in een klikbare span:

```tsx
<div
  style={{
    fontSize: 13,
    fontWeight: 700,
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: onTitelKlik ? "pointer" : "default",
  }}
  onClick={(e) => {
    e.stopPropagation();
    onTitelKlik?.(team.id);
  }}
  title={onTitelKlik ? "Klik voor teamoverzicht" : undefined}
>
  {selectieLabel}
</div>
```

- [ ] **Stap 3: Voeg ▲ indicator toe naast de validatie-stip**

Direct ná de validatie-stip div (rond regel 456), voeg het memo-driehoekje toe:

```tsx
{team.memoStatus === "open" && (
  <span
    title="Open memo"
    style={{
      fontSize: "0.55rem",
      color: "var(--accent, #ff6b00)",
      filter: "drop-shadow(0 0 2px rgba(255,107,0,.6))",
      flexShrink: 0,
      lineHeight: 1,
    }}
  >
    ▲
  </span>
)}
```

- [ ] **Stap 4: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
git commit -m "feat(ui): TeamKaart — onTitelKlik prop + ▲ memo-indicator"
```

---

### Task 7: TiStudioShell — dialogTeamId state + doorgeven aan TeamKaart

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`

- [ ] **Stap 1: Voeg dialogTeamId state toe**

Open `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`. Na de bestaande `profielTeamId` state (rond regel 31), voeg toe:

```ts
const [dialogTeamId, setDialogTeamId] = useState<string | null>(null);
```

- [ ] **Stap 2: Voeg openTeamDialog handler toe**

Na de bestaande `openTeamDrawer` callback (rond regel 77), voeg toe:

```ts
const openTeamDialog = useCallback((teamId: string) => {
  setDialogTeamId(teamId);
}, []);
```

- [ ] **Stap 3: Geef onTitelKlik door aan WerkbordCanvas/TeamKaart**

Zoek waar `WerkbordCanvas` wordt gerenderd en geef de prop door:

```tsx
<WerkbordCanvas
  // ...bestaande props...
  onTitelKlik={openTeamDialog}
/>
```

Pas ook `WerkbordCanvas` aan zodat hij `onTitelKlik` accepteert en doorgeeft aan `TeamKaart`. Open `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx` en voeg toe:

```ts
// In WerkbordCanvasProps:
onTitelKlik?: (teamId: string) => void;

// In de TeamKaart rendering:
<TeamKaart
  // ...bestaande props...
  onTitelKlik={onTitelKlik}
/>
```

- [ ] **Stap 4: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
git commit -m "feat(shell): dialogTeamId state + openTeamDialog via TeamKaart titelklik"
```

---

### Task 8: TeamDialog — Overzicht en Validatie tabs

**Files:**
- Create: `apps/web/src/components/ti-studio/TeamDialog.tsx`

> **UX noot:** Speler-avatar stijl, kleurengebruik en spacing worden afgestemd met UX designer. Gebruik onderstaande opzet als technische basis — visuele finetuning volgt in aparte stap.

- [ ] **Stap 1: Maak TeamDialog.tsx met header + Overzicht tab**

Maak `apps/web/src/components/ti-studio/TeamDialog.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { TeamKaartSpelerRij } from "./werkbord/TeamKaartSpelerRij";
import { MemoPanel } from "./MemoPanel";
import { updateTeamMemo } from "@/app/(teamindeling-studio)/ti-studio/indeling/memo-actions";
import { logger } from "@oranje-wit/types";
import type { WerkbordTeam, WerkbordValidatieItem, MemoData } from "./werkbord/types";

// Design tokens
const T = {
  bg0: "#0a0a0a",
  bg1: "#141414",
  bg2: "#1e1e1e",
  border0: "#262626",
  accent: "#ff6b00",
  text1: "#fafafa",
  text2: "#a3a3a3",
  text3: "#555555",
  ok: "#22c55e",
  warn: "#eab308",
  err: "#ef4444",
  pink: "#f9a8d4",
  blue: "#93c5fd",
};

const KLEUR_GRADIENT: Record<string, string> = {
  blauw: "linear-gradient(180deg, #3b82f6, #60a5fa)",
  groen: "linear-gradient(180deg, #22c55e, #a3c928)",
  geel: "linear-gradient(180deg, #eab308, #f09030)",
  oranje: "linear-gradient(180deg, #f97316, #e8c020)",
  rood: "linear-gradient(180deg, #ef4444, #cc2222)",
  senior: "linear-gradient(180deg, #6b7280, #374151)",
};

const VAL_KLEUR: Record<string, string> = {
  ok: T.ok,
  warn: T.warn,
  err: T.err,
};

type Tab = "overzicht" | "validatie" | "memo";

export interface TeamDialogProps {
  teamId: string | null;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  onClose: () => void;
  onMemoSaved?: (teamId: string, memo: MemoData) => void;
}

export function TeamDialog({ teamId, teams, validatie, onClose, onMemoSaved }: TeamDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overzicht");
  const [memoBezig, setMemoBezig] = useState(false);

  const team = teams.find((t) => t.id === teamId) ?? null;

  useEffect(() => {
    if (!teamId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [teamId, onClose]);

  const slaTeamMemoOp = useCallback(
    async (memo: MemoData) => {
      if (!teamId) return;
      setMemoBezig(true);
      try {
        const result = await updateTeamMemo(teamId, memo);
        if (!result.ok) {
          logger.warn("TeamDialog: fout bij opslaan memo", result.error);
          return;
        }
        onMemoSaved?.(teamId, memo);
      } catch (err) {
        logger.error("TeamDialog: onverwachte fout bij opslaan memo", err);
      } finally {
        setMemoBezig(false);
      }
    },
    [teamId, onMemoSaved]
  );

  if (!teamId || !team) return null;

  const teamValidatie = validatie.filter((v) => v.teamId === teamId);
  const teamValidatieSorted = [
    ...teamValidatie.filter((v) => v.type === "err"),
    ...teamValidatie.filter((v) => v.type === "warn"),
    ...teamValidatie.filter((v) => v.type === "ok"),
  ];

  const gradient = KLEUR_GRADIENT[team.kleur] ?? KLEUR_GRADIENT.senior;
  const memoData: MemoData = {
    tekst: team.notitie ?? "",
    memoStatus: team.memoStatus,
    besluit: team.besluit,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9992,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Teamoverzicht: ${team.naam}`}
        style={{
          position: "relative",
          zIndex: 1,
          background: T.bg1,
          border: `1px solid ${T.border0}`,
          borderRadius: 20,
          width: 780,
          maxWidth: "95vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: `1px solid ${T.border0}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 5,
              height: 40,
              borderRadius: 3,
              background: gradient,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: T.text1, lineHeight: 1.2 }}>
              {team.naam}
              {team.selectieNaam && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", fontWeight: 500, color: T.text3 }}>
                  ({team.selectieNaam})
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.75rem", color: T.text3, marginTop: 2 }}>
              {team.categorie} · {team.formaat}
            </div>
          </div>
          {/* Badges */}
          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexShrink: 0 }}>
            <span style={{ background: "rgba(236,72,153,.15)", color: T.pink, borderRadius: 99, padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
              ♀ {team.dames.length}
            </span>
            <span style={{ background: "rgba(96,165,250,.15)", color: T.blue, borderRadius: 99, padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
              ♂ {team.heren.length}
            </span>
            {team.validatieCount > 0 && (
              <span style={{ background: `${VAL_KLEUR[team.validatieStatus]}22`, color: VAL_KLEUR[team.validatieStatus], borderRadius: 99, padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
                {team.validatieStatus === "err" ? "✗" : "⚠"} {team.validatieCount}
              </span>
            )}
            {team.memoStatus === "open" && (
              <span
                title="Open memo"
                style={{ fontSize: "0.6rem", color: T.accent, filter: "drop-shadow(0 0 3px rgba(255,107,0,.5))" }}
              >
                ▲
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{ background: "none", border: "none", color: T.text3, fontSize: "1.375rem", cursor: "pointer", lineHeight: 1, padding: "0.25rem 0.5rem", borderRadius: 6, flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            padding: "0 1.25rem",
            borderBottom: `1px solid ${T.border0}`,
            background: "#0f0f0f",
            flexShrink: 0,
          }}
        >
          {(["overzicht", "validatie", "memo"] as Tab[]).map((tab) => {
            const label = tab === "overzicht" ? "Overzicht" : tab === "validatie" ? "Validatie" : "Memo";
            const isActive = activeTab === tab;
            const heeftIndicator =
              (tab === "validatie" && team.validatieCount > 0) ||
              (tab === "memo" && team.memoStatus === "open");
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? T.accent : "transparent"}`,
                  color: isActive ? T.accent : T.text3,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  padding: "0.625rem 1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {heeftIndicator && (
                  <span style={{ fontSize: "0.5rem", color: tab === "memo" ? T.accent : VAL_KLEUR[team.validatieStatus] }}>
                    {tab === "memo" ? "▲" : "●"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.125rem 1.25rem" }}>

          {/* Tab: Overzicht */}
          {activeTab === "overzicht" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Dames */}
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: T.pink, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    ♀ Dames
                    <span style={{ marginLeft: "auto", background: "rgba(236,72,153,.12)", color: T.pink, borderRadius: 99, padding: "0.1rem 0.45rem", fontSize: "0.7rem" }}>
                      {team.dames.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {team.dames.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.25rem", color: T.text3, fontSize: "0.8rem", border: `1px dashed ${T.border0}`, borderRadius: 8 }}>
                        Geen dames
                      </div>
                    ) : (
                      team.dames.map((item) => (
                        <TeamKaartSpelerRij
                          key={item.id}
                          item={item}
                          readonly
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Heren */}
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: T.blue, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    ♂ Heren
                    <span style={{ marginLeft: "auto", background: "rgba(96,165,250,.12)", color: T.blue, borderRadius: 99, padding: "0.1rem 0.45rem", fontSize: "0.7rem" }}>
                      {team.heren.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {team.heren.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.25rem", color: T.text3, fontSize: "0.8rem", border: `1px dashed ${T.border0}`, borderRadius: 8 }}>
                        Geen heren
                      </div>
                    ) : (
                      team.heren.map((item) => (
                        <TeamKaartSpelerRij
                          key={item.id}
                          item={item}
                          readonly
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Staf */}
              {team.staf.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: T.text2, marginBottom: "0.5rem" }}>Staf</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {team.staf.map((s) => (
                      <span key={s.id} style={{ background: T.bg2, border: `1px solid ${T.border0}`, borderRadius: 6, padding: "0.25rem 0.625rem", fontSize: "0.775rem", color: T.text2 }}>
                        {s.naam} <span style={{ color: T.text3, fontSize: "0.7rem" }}>({s.rol})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#1a1a1a", border: `1px solid #2a2a2a`, borderRadius: 10, display: "flex", gap: "2rem" }}>
                {team.ussScore !== null && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: T.accent }}>{team.ussScore.toFixed(2)}</div>
                    <div style={{ fontSize: "0.65rem", color: T.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>USS score</div>
                  </div>
                )}
                {team.gemiddeldeLeeftijd !== null && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: T.text2 }}>{team.gemiddeldeLeeftijd.toFixed(1)}j</div>
                    <div style={{ fontSize: "0.65rem", color: T.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>Gem. leeftijd</div>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: T.text2 }}>{team.dames.length + team.heren.length}</div>
                  <div style={{ fontSize: "0.65rem", color: T.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>Spelers</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Validatie */}
          {activeTab === "validatie" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {teamValidatieSorted.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: T.text3, border: `1px dashed ${T.border0}`, borderRadius: 10 }}>
                  ✓ Geen validatiemeldingen — alles in orde
                </div>
              ) : (
                teamValidatieSorted.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.625rem",
                      padding: "0.625rem 0.75rem",
                      borderRadius: 8,
                      border: `1px solid ${VAL_KLEUR[item.type]}33`,
                      background: `${VAL_KLEUR[item.type]}0d`,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", flexShrink: 0, marginTop: 1 }}>
                      {item.type === "ok" ? "✓" : item.type === "warn" ? "⚠" : "✗"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: T.text1 }}>{item.regel}</div>
                      <div style={{ fontSize: "0.75rem", color: T.text2, marginTop: 2 }}>{item.beschrijving}</div>
                    </div>
                    {item.laag && (
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 4, background: T.bg2, color: T.text3, alignSelf: "center", flexShrink: 0 }}>
                        {item.laag}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Memo */}
          {activeTab === "memo" && (
            <MemoPanel
              memo={memoData}
              onSave={slaTeamMemoOp}
              opslaanBezig={memoBezig}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Controleer of TeamKaartSpelerRij een `readonly` prop accepteert**

Open `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx`. Bekijk de props. Als er geen `readonly` prop is, voeg toe:

```ts
// In props interface:
readonly?: boolean;
```

En gebruik het om drag-handlers te disablen:

```tsx
// Verwijder of disable onDragStart als readonly === true
draggable={!readonly}
onDragStart={readonly ? undefined : handleDragStart}
```

- [ ] **Stap 3: Exporteer TeamDialog vanuit index.ts**

```ts
export { TeamDialog } from "./TeamDialog";
export type { TeamDialogProps } from "./TeamDialog";
```

- [ ] **Stap 4: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/TeamDialog.tsx apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx apps/web/src/components/ti-studio/index.ts
git commit -m "feat(ui): TeamDialog — Overzicht + Validatie + Memo tabs"
```

---

### Task 9: TiStudioShell — TeamDialog renderen + memo state updaten

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`

- [ ] **Stap 1: Importeer TeamDialog en render hem**

Open `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`. Voeg import toe:

```ts
import { TeamDialog } from "../TeamDialog";
import type { MemoData } from "./types";
```

- [ ] **Stap 2: Voeg onMemoSaved handler toe**

```ts
const handleTeamMemoSaved = useCallback((teamId: string, memo: MemoData) => {
  updateTeamLokaal(teamId, {
    notitie: memo.tekst,
    memoStatus: memo.memoStatus,
    besluit: memo.besluit,
  });
}, [updateTeamLokaal]);
```

- [ ] **Stap 3: Render TeamDialog in de JSX (naast SpelerProfielDialog)**

```tsx
<TeamDialog
  teamId={dialogTeamId}
  teams={teams}
  validatie={initieleState.validatie}
  onClose={() => setDialogTeamId(null)}
  onMemoSaved={handleTeamMemoSaved}
/>
```

- [ ] **Stap 4: Voeg updateTeamLokaal ondersteuning toe voor memo-velden**

Controleer `useWerkbordState.ts` — `updateTeamLokaal` verwacht een `Partial<WerkbordTeam>`. Als `notitie`, `memoStatus` en `besluit` al in `WerkbordTeam` zitten (Task 2), werkt dit automatisch. Verifieer:

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git commit -m "feat(shell): TeamDialog renderen + onMemoSaved lokale state update"
```

---

## Fase B — Uitrol memo-patroon (Tasks 10–12)

Bouwt voort op Fase A. Kan apart worden uitgevoerd zodra Fase A gemerged is.

---

### Task 10: SpelerProfielDialog — Memo tab updaten naar MemoPanel

**Files:**
- Modify: `apps/web/src/components/ti-studio/SpelerProfielDialog.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts` (al gedaan in Task 4)

- [ ] **Stap 1: Importeer MemoPanel en updateSpelerMemo**

Open `apps/web/src/components/ti-studio/SpelerProfielDialog.tsx`. Voeg bovenaan toe:

```ts
import { MemoPanel } from "./MemoPanel";
import { updateSpelerMemo } from "@/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions";
import type { MemoData } from "./werkbord/types";
```

- [ ] **Stap 2: Vervang memo state**

Zoek de bestaande memo state (rond regel 573–575):

```ts
// Vervang dit:
const [notitie, setNotitie] = useState("");
const [opslaanBezig, setOpslaanBezig] = useState(false);

// Door dit:
const [memoBezig, setMemoBezig] = useState(false);
```

En in de `getSpelerProfiel` data-load (rond regel 591–594), verwijder de `setNotitie` call — `MemoPanel` krijgt zijn state van het profiel.

- [ ] **Stap 3: Vervang Memo tab inhoud**

Zoek het `{activeTab === "memo" && ...}` blok (rond regel 1442–1502). Vervang de gehele inhoud door:

```tsx
{activeTab === "memo" && profiel && (
  <MemoPanel
    memo={{
      tekst: profiel.notitie ?? "",
      memoStatus: (profiel.memoStatus ?? "gesloten") as "open" | "gesloten",
      besluit: profiel.besluit ?? null,
    }}
    onSave={async (memo: MemoData) => {
      setMemoBezig(true);
      try {
        await updateSpelerMemo(spelerId!, memo);
      } catch (err) {
        logger.error("SpelerProfielDialog: fout bij opslaan memo", err);
      } finally {
        setMemoBezig(false);
      }
    }}
    opslaanBezig={memoBezig}
  />
)}
```

- [ ] **Stap 4: Verwijder oude slaNotitieOp functie**

Zoek de `slaNotitieOp` functie (rond regel 670–679) en verwijder die — `MemoPanel` handelt opslaan af.

- [ ] **Stap 5: Update getSpelerProfiel query om memoStatus en besluit mee te laden**

Open `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts`. Zoek `getSpelerProfiel` en voeg aan de select toe:

```ts
select: {
  // ...bestaande velden...
  notitie: true,
  memoStatus: true,
  besluit: true,
}
```

> **TypeScript noot:** De return type van `getSpelerProfiel` wordt automatisch afgeleid (`Awaited<ReturnType<typeof getSpelerProfiel>>`). Zodra `memoStatus` en `besluit` in de select zitten, zijn ze beschikbaar in `profiel.memoStatus` en `profiel.besluit`. Als TypeScript klaagt over `profiel.memoStatus`, run dan `pnpm db:generate` om de Prisma client opnieuw te genereren.

- [ ] **Stap 6: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/components/ti-studio/SpelerProfielDialog.tsx apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/werkindeling-actions.ts
git commit -m "feat(ui): SpelerProfielDialog memo tab → uniform MemoPanel component"
```

---

### Task 11: Kaders-pagina — doelgroep en TC memo

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/memo-actions.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/memo-actions.test.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/_components/KadersMemosClient.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/page.tsx`

> **DB noot:** De doelgroep-memos worden opgeslagen in een nieuw `DoelgroepMemo` model in Prisma. Dit vereist een extra migratie. Bekijk eerst het schema en voeg toe:

```prisma
model DoelgroepMemo {
  id         String @id @default(cuid())
  doelgroep  String // "kweekvijver" | "opleidingshart" | "korfbalplezier" | "wedstrijdsport" | "topsport" | "tc"
  notitie    String? @db.Text
  memoStatus String  @default("gesloten")
  besluit    String? @db.Text
  seizoen    String

  @@unique([doelgroep, seizoen])
}
```

Draai migratie: `pnpm db:migrate` met naam `add_doelgroep_memo`

- [ ] **Stap 1: Schrijf tests voor memo-actions**

Maak `memo-actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

const mockUpsert = vi.fn().mockResolvedValue({ id: "memo-1" });

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { doelgroepMemo: { upsert: mockUpsert } },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("updateDoelgroepMemo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("slaat doelgroep memo op via upsert", async () => {
    const { updateDoelgroepMemo } = await import("./memo-actions");
    const result = await updateDoelgroepMemo("opleidingshart", "2025-2026", {
      tekst: "Weinig instroom U13",
      memoStatus: "open",
      besluit: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { doelgroep_seizoen: { doelgroep: "opleidingshart", seizoen: "2025-2026" } },
      create: { doelgroep: "opleidingshart", seizoen: "2025-2026", notitie: "Weinig instroom U13", memoStatus: "open", besluit: null },
      update: { notitie: "Weinig instroom U13", memoStatus: "open", besluit: null },
    });
  });
});
```

- [ ] **Stap 2: Run tests — verwacht FAIL**

```bash
pnpm test -- kaders/memo-actions.test
```

- [ ] **Stap 3: Implementeer memo-actions.ts**

```ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@oranje-wit/types";
import type { MemoData } from "@/components/ti-studio/werkbord/types";

export async function updateDoelgroepMemo(
  doelgroep: string,
  seizoen: string,
  memo: MemoData
): Promise<ActionResult> {
  await requireTC();
  try {
    await prisma.doelgroepMemo.upsert({
      where: { doelgroep_seizoen: { doelgroep, seizoen } },
      create: { doelgroep, seizoen, notitie: memo.tekst, memoStatus: memo.memoStatus, besluit: memo.besluit },
      update: { notitie: memo.tekst, memoStatus: memo.memoStatus, besluit: memo.besluit },
    });
    revalidatePath("/ti-studio/kaders");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Stap 4: Run tests — verwacht PASS**

```bash
pnpm test -- kaders/memo-actions.test
```

- [ ] **Stap 5: Maak KadersMemosClient.tsx**

```tsx
"use client";

import { MemoPanel } from "@/components/ti-studio/MemoPanel";
import { updateDoelgroepMemo } from "../memo-actions";
import type { MemoData } from "@/components/ti-studio/werkbord/types";

const DOELGROEPEN = [
  { key: "kweekvijver", label: "Kweekvijver" },
  { key: "opleidingshart", label: "Opleidingshart" },
  { key: "korfbalplezier", label: "Korfbalplezier" },
  { key: "wedstrijdsport", label: "Wedstrijdsport" },
  { key: "topsport", label: "Topsport" },
  { key: "tc", label: "TC (algemeen)" },
];

interface Props {
  seizoen: string;
  initieleDoelgroepMemos: Record<string, { notitie: string | null; memoStatus: string; besluit: string | null }>;
}

export function KadersMemosClient({ seizoen, initieleDoelgroepMemos }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem", color: "#a3a3a3" }}>
          Doelgroep-memos
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {DOELGROEPEN.map(({ key, label }) => {
            const huidig = initieleDoelgroepMemos[key];
            const memo: MemoData = {
              tekst: huidig?.notitie ?? "",
              memoStatus: (huidig?.memoStatus ?? "gesloten") as "open" | "gesloten",
              besluit: huidig?.besluit ?? null,
            };
            return (
              <div key={key}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fafafa", marginBottom: "0.375rem" }}>
                  {label}
                </div>
                <MemoPanel
                  memo={memo}
                  onSave={(data) => updateDoelgroepMemo(key, seizoen, data).then(() => {})}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Stap 6: Voeg KadersMemosClient toe aan kaders/page.tsx**

Laad de doelgroep-memos op in de server component en geef ze door:

```tsx
// In KadersPage, voeg toe aan de Promise.all:
prisma.doelgroepMemo.findMany({
  where: { seizoen },
  select: { doelgroep: true, notitie: true, memoStatus: true, besluit: true },
}),

// Verwerk tot Record:
const doelgroepMemos = Object.fromEntries(
  memoData.map((m) => [m.doelgroep, m])
);

// Render onderaan de pagina:
<KadersMemosClient seizoen={seizoen} initieleDoelgroepMemos={doelgroepMemos} />
```

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/kaders/
git commit -m "feat(kaders): doelgroep + TC memo via MemoPanel op kaders-pagina"
```

---

### Task 12: Memo overzichtspagina

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/page.tsx`

- [ ] **Stap 1: Maak de pagina als server component**

Maak `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/page.tsx`:

```tsx
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { requireTC } from "@oranje-wit/auth/checks";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MemoOverzichtPage() {
  try {
    await requireTC();
  } catch {
    redirect("/");
  }

  const seizoen = await getActiefSeizoen();

  // Haal actieve werkindeling op
  const werkindeling = await prisma.werkindeling.findFirst({
    where: { seizoen, status: "ACTIEF" },
    select: { id: true },
  });

  // Team memos
  const teamMemos = werkindeling
    ? await prisma.team.findMany({
        where: {
          versie: { werkindelingId: werkindeling.id },
          OR: [{ notitie: { not: null } }],
        },
        select: { id: true, naam: true, notitie: true, memoStatus: true, besluit: true },
        orderBy: { memoStatus: "asc" }, // "gesloten" voor "open" (asc), swap in UI
      })
    : [];

  // Speler memos
  const spelerMemos = await prisma.speler.findMany({
    where: { OR: [{ notitie: { not: null } }] },
    select: { id: true, roepnaam: true, achternaam: true, notitie: true, memoStatus: true, besluit: true },
  });

  // Doelgroep memos
  const doelgroepMemos = await prisma.doelgroepMemo.findMany({
    where: { seizoen },
    select: { doelgroep: true, notitie: true, memoStatus: true, besluit: true },
  });

  const openTeams = teamMemos.filter((m) => m.memoStatus === "open");
  const openSpelers = spelerMemos.filter((m) => m.memoStatus === "open");
  const openDoelgroepen = doelgroepMemos.filter((m) => m.memoStatus === "open");
  const totaalOpen = openTeams.length + openSpelers.length + openDoelgroepen.length;
  const totaalGesloten =
    teamMemos.filter((m) => m.memoStatus === "gesloten" && m.notitie).length +
    spelerMemos.filter((m) => m.memoStatus === "gesloten" && m.notitie).length +
    doelgroepMemos.filter((m) => m.memoStatus === "gesloten" && m.notitie).length;

  return (
    <div style={{ padding: "1.5rem", fontFamily: "Inter, system-ui, sans-serif", fontSize: 13, color: "#fafafa", maxWidth: 720 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", padding: "1rem 1.25rem", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ff6b00" }}>{totaalOpen}</div>
          <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px" }}>Open memos</div>
        </div>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4ade80" }}>{totaalGesloten}</div>
          <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gesloten</div>
        </div>
      </div>

      <h1 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Memo overzicht</h1>
      <p style={{ fontSize: "0.775rem", color: "#555", marginBottom: "1.25rem" }}>Alle openstaande acties en besluiten — teams, spelers en kaders</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Open teams */}
        {openTeams.map((m) => (
          <MemoRij key={m.id} type="Team" naam={m.naam} notitie={m.notitie ?? ""} memoStatus="open" besluit={null} href={`/ti-studio/indeling`} />
        ))}
        {/* Open spelers */}
        {openSpelers.map((m) => (
          <MemoRij key={m.id} type="Speler" naam={`${m.roepnaam} ${m.achternaam}`} notitie={m.notitie ?? ""} memoStatus="open" besluit={null} href={`/ti-studio/personen/spelers`} />
        ))}
        {/* Open doelgroepen */}
        {openDoelgroepen.map((m) => (
          <MemoRij key={m.doelgroep} type="Kader" naam={m.doelgroep} notitie={m.notitie ?? ""} memoStatus="open" besluit={null} href={`/ti-studio/kaders`} />
        ))}
        {totaalOpen === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#333", border: "1px dashed #1e1e1e", borderRadius: 10 }}>
            ✓ Geen open memos
          </div>
        )}
      </div>
    </div>
  );
}

function MemoRij({
  type, naam, notitie, memoStatus, besluit, href,
}: {
  type: "Team" | "Speler" | "Kader";
  naam: string;
  notitie: string;
  memoStatus: "open" | "gesloten";
  besluit: string | null;
  href: string;
}) {
  const TYPE_KLEUR: Record<string, string> = {
    Team: "#f97316",
    Speler: "#60a5fa",
    Kader: "#c084fc",
  };

  return (
    <div style={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", gap: "0.875rem", alignItems: "flex-start", opacity: memoStatus === "gesloten" ? 0.55 : 1 }}>
      <span style={{ fontSize: "0.6rem", color: memoStatus === "open" ? "#ff6b00" : "#2a2a2a", paddingTop: 2, filter: memoStatus === "open" ? "drop-shadow(0 0 3px rgba(255,107,0,.5))" : "none" }}>▲</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 4, background: `${TYPE_KLEUR[type]}15`, color: TYPE_KLEUR[type] }}>{type}</span>
          {naam}
        </div>
        <div style={{ fontSize: "0.775rem", color: "#a3a3a3", marginTop: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 500 }}>{notitie}</div>
        {besluit && <div style={{ fontSize: "0.7rem", color: "#4ade80", marginTop: "0.25rem" }}>✓ {besluit}</div>}
      </div>
      <a href={href} style={{ flexShrink: 0, fontSize: "0.7rem", color: "#555", textDecoration: "none", padding: "0.25rem 0.625rem", border: "1px solid #2a2a2a", borderRadius: 6, alignSelf: "center" }}>
        Openen →
      </a>
    </div>
  );
}
```

- [ ] **Stap 2: Controleer TypeScript**

```bash
pnpm --filter web exec tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/
git commit -m "feat(pages): memo overzichtspagina /ti-studio/memo"
```

---

## Eindcheck

- [ ] **Alle tests draaien**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm test
```

Verwacht: alle tests PASS, geen regressies.

- [ ] **TypeScript clean**

```bash
pnpm --filter web exec tsc --noEmit
```

- [ ] **Lokaal bekijken**

```bash
pnpm dev
```

Controleer:
1. Klik op teamtitel in het werkbord → TeamDialog opent
2. Tabs werken: Overzicht (read-only spelerrijen) / Validatie / Memo
3. Memo opslaan als open → ▲ verschijnt op TeamKaart
4. Memo sluiten met besluit → ▲ verdwijnt
5. SpelerProfielDialog → Memo tab gebruikt MemoPanel
6. `/ti-studio/kaders` → doelgroep-memos zichtbaar
7. `/ti-studio/memo` → overzicht laadt

- [ ] **UX review inplannen**

Roep UX designer in voor review van:
- Avatar-stijl in spelerrijen (consistent met design system)
- ▲ indicator grootte en positie per context
- Besluit-blok kleur/typografie
- Tab-component consistentie met rest TI Studio

- [ ] **Eindcommit**

```bash
git add -A
git commit -m "feat(ti-studio): TeamDialog + uniform MemoPanel patroon volledig geïmplementeerd"
```
