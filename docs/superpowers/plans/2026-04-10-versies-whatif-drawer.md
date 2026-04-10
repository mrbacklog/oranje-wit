# Versies & What-If Drawer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voeg een rechter sidedrawer toe aan de TI Studio waarmee de TC versies en what-ifs kan beheren — aanmaken, promoveren tot werkversie, en archiveren.

**Architecture:** Nieuwe `VersiesDrawer` component (naast de bestaande `ValidatieDrawer`), gevoed door twee nieuwe server actions (`getVersiesVoorDrawer`, `createWhatIfVanHuidigeVersie`). De drawer opent via de bestaande Versies-knop in de Ribbon. Bestaande promote/archiveer actions (`pasWhatIfToe`, `verwerpWhatIf`, `herstelVersie`, `verwijderVersie`) worden direct aangeroepen vanuit de drawer.

**Tech Stack:** Next.js 15 Server Actions, React (client component), Vitest unit tests, Prisma, TypeScript strict

---

## File map

| Actie | Bestand |
|---|---|
| Nieuw | `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.ts` |
| Nieuw | `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.test.ts` |
| Nieuw | `apps/web/src/components/ti-studio/werkbord/VersiesDrawer.tsx` |
| Wijzig | `apps/web/src/components/ti-studio/werkbord/types.ts` |
| Wijzig | `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx` |
| Wijzig | `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx` |
| Wijzig | `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx` |

---

## Task 1: Server actions voor de drawer

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.test.ts`

### 1.1 Schrijf de falende tests

- [ ] Maak het testbestand aan:

```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

const mockPrisma = createMockPrisma();

vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "test@ow.nl" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { getVersiesVoorDrawer, createWhatIfVanHuidigeVersie } =
  await import("./drawer-actions");

describe("getVersiesVoorDrawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geeft werkversie, what-ifs en archiefversies terug", async () => {
    mockPrisma.versie.findMany.mockResolvedValue([
      { id: "v3", nummer: 3, naam: "Concept", auteur: "AJ", createdAt: new Date("2026-04-10") },
      { id: "v2", nummer: 2, naam: "Start", auteur: "AJ", createdAt: new Date("2026-04-09") },
      { id: "v1", nummer: 1, naam: null, auteur: "systeem", createdAt: new Date("2026-04-08") },
    ]);
    mockPrisma.whatIf.findMany.mockResolvedValue([
      {
        id: "wi1", vraag: "Sen 1 verjongen", status: "OPEN",
        basisVersieNummer: 3, createdAt: new Date("2026-04-10"),
        _count: { teams: 2 },
      },
      {
        id: "wi2", vraag: "Rood wisselen", status: "OPEN",
        basisVersieNummer: 2, createdAt: new Date("2026-04-09"),
        _count: { teams: 3 },
      },
      {
        id: "wi3", vraag: "Extra heer", status: "TOEGEPAST",
        basisVersieNummer: 2, createdAt: new Date("2026-04-08"),
        _count: { teams: 1 },
      },
    ]);
    mockPrisma.teamSpeler.count.mockResolvedValue(26);

    const result = await getVersiesVoorDrawer("wi-1");

    expect(result.werkversie.nummer).toBe(3);
    expect(result.werkversie.aantalIngedeeld).toBe(26);
    expect(result.whatIfs).toHaveLength(3);
    expect(result.whatIfs[0].isStale).toBe(false); // v3 == v3
    expect(result.whatIfs[1].isStale).toBe(true);  // v2 < v3
    expect(result.archiefVersies).toHaveLength(2);  // v1 en v2 (v3 is werkversie)
  });

  it("geeft lege arrays terug als er geen what-ifs zijn", async () => {
    mockPrisma.versie.findMany.mockResolvedValue([
      { id: "v1", nummer: 1, naam: null, auteur: "systeem", createdAt: new Date() },
    ]);
    mockPrisma.whatIf.findMany.mockResolvedValue([]);
    mockPrisma.teamSpeler.count.mockResolvedValue(0);

    const result = await getVersiesVoorDrawer("wi-1");

    expect(result.archiefVersies).toHaveLength(0);
    expect(result.whatIfs).toHaveLength(0);
  });
});

describe("createWhatIfVanHuidigeVersie", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maakt een what-if aan met alle teams van de hoogste versie", async () => {
    mockPrisma.versie.findFirst.mockResolvedValue({
      id: "v3", nummer: 3,
      teams: [
        {
          id: "t1", naam: "Sen 1", categorie: "SENIOR", kleur: "BLAUW",
          teamType: null, niveau: null, volgorde: 1,
          spelers: [{ spelerId: "sp1", statusOverride: null, notitie: null }],
          staf: [],
        },
      ],
    });
    mockPrisma.whatIf.create.mockResolvedValue({ id: "wi-new" });

    const result = await createWhatIfVanHuidigeVersie("werkindeling-1", {
      vraag: "Test what-if",
    });

    expect(result.id).toBe("wi-new");
    expect(mockPrisma.whatIf.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          werkindelingId: "werkindeling-1",
          vraag: "Test what-if",
          basisVersieNummer: 3,
        }),
      })
    );
  });

  it("gooit een fout als de werkindeling geen versie heeft", async () => {
    mockPrisma.versie.findFirst.mockResolvedValue(null);

    await expect(
      createWhatIfVanHuidigeVersie("werkindeling-1", { vraag: "Test" })
    ).rejects.toThrow("Werkindeling heeft geen versie");
  });
});
```

- [ ] **Draai tests om te verifiëren dat ze falen:**

```
pnpm test -- drawer-actions --run
```

Verwacht: FAIL — module niet gevonden.

### 1.2 Implementeer de server actions

- [ ] Maak het actiebestand aan:

```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions.ts
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────

export interface DrawerWerkversie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: Date;
  aantalIngedeeld: number;
}

export interface DrawerWhatIf {
  id: string;
  vraag: string;
  status: string;
  basisVersieNummer: number;
  aantalTeams: number;
  isStale: boolean;
  createdAt: Date;
}

export interface DrawerArchiefVersie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: Date;
}

export interface DrawerData {
  werkversie: DrawerWerkversie;
  whatIfs: DrawerWhatIf[];
  archiefVersies: DrawerArchiefVersie[];
}

// ─── getVersiesVoorDrawer ─────────────────────────────────────

export async function getVersiesVoorDrawer(werkindelingId: string): Promise<DrawerData> {
  const versies = await prisma.versie.findMany({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    select: { id: true, nummer: true, naam: true, auteur: true, createdAt: true },
  });

  if (versies.length === 0) {
    throw new Error("Werkindeling heeft geen versies");
  }

  const werkversieRaw = versies[0];
  const archiefRaw = versies.slice(1);

  const [whatIfs, aantalIngedeeld] = await Promise.all([
    prisma.whatIf.findMany({
      where: { werkindelingId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        vraag: true,
        status: true,
        basisVersieNummer: true,
        createdAt: true,
        _count: { select: { teams: true } },
      },
    }),
    prisma.teamSpeler.count({
      where: { team: { versie: { werkindelingId, nummer: werkversieRaw.nummer } } },
    }),
  ]);

  return {
    werkversie: {
      ...werkversieRaw,
      aantalIngedeeld,
    },
    whatIfs: whatIfs.map((wi) => ({
      id: wi.id,
      vraag: wi.vraag,
      status: wi.status,
      basisVersieNummer: wi.basisVersieNummer,
      aantalTeams: wi._count.teams,
      isStale: wi.basisVersieNummer < werkversieRaw.nummer,
      createdAt: wi.createdAt,
    })),
    archiefVersies: archiefRaw,
  };
}

// ─── createWhatIfVanHuidigeVersie ─────────────────────────────

export async function createWhatIfVanHuidigeVersie(
  werkindelingId: string,
  data: { vraag: string; toelichting?: string }
): Promise<{ id: string }> {
  await requireTC();

  const hoogsteVersie = await prisma.versie.findFirst({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    include: {
      teams: {
        select: {
          id: true, naam: true, categorie: true, kleur: true,
          teamType: true, niveau: true, volgorde: true,
          spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
          staf: { select: { stafId: true, rol: true } },
        },
      },
    },
  });

  if (!hoogsteVersie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  const whatIf = await prisma.whatIf.create({
    data: {
      werkindelingId,
      vraag: data.vraag,
      toelichting: data.toelichting ?? null,
      basisVersieNummer: hoogsteVersie.nummer,
      teams: {
        create: hoogsteVersie.teams.map((team) => ({
          bronTeamId: team.id,
          naam: team.naam,
          categorie: team.categorie,
          kleur: team.kleur,
          teamType: team.teamType,
          niveau: team.niveau,
          volgorde: team.volgorde,
          spelers: { create: team.spelers },
          staf: { create: team.staf },
        })),
      },
    },
    select: { id: true },
  });

  logger.info(`What-if "${data.vraag}" aangemaakt voor werkindeling ${werkindelingId}`);
  revalidatePath("/ti-studio/indeling");
  return whatIf;
}
```

- [ ] **Draai tests opnieuw:**

```
pnpm test -- drawer-actions --run
```

Verwacht: alle tests PASS.

- [ ] **Commit:**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/drawer-actions.ts \
        apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/drawer-actions.test.ts
git commit -m "feat(ti-studio): drawer-actions — getVersiesVoorDrawer + createWhatIfVanHuidigeVersie"
```

---

## Task 2: Types uitbreiden

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts`

- [ ] **Voeg de drawer-types toe** aan het einde van `types.ts`:

```ts
// Toevoegen onderaan types.ts

// ─── VersiesDrawer types ──────────────────────────────────────

export type VersiesDrawerConfirm =
  | { type: "promoveer-whatif"; whatIfId: string; vraag: string; basisVersieNummer: number }
  | { type: "herstel-versie"; versieId: string; nummer: number; naam: string | null }
  | { type: "verwijder-versie"; versieId: string; nummer: number }
  | { type: "archiveer-whatif"; whatIfId: string; vraag: string };
```

- [ ] **Commit:**

```bash
git add apps/web/src/components/ti-studio/werkbord/types.ts
git commit -m "feat(ti-studio): VersiesDrawerConfirm type toevoegen"
```

---

## Task 3: VersiesDrawer component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/VersiesDrawer.tsx`

De component is een `"use client"` component. Data wordt als props meegegeven vanuit `TiStudioShell` (die de data ophaalt via `getVersiesVoorDrawer`). Mutaties roepen server actions aan en refreshen de data via `router.refresh()`.

- [ ] **Maak de component aan:**

```tsx
// apps/web/src/components/ti-studio/werkbord/VersiesDrawer.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import "./tokens.css";
import type { DrawerData } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
import type { VersiesDrawerConfirm } from "./types";
import {
  createWhatIfVanHuidigeVersie,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
import { pasWhatIfToe } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-resolve-actions";
import { verwerpWhatIf } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-actions";
import { herstelVersie, verwijderVersie } from "@/app/(teamindeling-studio)/ti-studio/indeling/versies-actions";
import { logger } from "@oranje-wit/types";

interface VersiesDrawerProps {
  open: boolean;
  data: DrawerData | null;
  werkindelingId: string;
  gebruikerEmail: string;
  onClose: () => void;
}

export function VersiesDrawer({
  open,
  data,
  werkindelingId,
  gebruikerEmail,
  onClose,
}: VersiesDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<VersiesDrawerConfirm | null>(null);
  const [toonNieuweWI, setToonNieuweWI] = useState(false);
  const [nieuweVraag, setNieuweVraag] = useState("");
  const [nieuweToelichting, setNieuweToelichting] = useState("");
  const [bezig, setBezig] = useState(false);

  const huidigVersieNummer = data?.werkversie.nummer ?? 0;

  function datumLabel(d: Date): string {
    const nu = new Date();
    const dag = 24 * 60 * 60 * 1000;
    const diff = nu.getTime() - new Date(d).getTime();
    if (diff < dag) return "vandaag";
    if (diff < 2 * dag) return "gisteren";
    return `${Math.floor(diff / dag)}d geleden`;
  }

  async function handleNieuweWI() {
    if (!nieuweVraag.trim() || bezig) return;
    setBezig(true);
    try {
      await createWhatIfVanHuidigeVersie(werkindelingId, {
        vraag: nieuweVraag.trim(),
        toelichting: nieuweToelichting.trim() || undefined,
      });
      setNieuweVraag("");
      setNieuweToelichting("");
      setToonNieuweWI(false);
      startTransition(() => router.refresh());
    } catch (err) {
      logger.error("Fout bij aanmaken what-if", err);
    } finally {
      setBezig(false);
    }
  }

  async function handleConfirm() {
    if (!confirm || bezig) return;
    setBezig(true);
    try {
      if (confirm.type === "promoveer-whatif") {
        await pasWhatIfToe(confirm.whatIfId);
      } else if (confirm.type === "herstel-versie") {
        await herstelVersie(confirm.versieId, gebruikerEmail);
      } else if (confirm.type === "archiveer-whatif") {
        await verwerpWhatIf(confirm.whatIfId);
      } else if (confirm.type === "verwijder-versie") {
        await verwijderVersie(confirm.versieId);
      }
      setConfirm(null);
      startTransition(() => router.refresh());
    } catch (err) {
      logger.error("Fout bij drawer-actie", err);
    } finally {
      setBezig(false);
    }
  }

  return (
    <aside
      style={{
        width: open ? 264 : 0,
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease, opacity 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 14px",
          borderBottom: "1px solid var(--border-0)",
          gap: 8,
          flexShrink: 0,
          background: "var(--bg-0)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".7px",
            color: "var(--text-3)",
            flex: 1,
          }}
        >
          Versies &amp; What-Ifs
        </span>
        <button
          onClick={onClose}
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: "none", border: "none",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "var(--text-3)", fontSize: 12,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!data ? (
          <div style={{ padding: "20px 12px", fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
            Laden…
          </div>
        ) : (
          <>
            {/* ─── Werkversie-blok ─── */}
            <div
              style={{
                margin: "12px 10px 6px",
                background: "linear-gradient(135deg, rgba(255,107,0,.09), rgba(255,107,0,.04))",
                border: "1px solid rgba(255,107,0,.22)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", padding: "8px 10px 5px", gap: 6 }}>
                <span style={{ fontSize: 14 }}>⭐</span>
                <span
                  style={{
                    fontSize: 10, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: ".7px",
                    color: "var(--accent)", flex: 1,
                  }}
                >
                  Werkversie
                </span>
                <span
                  style={{
                    fontSize: 9, fontWeight: 700,
                    padding: "2px 7px", borderRadius: 10,
                    background: "rgba(255,107,0,.14)", color: "var(--accent)",
                    border: "1px solid rgba(255,107,0,.18)",
                  }}
                >
                  v{data.werkversie.nummer} — actief
                </span>
              </div>
              <div style={{ padding: "0 10px 3px", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                {data.werkversie.naam ?? `Versie ${data.werkversie.nummer}`}
              </div>
              <div
                style={{
                  padding: "0 10px 10px",
                  fontSize: 10, color: "var(--text-3)",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span>{datumLabel(data.werkversie.createdAt)}</span>
                <span style={{ opacity: .4 }}>·</span>
                <span>{data.werkversie.auteur}</span>
                <span style={{ opacity: .4 }}>·</span>
                <span>{data.werkversie.aantalIngedeeld} spelers</span>
              </div>
            </div>

            {/* ─── What-Ifs sectie ─── */}
            <SectieHeader
              label="What-Ifs"
              count={data.whatIfs.filter((wi) => wi.status === "OPEN").length + " open"}
            />

            {data.whatIfs.map((wi) => {
              const isOpen = wi.status === "OPEN";
              const isDone = wi.status === "TOEGEPAST";

              return (
                <div
                  key={wi.id}
                  style={{
                    margin: "3px 10px",
                    background: isOpen ? "rgba(59,130,246,.03)" : "var(--bg-0)",
                    border: `1px solid ${isOpen ? "rgba(59,130,246,.2)" : "var(--border-0)"}`,
                    borderRadius: 8,
                    opacity: isOpen ? 1 : 0.55,
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", padding: "8px 10px 4px", gap: 7 }}>
                    <WIIcoon status={wi.status} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: isOpen ? "var(--text-1)" : "var(--text-3)", flex: 1, lineHeight: 1.4 }}>
                      {wi.vraag}
                    </span>
                  </div>

                  {/* Basis-versie label */}
                  <div style={{ padding: "0 10px 3px 37px", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 9, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/>
                        <circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
                      </svg>
                      kopie van
                    </span>
                    <span
                      style={{
                        fontSize: 9, fontWeight: 700,
                        padding: "1px 5px", borderRadius: 4,
                        background: "#1a2130", color: "#4b6480",
                        border: "1px solid #243044",
                      }}
                    >
                      v{wi.basisVersieNummer}
                    </span>
                    {wi.isStale && (
                      <span
                        style={{
                          fontSize: 9, color: "#d97706",
                          background: "rgba(217,119,6,.1)",
                          borderRadius: 4, padding: "1px 5px",
                          display: "flex", alignItems: "center", gap: 3,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        verouderd
                      </span>
                    )}
                    {isDone && (
                      <span style={{ fontSize: 9, color: "var(--text-3)", marginLeft: 4 }}>
                        → v{wi.basisVersieNummer + 1}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div style={{ padding: "0 10px 5px 37px", fontSize: 10, color: "var(--text-3)", display: "flex", gap: 5 }}>
                    <WIStatusBadge status={wi.status} />
                    <span>·</span>
                    <span>{datumLabel(wi.createdAt)} · {wi.aantalTeams} teams</span>
                  </div>

                  {/* Acties — alleen voor open what-ifs */}
                  {isOpen && (
                    confirm?.type === "archiveer-whatif" && confirm.whatIfId === wi.id ? (
                      <InlineConfirm
                        tekst={`"${wi.vraag}" archiveren?`}
                        onJa={handleConfirm}
                        onNee={() => setConfirm(null)}
                        bezig={bezig}
                      />
                    ) : (
                      <div style={{ padding: "0 8px 8px 37px", display: "flex", gap: 5 }}>
                        <button
                          onClick={() => setConfirm({
                            type: "promoveer-whatif",
                            whatIfId: wi.id,
                            vraag: wi.vraag,
                            basisVersieNummer: wi.basisVersieNummer,
                          })}
                          style={btnPrimair}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                          </svg>
                          Maak werkversie
                        </button>
                        <button
                          onClick={() => setConfirm({ type: "archiveer-whatif", whatIfId: wi.id, vraag: wi.vraag })}
                          style={btnSecundair}
                        >
                          Archiveer
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            })}

            {data.whatIfs.length === 0 && (
              <div style={{ padding: "8px 12px 4px", fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
                Nog geen what-ifs
              </div>
            )}

            {/* ─── Versie-archief sectie ─── */}
            <SectieHeader label="Versie-archief" count={String(data.archiefVersies.length)} />

            {data.archiefVersies.map((v) => (
              confirm?.type === "verwijder-versie" && confirm.versieId === v.id ? (
                <div key={v.id} style={{ margin: "3px 10px" }}>
                  <InlineConfirm
                    tekst={`Versie v${v.nummer} verwijderen?`}
                    onJa={handleConfirm}
                    onNee={() => setConfirm(null)}
                    bezig={bezig}
                  />
                </div>
              ) : (
                <div
                  key={v.id}
                  style={{
                    margin: "3px 10px",
                    background: "var(--bg-0)",
                    border: "1px solid var(--border-0)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 8px 7px 10px",
                    gap: 7,
                    opacity: .7,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", width: 20, flexShrink: 0 }}>
                    v{v.nummer}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.naam ?? `Versie ${v.nummer}`}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-3)" }}>
                      {datumLabel(v.createdAt)} · {v.auteur}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirm({ type: "herstel-versie", versieId: v.id, nummer: v.nummer, naam: v.naam })}
                    style={{ fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 5, background: "none", color: "var(--text-3)", border: "1px solid var(--border-0)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                  >
                    ⭐ Zet actief
                  </button>
                  <button
                    onClick={() => setConfirm({ type: "verwijder-versie", versieId: v.id, nummer: v.nummer })}
                    style={{ fontSize: 11, padding: "3px 5px", borderRadius: 5, background: "none", color: "var(--text-3)", border: "none", cursor: "pointer" }}
                  >
                    🗑
                  </button>
                </div>
              )
            ))}

            {data.archiefVersies.length === 0 && (
              <div style={{ padding: "8px 12px 4px", fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
                Geen eerdere versies
              </div>
            )}

            <div style={{ height: 12 }} />
          </>
        )}
      </div>

      {/* Bevestigingsdialog (promoveer / herstel) */}
      {(confirm?.type === "promoveer-whatif" || confirm?.type === "herstel-versie") && (
        <ConfirmDialog
          confirm={confirm}
          huidigVersieNummer={huidigVersieNummer}
          onJa={handleConfirm}
          onNee={() => setConfirm(null)}
          bezig={bezig || isPending}
        />
      )}

      {/* Footer: Nieuwe What-If */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-0)", flexShrink: 0 }}>
        {toonNieuweWI ? (
          <div>
            <input
              type="text"
              placeholder="Wat wil je uitproberen?"
              value={nieuweVraag}
              onChange={(e) => setNieuweVraag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleNieuweWI(); if (e.key === "Escape") setToonNieuweWI(false); }}
              autoFocus
              style={{
                width: "100%", background: "var(--bg-0)",
                border: "1px solid var(--border-1)", borderRadius: 7,
                color: "var(--text-1)", fontSize: 12, fontFamily: "inherit",
                padding: "6px 10px", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={handleNieuweWI}
                disabled={!nieuweVraag.trim() || bezig}
                style={{ ...btnPrimair, flex: 1, justifyContent: "center", opacity: (!nieuweVraag.trim() || bezig) ? .5 : 1 }}
              >
                Aanmaken
              </button>
              <button onClick={() => { setToonNieuweWI(false); setNieuweVraag(""); }} style={btnSecundair}>
                Annuleer
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setToonNieuweWI(true)}
            style={{
              width: "100%", padding: "8px 12px",
              background: "rgba(59,130,246,.07)",
              border: "1px dashed rgba(59,130,246,.22)",
              borderRadius: 8, color: "var(--info)",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Nieuwe What-If aanmaken
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Sub-componenten ──────────────────────────────────────────

function SectieHeader({ label, count }: { label: string; count: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 5px", gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", flex: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600 }}>{count}</span>
    </div>
  );
}

function WIIcoon({ status }: { status: string }) {
  const isOpen = status === "OPEN";
  const isDone = status === "TOEGEPAST";
  const bg = isOpen ? "rgba(59,130,246,.15)" : isDone ? "rgba(34,197,94,.1)" : "rgba(80,80,80,.12)";
  const stroke = isOpen ? "#60a5fa" : isDone ? "#4ade80" : "#6b7280";
  return (
    <div style={{ width: 20, height: 20, borderRadius: 5, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
      {isDone ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      )}
    </div>
  );
}

function WIStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    OPEN:       { bg: "rgba(59,130,246,.12)",  color: "#60a5fa", label: "open" },
    TOEGEPAST:  { bg: "rgba(34,197,94,.1)",    color: "#4ade80", label: "toegepast" },
    VERWORPEN:  { bg: "rgba(100,100,100,.1)",  color: "#6b7280", label: "gearchiveerd" },
    BESLISBAAR: { bg: "rgba(234,179,8,.1)",    color: "#eab308", label: "beslisbaar" },
  };
  const s = styles[status] ?? styles.VERWORPEN;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function InlineConfirm({ tekst, onJa, onNee, bezig }: { tekst: string; onJa: () => void; onNee: () => void; bezig: boolean }) {
  return (
    <div style={{ padding: "8px 10px", background: "var(--bg-2)", borderTop: "1px solid var(--border-0)" }}>
      <p style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8 }}>{tekst}</p>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onNee} style={{ ...btnSecundair, fontSize: 10, padding: "3px 10px" }}>Nee</button>
        <button onClick={onJa} disabled={bezig} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,.12)", color: "#ef4444", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: bezig ? .5 : 1 }}>
          Ja, archiveer
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  confirm,
  huidigVersieNummer,
  onJa,
  onNee,
  bezig,
}: {
  confirm: VersiesDrawerConfirm;
  huidigVersieNummer: number;
  onJa: () => void;
  onNee: () => void;
  bezig: boolean;
}) {
  const nieuweNummer = huidigVersieNummer + 1;
  let titel = "";
  let body: React.ReactNode = null;

  if (confirm.type === "promoveer-whatif") {
    titel = "What-If promoveren?";
    body = (
      <>
        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-1)" }}>"{confirm.vraag}"</strong><br />
          <span style={{ fontSize: 11, color: "var(--info)" }}>gebaseerd op v{confirm.basisVersieNummer}</span>
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", margin: "8px 0 4px" }}>wordt de nieuwe werkversie:</p>
        <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>v{nieuweNummer} — nieuwe werkversie</p>
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
          v{huidigVersieNummer} blijft bewaard in het archief
        </p>
      </>
    );
  } else if (confirm.type === "herstel-versie") {
    titel = `Versie v${confirm.nummer} terugzetten?`;
    body = (
      <>
        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
          Nieuwe versie aanmaken als kopie van<br />
          <strong style={{ color: "var(--text-1)" }}>v{confirm.nummer} "{confirm.naam ?? `Versie ${confirm.nummer}`}"</strong>
        </p>
        <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginTop: 8 }}>v{nieuweNummer} — nieuwe werkversie</p>
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
          Eerdere versies blijven bewaard in het archief
        </p>
      </>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 8,
        right: 8,
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: 10,
        overflow: "hidden",
        zIndex: 20,
        boxShadow: "var(--sh-raise)",
      }}
    >
      <div style={{ padding: "11px 14px 8px", borderBottom: "1px solid var(--border-0)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{titel}</p>
      </div>
      <div style={{ padding: "10px 14px" }}>{body}</div>
      <div style={{ padding: "8px 14px 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onNee} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 6, background: "var(--bg-3)", color: "var(--text-2)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Annuleer
        </button>
        <button
          onClick={onJa}
          disabled={bezig}
          style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, fontWeight: 700, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: bezig ? .5 : 1 }}
        >
          Ja, maak v{nieuweNummer}
        </button>
      </div>
    </div>
  );
}

// ─── Gedeelde button-styles ───────────────────────────────────

const btnPrimair: React.CSSProperties = {
  fontSize: 10, fontWeight: 600,
  padding: "4px 10px", borderRadius: 6,
  background: "rgba(255,107,0,.1)", color: "var(--accent)",
  border: "1px solid rgba(255,107,0,.2)",
  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
  fontFamily: "inherit",
};

const btnSecundair: React.CSSProperties = {
  fontSize: 10, fontWeight: 500,
  padding: "4px 9px", borderRadius: 6,
  background: "none", color: "var(--text-3)",
  border: "1px solid var(--border-0)",
  cursor: "pointer", fontFamily: "inherit",
};
```

- [ ] **Commit:**

```bash
git add apps/web/src/components/ti-studio/werkbord/VersiesDrawer.tsx
git commit -m "feat(ti-studio): VersiesDrawer component"
```

---

## Task 4: TiStudioShell integreren

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

### 4.1 TiStudioShell — panel + data

- [ ] **Pas `TiStudioShell.tsx` aan:**

1. Voeg `"versies"` toe aan het `ActivePanel` type (regel 19):
   ```ts
   type ActivePanel = "pool" | "validatie" | "werkbord" | "versies" | null;
   ```

2. Verwijder de `whatIfActief` state en alle verwijzingen (regel 25 + usages):
   - Verwijder: `const [whatIfActief, setWhatIfActief] = useState(false);`
   - Verwijder de `onToggleWhatIf` callbacks in Ribbon en Toolbar props
   - Verwijder `whatIfActief` uit `WerkbordCanvas` props

3. Voeg de drawer-data state toe na de `alleSpelers` state:
   ```ts
   const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
   ```

4. Voeg een effect toe dat drawer-data laadt wanneer het panel opent:
   ```ts
   useEffect(() => {
     if (activePanel !== "versies") return;
     getVersiesVoorDrawer(versieId).then(setDrawerData).catch(() => {});
   }, [activePanel, versieId]);
   ```

5. Voeg de import toe bovenaan:
   ```ts
   import type { DrawerData } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
   import { getVersiesVoorDrawer } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
   import { VersiesDrawer } from "./VersiesDrawer";
   ```

6. Voeg `VersiesDrawer` toe in de render, naast `ValidatieDrawer`:
   ```tsx
   <VersiesDrawer
     open={activePanel === "versies"}
     data={drawerData}
     werkindelingId={initieleState.werkindelingId}
     gebruikerEmail={gebruikerEmail}
     onClose={() => setActivePanel(null)}
   />
   ```

- [ ] **Commit:**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git commit -m "feat(ti-studio): VersiesDrawer koppelen aan TiStudioShell"
```

### 4.2 Ribbon — versies-knop activeren

- [ ] **Pas `Ribbon.tsx` aan:**

1. Verwijder de `onToggleWhatIf` prop uit de interface en het component
2. Verander de versies-knop `onClick={() => {}}` naar `onClick={() => onTogglePanel("versies")}`
3. Voeg `active={activePanel === "versies"}` toe aan die RibbonBtn

De whatif-knop en de versies-knop zijn **dezelfde knop** — de versies-knop opent de drawer. Verwijder de aparte "whatif" RibbonBtn.

- [ ] **Commit:**

```bash
git add apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
git commit -m "feat(ti-studio): Ribbon versies-knop koppelt aan panel"
```

### 4.3 Toolbar — werkversie-context tonen

- [ ] **Pas `Toolbar.tsx` aan** — vervang de `whatIfActief` prop door `versieNummer`:

Zoek de interface en verwijder `whatIfActief: boolean` en `onToggleWhatIf`. Voeg toe:
```ts
versieNummer: number;
```

In de render, vervang de what-if toggle-knop door een statische context-indicator:
```tsx
<span style={{ fontSize: 11, color: "var(--text-3)" }}>
  ⭐ v{versieNummer} — werkversie
</span>
```

Update de aanroep in `TiStudioShell.tsx`:
```tsx
<Toolbar
  naam={initieleState.naam}
  versieNaam={initieleState.versieNaam}
  versieNummer={initieleState.versieNummer}
  status={initieleState.status}
  totalSpelers={initieleState.totalSpelers}
  ingeplandSpelers={ingeplandSpelers}
  showScores={showScores}
  onToggleScores={() => setShowScores((v) => !v)}
  onNieuwTeam={() => {}}
  onPreview={() => {}}
  onTerug={() => router.push("/ti-studio")}
/>
```

- [ ] **Commit:**

```bash
git add apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
git commit -m "feat(ti-studio): Toolbar toont werkversie-context"
```

---

## Task 5: Typecheck en build verificatie

- [ ] **Draai typecheck:**

```
pnpm --filter @oranje-wit/web typecheck
```

Verwacht: geen type-errors. Fix eventuele fouten (meest waarschijnlijk: vergeten prop na verwijderen `whatIfActief`).

- [ ] **Draai alle unit tests:**

```
pnpm test --run
```

Verwacht: alle bestaande tests + nieuwe drawer-actions tests slagen.

- [ ] **Draai de dev server en test handmatig:**

```
pnpm dev
```

Controleer op http://localhost:3000/ti-studio/indeling:
1. Versies-knop in Ribbon opent de drawer rechts
2. Werkversie-blok toont ⭐ bovenaan
3. Toolbar toont "⭐ v{n} — werkversie"
4. What-If aanmaken: klik "Nieuwe What-If", typ een naam, submit → what-if verschijnt in de lijst
5. Promoveren: klik "Maak werkversie" op een open what-if → bevestigingsdialog toont correct versienummer → na confirm herlaadt de drawer
6. Versie archief: oudere versies tonen "⭐ Zet actief" knop → bevestigingsdialog klopt

- [ ] **Commit als alles werkt:**

```bash
git add -A
git commit -m "feat(ti-studio): Versies & What-If drawer volledig geïntegreerd"
```

---

## Zelf-review checklist

**Spec coverage:**
- ✅ Drawer opent via Versies-knop Ribbon
- ✅ Werkversie-blok met ⭐, badge, naam, metadata
- ✅ What-if kaartjes met basis-versie label + stale badge
- ✅ Acties: promoveren (met modal), archiveren (inline)
- ✅ Versie-archief met "Zet actief" en verwijder
- ✅ Bevestiging altijd nieuw versienummer
- ✅ Nieuwe What-If aanmaken via footer
- ✅ Toolbar toont werkversie-context
- ✅ `whatIfActief` boolean vervalt
- ✅ Server actions getest (unit)
