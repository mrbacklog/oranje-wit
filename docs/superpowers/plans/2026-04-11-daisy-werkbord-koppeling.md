# Daisy Werkbord Koppeling — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DaisyPanel in TI-studio koppelen aan het echte `/api/ai/chat`-endpoint, zodat Daisy de actieve versie kent en schrijf-acties kan uitvoeren via de bestaande 17 tools.

**Architecture:** Versiecontext stroomt van `TiStudioShell` via `WerkbordCanvas` naar `DaisyPanel`. De `TextStreamChatTransport` stuurt `versieId`/`werkindelingId` mee in het POST-body. De chat route injecteert dit in de system prompt via `buildDaisyPrompt`. Tools ontvangen de versieId via het `"v:<uuid>"` prefix in `inContext`.

**Tech Stack:** Next.js 16, Vercel AI SDK v6 (`useChat`, `TextStreamChatTransport`), Prisma, Vitest, Playwright.

---

## Bestandsoverzicht

| Bestand | Actie | Wat |
|---|---|---|
| `apps/web/src/lib/ai/plugins/ti-studio.ts` | Modify | `getVersieId` + `inContext` beschrijvingen |
| `apps/web/src/lib/ai/plugins/ti-studio.test.ts` | Create | Unit tests voor versieId-prefix |
| `apps/web/src/lib/ai/daisy.ts` | Modify | `WerkbordContext` interface + `buildDaisyPrompt` param |
| `apps/web/src/lib/ai/daisy.test.ts` | Create | Unit tests voor buildDaisyPrompt |
| `apps/web/src/app/api/ai/chat/route.ts` | Modify | Body-type uitbreiden, werkbordContext doorgeven |
| `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx` | Modify | Props uitbreiden + DaisyPanel aanroep |
| `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx` | Modify | Props doorgeven aan WerkbordCanvas |
| `apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx` | Rewrite | Echte useChat + streaming UI |
| `e2e/ti-studio/daisy.spec.ts` | Create | E2E smoke test panel open/close |

---

## Task 1: `getVersieId` ondersteunt versieId-prefix

**Spec:** `ti-studio.ts` — `getVersieId("v:<uuid>")` → directe lookup in `prisma.versie`, geen `getLaatsteVersie`.

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts:40-53`
- Create: `apps/web/src/lib/ai/plugins/ti-studio.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

Maak `apps/web/src/lib/ai/plugins/ti-studio.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// getVersieId is private — we testen via teamSamenstelling.execute
// zodat we het prefix-pad dekken zonder de private functie te exposen.
// We mocken prisma.versie.findUnique en kijken of de tool een resultaat
// teruggeeft zonder fout.

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    versie: {
      findUnique: vi.fn(),
    },
    werkindeling: {
      findFirst: vi.fn(),
    },
    team: {
      findMany: vi.fn(),
    },
    kaders: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getTiStudioTools } from "./ti-studio";

describe("getVersieId via tool (prefix v:)", () => {
  beforeEach(() => vi.clearAllMocks());

  it('versieId-prefix "v:<uuid>" geeft versie direct terug', async () => {
    const mockVersieId = "versie-abc-123";
    const vFindUnique = prisma.versie.findUnique as ReturnType<typeof vi.fn>;
    vFindUnique.mockResolvedValue({ id: mockVersieId });

    const teamFindMany = prisma.team.findMany as ReturnType<typeof vi.fn>;
    teamFindMany.mockResolvedValue([]);

    const tools = getTiStudioTools("sessie-1", "test@example.com");
    const result = await tools.teamSamenstelling.execute({
      teamNaam: "Sen 1",
      inContext: `v:${mockVersieId}`,
    });

    // prisma.versie.findUnique aangeroepen met het uuid (zonder prefix)
    expect(vFindUnique).toHaveBeenCalledWith({
      where: { id: mockVersieId },
      select: { id: true },
    });
    // Geen fout — tool kon team opzoeken (ook al is lijst leeg)
    expect(result).not.toHaveProperty("fout");
  });

  it('versieId-prefix met onbekend uuid geeft fout terug', async () => {
    const vFindUnique = prisma.versie.findUnique as ReturnType<typeof vi.fn>;
    vFindUnique.mockResolvedValue(null);

    const tools = getTiStudioTools("sessie-1", "test@example.com");
    const result = await tools.teamSamenstelling.execute({
      teamNaam: "Sen 1",
      inContext: "v:onbekend-uuid",
    });

    expect(result).toHaveProperty("fout");
  });

  it('"werkindeling" pad ongewijzigd — gebruikt kaders lookup', async () => {
    const kadersFindFirst = prisma.kaders.findFirst as ReturnType<typeof vi.fn>;
    kadersFindFirst.mockResolvedValue(null); // geen actieve blauwdruk

    const tools = getTiStudioTools("sessie-1", "test@example.com");
    const result = await tools.teamSamenstelling.execute({
      teamNaam: "Sen 1",
      inContext: "werkindeling",
    });

    expect(kadersFindFirst).toHaveBeenCalled();
    expect(result).toHaveProperty("fout");
  });
});
```

- [ ] **Stap 2: Draai de test — verwacht FAIL**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm test -- --reporter=verbose apps/web/src/lib/ai/plugins/ti-studio.test.ts
```

Verwacht: FAIL — `getVersieId` kent nog geen `"v:"` prefix.

- [ ] **Stap 3: Implementeer de `"v:"` branch in `getVersieId`**

In `apps/web/src/lib/ai/plugins/ti-studio.ts` regel 40-53, vervang de volledige functie:

```typescript
async function getVersieId(inContext: string): Promise<string | null> {
  if (inContext.startsWith("v:")) {
    const id = inContext.slice(2);
    const versie = await prisma.versie.findUnique({
      where: { id },
      select: { id: true },
    });
    return versie?.id ?? null;
  }
  if (inContext === "werkindeling") {
    const blauwdruk = await getWerkBlauwdruk();
    if (!blauwdruk) return null;
    const wi = await prisma.werkindeling.findFirst({
      where: { kadersId: blauwdruk.id, verwijderdOp: null },
    });
    if (!wi) return null;
    const v = await getLaatsteVersie(wi.id);
    return v?.id ?? null;
  }
  const v = await getLaatsteVersie(inContext);
  return v?.id ?? null;
}
```

- [ ] **Stap 4: Draai de test — verwacht PASS**

```bash
pnpm test -- --reporter=verbose apps/web/src/lib/ai/plugins/ti-studio.test.ts
```

Verwacht: 3 tests PASS.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/lib/ai/plugins/ti-studio.ts apps/web/src/lib/ai/plugins/ti-studio.test.ts
git commit -m "feat(daisy): getVersieId ondersteunt directe versieId via v:-prefix"
```

---

## Task 2: `inContext` beschrijvingen bijwerken

**Spec:** Alle 6 `inContext` Zod-describe strings in `ti-studio.ts` bijwerken zodat Daisy weet dat ze `"v:<versieId>"` mag gebruiken.

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts` (6 locaties)

Geen aparte unit test — dit is enkel een string-update in schema-beschrijvingen.

- [ ] **Stap 1: Vervang alle 6 inContext describe-strings**

Zoek in `apps/web/src/lib/ai/plugins/ti-studio.ts` de volgende strings en vervang ze:

| Huidige waarde | Nieuwe waarde |
|---|---|
| `'"werkindeling" (standaard) of een werkindelingId'` | `'"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'` |
| `'"werkindeling" of een werkindelingId'` | `'"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'` |
| `'werkindelingId om het team in aan te maken'` | `'werkindelingId of "v:<versieId>" om het team in aan te maken'` |
| `'"werkindeling" of een werkindelingId'` (stafPlaatsen, regel ~756) | `'"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'` |
| `'werkindelingId'` (selectieAanmaken, regel ~709) | `'werkindelingId of "v:<versieId>"'` |

Er zijn 6 locaties. Zoek ze op met:
```bash
grep -n 'inContext.*describe' apps/web/src/lib/ai/plugins/ti-studio.ts
```
En pas elke regel aan zoals hierboven.

- [ ] **Stap 2: Draai de bestaande tests om te verifiëren dat er niets gebroken is**

```bash
pnpm test -- --reporter=verbose apps/web/src/lib/ai/plugins/ti-studio.test.ts
```

Verwacht: 3 tests PASS.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/lib/ai/plugins/ti-studio.ts
git commit -m "feat(daisy): inContext beschrijvingen uitgebreid met v:-prefix optie"
```

---

## Task 3: `buildDaisyPrompt` ondersteunt werkbordcontext

**Spec:** `daisy.ts` — optionele `WerkbordContext` parameter, geeft 4-regel blok in de system prompt als het aanwezig is.

**Files:**
- Modify: `apps/web/src/lib/ai/daisy.ts`
- Create: `apps/web/src/lib/ai/daisy.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

Maak `apps/web/src/lib/ai/daisy.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@oranje-wit/types", () => ({
  HUIDIG_SEIZOEN: "2025-2026",
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { buildDaisyPrompt } from "./daisy";
import type { AuthSession } from "@oranje-wit/auth/checks";

const mockSession: AuthSession = {
  user: {
    name: "Antjan",
    email: "antjan@example.com",
    clearance: 3,
    isTC: true,
  },
} as AuthSession;

describe("buildDaisyPrompt", () => {
  it("bevat geen werkbord-blok als context ontbreekt", () => {
    const prompt = buildDaisyPrompt(mockSession);
    expect(prompt).not.toContain("Actieve werkindeling");
    expect(prompt).not.toContain("v:");
  });

  it("bevat werkbord-blok met versieId en naam als context aanwezig is", () => {
    const prompt = buildDaisyPrompt(mockSession, {
      versieId: "abc-123",
      werkindelingId: "wi-456",
      werkindelingNaam: "Veld Voorjaar 2026",
    });
    expect(prompt).toContain("Veld Voorjaar 2026");
    expect(prompt).toContain("v:abc-123");
    expect(prompt).toContain("v:abc-123");
  });

  it("bevat altijd de basisregels ongeacht context", () => {
    const prompt = buildDaisyPrompt(mockSession);
    expect(prompt).toContain("Daisy");
    expect(prompt).toContain("Nederlands");
  });
});
```

- [ ] **Stap 2: Draai de test — verwacht FAIL**

```bash
pnpm test -- --reporter=verbose apps/web/src/lib/ai/daisy.test.ts
```

Verwacht: FAIL — `buildDaisyPrompt` accepteert nog geen tweede parameter.

- [ ] **Stap 3: Voeg `WerkbordContext` toe en update `buildDaisyPrompt`**

In `apps/web/src/lib/ai/daisy.ts`, voeg toe vóór de `buildDaisyPrompt` functie:

```typescript
export interface WerkbordContext {
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}
```

Verander de functie-signatuur:

```typescript
export function buildDaisyPrompt(session: AuthSession, werkbordContext?: WerkbordContext): string {
```

Voeg `werkbordBlok` toe direct na de `const naam = ...` regel:

```typescript
const werkbordBlok = werkbordContext
  ? `\n## Actieve werkindeling\n- Naam: ${werkbordContext.werkindelingNaam}\n- VersieId: v:${werkbordContext.versieId}\n- WerkindelingId: ${werkbordContext.werkindelingId}\nGebruik "v:${werkbordContext.versieId}" als inContext voor alle TI-studio tools, tenzij de gebruiker expliciet een andere context vraagt.\n`
  : "";
```

Voeg `${werkbordBlok}` in na het `## Context`-blok in de template string (na de `- Gebruiker: ...` regel):

```typescript
## Context
- Seizoen: ${HUIDIG_SEIZOEN}
- Maand: ${huidigeMaand()}
- Periode: ${seizoensPeriode()}
- Gebruiker: ${naam} (clearance ${user.clearance}, ${user.isTC ? "TC-lid" : "geen TC"})
${werkbordBlok}
## De Oranje Draad
```

- [ ] **Stap 4: Draai de test — verwacht PASS**

```bash
pnpm test -- --reporter=verbose apps/web/src/lib/ai/daisy.test.ts
```

Verwacht: 3 tests PASS.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/lib/ai/daisy.ts apps/web/src/lib/ai/daisy.test.ts
git commit -m "feat(daisy): buildDaisyPrompt ondersteunt optionele werkbordcontext in system prompt"
```

---

## Task 4: Chat route leest werkbordcontext uit body

**Spec:** `/api/ai/chat/route.ts` — `versieId`, `werkindelingId`, `werkindelingNaam` optioneel uit body lezen en doorgeven aan `buildDaisyPrompt`.

**Files:**
- Modify: `apps/web/src/app/api/ai/chat/route.ts:35-40`

Geen unit test — dit is routing-lijm die gedekt wordt door E2E.

- [ ] **Stap 1: Breid het body-type uit**

In `route.ts`, vervang het huidige body-type (regels ~35-41):

```typescript
// Oud:
const body = (await request.json()) as {
  messages?: UIMessage[];
  gesprekId?: string;
};
const { messages, gesprekId } = body;

// Nieuw:
const body = (await request.json()) as {
  messages?: UIMessage[];
  gesprekId?: string;
  versieId?: string;
  werkindelingId?: string;
  werkindelingNaam?: string;
};
const { messages, gesprekId, versieId, werkindelingId, werkindelingNaam } = body;
```

- [ ] **Stap 2: Stel werkbordContext in**

Voeg toe na de destructuring, vóór het gesprek aanmaken:

```typescript
const werkbordContext =
  versieId && werkindelingId
    ? { versieId, werkindelingId, werkindelingNaam: werkindelingNaam ?? "" }
    : undefined;
```

- [ ] **Stap 3: Geef werkbordContext door aan buildDaisyPrompt**

Zoek de `streamText` aanroep en vervang de `system` regel:

```typescript
// Oud:
system: buildDaisyPrompt(session),

// Nieuw:
system: buildDaisyPrompt(session, werkbordContext),
```

- [ ] **Stap 4: Importeer WerkbordContext type**

Bovenaan `route.ts`, voeg toe aan de bestaande import van `buildDaisyPrompt`:

```typescript
import { buildDaisyPrompt } from "@/lib/ai/daisy";
// wordt:
import { buildDaisyPrompt, type WerkbordContext } from "@/lib/ai/daisy";
```

> **Note:** `WerkbordContext` wordt impliciet gebruikt via het geïnfereerde type van `werkbordContext` — de import is niet strikt noodzakelijk maar maakt het type expliciet. Laat de import weg als TypeScript niet klaagt.

- [ ] **Stap 5: Typecheck**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm -F web tsc --noEmit 2>&1 | head -30
```

Verwacht: geen fouten in `route.ts`.

- [ ] **Stap 6: Commit**

```bash
git add apps/web/src/app/api/ai/chat/route.ts
git commit -m "feat(daisy): chat route leest werkbordcontext uit POST body"
```

---

## Task 5: `WerkbordCanvas` props uitbreiden

**Spec:** `WerkbordCanvas` krijgt `versieId`, `werkindelingId`, `werkindelingNaam` als props en geeft ze door aan `<DaisyPanel>`.

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx:9-39` (interface)
- Modify: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx:89-108` (destructuring)
- Modify: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx:697` (DaisyPanel aanroep)

- [ ] **Stap 1: Breid `WerkbordCanvasProps` uit**

In `WerkbordCanvas.tsx`, voeg toe onderaan de interface (na `onTitelKlik?`):

```typescript
interface WerkbordCanvasProps {
  // ...bestaande props...
  onTitelKlik?: (teamId: string) => void;
  // Nieuw:
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}
```

- [ ] **Stap 2: Voeg toe aan destructuring**

In de `WerkbordCanvas` functie destructuring (regel ~89-108), voeg toe:

```typescript
export function WerkbordCanvas({
  teams,
  // ...bestaande props...
  onTitelKlik,
  versieId,        // nieuw
  werkindelingId,  // nieuw
  werkindelingNaam, // nieuw
}: WerkbordCanvasProps) {
```

- [ ] **Stap 3: Pas de `<DaisyPanel>` aanroep aan**

Zoek `<DaisyPanel />` (regel ~697) en vervang:

```typescript
// Oud:
<DaisyPanel />

// Nieuw:
<DaisyPanel
  versieId={versieId}
  werkindelingId={werkindelingId}
  werkindelingNaam={werkindelingNaam}
/>
```

- [ ] **Stap 4: Typecheck**

```bash
pnpm -F web tsc --noEmit 2>&1 | head -30
```

Verwacht: TypeScript-fout in `TiStudioShell.tsx` — `WerkbordCanvas` verwacht nu 3 extra props (die fix zit in Task 6).

- [ ] **Stap 5: Commit (ook al is typecheck nog rood — Task 6 fixt dit)**

```bash
git add apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
git commit -m "feat(daisy): WerkbordCanvas props uitgebreid met versie- en werkindelingcontext"
```

---

## Task 6: `TiStudioShell` geeft context door aan `WerkbordCanvas`

**Spec:** `TiStudioShell` heeft `initieleState.versieId`, `initieleState.werkindelingId` en `initieleState.naam` — geef ze door.

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx:172-193`

- [ ] **Stap 1: Voeg 3 props toe aan `<WerkbordCanvas>`**

Zoek de `<WerkbordCanvas ...>` aanroep (rond regel 172) en voeg toe vóór de sluit-tag:

```typescript
<WerkbordCanvas
  teams={teams}
  zoomLevel={zoomLevel}
  zoom={zoom}
  zoomPercent={zoomPercent}
  showScores={showScores}
  onToggleScores={() => setShowScores((v) => !v)}
  onZoomIn={zoomIn}
  onZoomOut={zoomOut}
  onZoomReset={resetZoom}
  onZoomChange={setZoom}
  onOpenTeamDrawer={openTeamDrawer}
  onDropSpelerOpTeam={verplaatsSpeler}
  onReturneerNaarPool={(spelerData, vanTeamId) =>
    verwijderSpelerUitTeam(spelerData.id, vanTeamId)
  }
  onTeamPositionChange={verplaatsTeamKaart}
  onTeamDragEnd={slaTeamPositieOp}
  onSpelerClick={openProfiel}
  onDropSpelerOpSelectie={onDropSpelerOpSelectieFn}
  onTitelKlik={openTeamDialog}
  versieId={versieId}
  werkindelingId={initieleState.werkindelingId}
  werkindelingNaam={initieleState.naam}
/>
```

- [ ] **Stap 2: Typecheck — verwacht nu geen fouten meer**

```bash
pnpm -F web tsc --noEmit 2>&1 | head -30
```

Verwacht: geen fouten (of alleen nog de fout over DaisyPanel props — die fixt Task 7).

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git commit -m "feat(daisy): TiStudioShell geeft versiecontext door aan WerkbordCanvas"
```

---

## Task 7: `DaisyPanel` volledige herschrijving

**Spec:** Verwijder hardcoded demo, quick-prompts en statische textarea. Vervang door echte `useChat` met streaming berichten, undo-knop na tool-calls, loading indicator.

**Files:**
- Rewrite: `apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx`

- [ ] **Stap 1: Vervang de volledige inhoud van `DaisyPanel.tsx`**

Schrijf het bestand volledig opnieuw met de volgende inhoud:

```typescript
"use client";
import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import "./tokens.css";

interface DaisyPanelProps {
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}

function heeftToolCall(bericht: UIMessage): boolean {
  return bericht.parts?.some((p) => p.type === "tool-invocation") ?? false;
}

export function DaisyPanel({ versieId, werkindelingId, werkindelingNaam }: DaisyPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useRef(
    new TextStreamChatTransport({
      api: "/api/ai/chat",
      body: { versieId, werkindelingId, werkindelingNaam },
    })
  );

  const { messages, sendMessage, status } = useChat({ transport: transport.current });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOngedaan = () => {
    sendMessage({ text: "Maak de laatste actie ongedaan." });
  };

  const lastMessageIsUser =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 4px 16px rgba(255,107,0,.45)",
            zIndex: 30,
            fontFamily: "inherit",
          }}
          aria-label="Daisy openen"
        >
          ✦
        </button>
      )}

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: "var(--daisy-w)",
          height: 420,
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.15)",
          zIndex: 30,
          overflow: "hidden",
          transform: open ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "bottom right",
        }}
        role="dialog"
        aria-label="Daisy chat"
        aria-modal="true"
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-0)",
            flexShrink: 0,
            background: "linear-gradient(90deg, rgba(255,107,0,.08) 0%, transparent 60%)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #FF8533)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(255,107,0,.3)",
              position: "relative",
            }}
          >
            ✦
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--ok)",
                position: "absolute",
                bottom: 0,
                right: 0,
                border: "2px solid var(--bg-1)",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Daisy</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>
              {isLoading ? "denkt na..." : `AI-assistent · ${werkindelingNaam}`}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-3)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
            aria-label="Daisy sluiten"
          >
            ✕
          </button>
        </div>

        {/* Berichten */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 8,
                color: "var(--text-3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28 }}>✦</div>
              <p style={{ fontSize: 12, margin: 0 }}>Hoi! Ik ben Daisy.</p>
              <p style={{ fontSize: 11, margin: 0 }}>Vraag me iets over de teams of spelers.</p>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        borderBottomLeftRadius: m.role === "assistant" ? 4 : 12,
                        borderBottomRightRadius: m.role === "user" ? 4 : 12,
                        background:
                          m.role === "user" ? "var(--accent)" : "var(--bg-2)",
                        color: m.role === "user" ? "#fff" : "var(--text-1)",
                        border: m.role === "user" ? "none" : "1px solid var(--border-1)",
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.parts
                        ?.filter((p) => p.type === "text")
                        .map((p, i) => (
                          <span key={i}>{(p as { type: "text"; text: string }).text}</span>
                        )) ?? m.content}
                    </div>
                  </div>
                  {/* Undo-knop na assistent-bericht met tool-call */}
                  {m.role === "assistant" && heeftToolCall(m) && (
                    <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                      <button
                        onClick={handleOngedaan}
                        disabled={isLoading}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: isLoading ? "not-allowed" : "pointer",
                          background: "var(--bg-0)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border-1)",
                          fontFamily: "inherit",
                          opacity: isLoading ? 0.5 : 1,
                        }}
                      >
                        ↩ Ongedaan maken
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {/* Loading indicator */}
              {isLoading && lastMessageIsUser && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 12,
                      borderBottomLeftRadius: 4,
                      background: "var(--bg-2)",
                      border: "1px solid var(--border-1)",
                      fontSize: 12,
                      color: "var(--text-3)",
                    }}
                  >
                    …
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--border-0)",
            display: "flex",
            gap: 6,
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Vraag Daisy iets... (Enter = verstuur)"
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--border-1)",
              borderRadius: 10,
              color: "var(--text-1)",
              fontSize: 12,
              fontFamily: "inherit",
              padding: "8px 12px",
              outline: "none",
              resize: "none",
              minHeight: 36,
              maxHeight: 80,
              lineHeight: 1.4,
              opacity: isLoading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: input.trim() && !isLoading ? "var(--accent)" : "var(--bg-2)",
              color: input.trim() && !isLoading ? "#fff" : "var(--text-3)",
              border: "none",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
              fontFamily: "inherit",
            }}
            aria-label="Verstuur"
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Stap 2: Typecheck**

```bash
pnpm -F web tsc --noEmit 2>&1 | head -30
```

Verwacht: geen fouten.

- [ ] **Stap 3: Draai alle unit tests**

```bash
pnpm test 2>&1 | tail -20
```

Verwacht: alle tests groen (de nieuwe tests + alle bestaande 340 tests).

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx
git commit -m "feat(daisy): DaisyPanel herschreven met echte useChat + streaming berichten"
```

---

## Task 8: E2E smoke test Daisy panel

**Spec:** Playwright test — panel openen, sluit met ✕, input beschikbaar.

**Files:**
- Create: `e2e/ti-studio/daisy.spec.ts`

- [ ] **Stap 1: Maak de testfile aan**

```typescript
import { test, expect } from "@playwright/test";

// Navigeer naar de TI-studio indeling pagina
// Auth wordt afgehandeld via storageState (zie playwright.config.ts)

test.describe("Daisy panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ti-studio/indeling");
    await page.waitForLoadState("networkidle");
  });

  test("FAB opent het panel", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await expect(fab).toBeVisible();
    await fab.click();

    const panel = page.getByRole("dialog", { name: "Daisy chat" });
    await expect(panel).toBeVisible();
  });

  test("panel sluit met sluit-knop", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const sluitKnop = page.getByRole("button", { name: "Daisy sluiten" });
    await expect(sluitKnop).toBeVisible();
    await sluitKnop.click();

    // FAB weer zichtbaar, panel niet meer klikbaar
    await expect(fab).toBeVisible();
  });

  test("input field is aanwezig en accepteert tekst", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const input = page.getByPlaceholder("Vraag Daisy iets...");
    await expect(input).toBeVisible();
    await input.fill("Hoeveel spelers zitten er in Sen 1?");
    await expect(input).toHaveValue("Hoeveel spelers zitten er in Sen 1?");
  });
});
```

- [ ] **Stap 2: Draai de E2E test lokaal**

Zorg dat de dev server draait (`pnpm dev`), dan:

```bash
pnpm test:e2e e2e/ti-studio/daisy.spec.ts 2>&1 | tail -20
```

Verwacht: 3 tests PASS.

- [ ] **Stap 3: Commit**

```bash
git add e2e/ti-studio/daisy.spec.ts
git commit -m "test(e2e): Daisy panel smoke tests — open/sluit/input"
```

---

## Self-review

### Spec-dekking

| Spec-onderdeel | Task |
|---|---|
| `getVersieId` versieId-prefix | Task 1 |
| `inContext` beschrijvingen | Task 2 |
| `WerkbordContext` + `buildDaisyPrompt` | Task 3 |
| Chat route leest body | Task 4 |
| `WerkbordCanvas` props | Task 5 |
| `TiStudioShell` props doorgeven | Task 6 |
| `DaisyPanel` herschrijven | Task 7 |
| Bevestigingsflow (al in system prompt) | — geen code nodig |
| E2E tests | Task 8 |

### Type-consistentie

- `WerkbordContext` interface gedefinieerd in Task 3, gebruikt in Task 4 (import type)
- `DaisyPanelProps` props `versieId/werkindelingId/werkindelingNaam` gedefinieerd in Task 7, aangeleverd in Task 5
- `UIMessage` import in Task 7 voor `heeftToolCall` — consistent met `useChat` message type
- `TextStreamChatTransport` — bestaand patroon uit `chat-panel.tsx`

### Placeholder-scan

Geen TBD/TODO aangetroffen. Alle code-stappen bevatten volledige implementaties.
