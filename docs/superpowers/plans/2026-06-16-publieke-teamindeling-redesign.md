# Publieke Teamindeling Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Volledige visuele herontwerp van de publieke teamindeling — van licht/geel/simplistisch naar dark/oranje+wit/modern met animaties, kennismakingstrainingen en belangrijke data.

**Architecture:** Het bestaande monolithische component (~875 regels inline styles) wordt opgesplitst in gerichte sub-componenten per verantwoordelijkheid. CSS custom properties regelen het kleurenpalet centraal. Animaties lopen via CSS keyframes + React state-driven class-toggling.

**Tech Stack:** React 18, Next.js 16, TypeScript, inline CSS custom properties, CSS keyframes via `<style>` tag in layout. Geen nieuwe dependencies.

---

## Bestandenkaart

| Bestand | Status | Verantwoordelijkheid |
|---|---|---|
| `apps/ti-studio/src/app/teamindeling/publieke-teamindeling.css` | **Nieuw** | CSS vars, keyframes (slide, fade, shimmer), animatieklassen |
| `apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx` | **Nieuw** | Pagina 1: wit+oranje hero, sectiekoppen, belangrijke data, kennismakingstrainingen, CTA |
| `apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx` | **Nieuw** | Oranje diagonale hero + spelerskolommen + stafpills + kennismakingstraining blok |
| `apps/ti-studio/src/app/teamindeling/components/NavHeader.tsx` | **Nieuw** | Glassmorphism sticky header (logo + 2 identieke knoppen) |
| `apps/ti-studio/src/app/teamindeling/components/NavFooter.tsx` | **Nieuw** | Glassmorphism footer (prev/next + dots + teamnaam) |
| `apps/ti-studio/src/app/teamindeling/components/ZoekOverlay.tsx` | **Nieuw** | Dark zoekoverlay met oranje input border |
| `apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx` | **Herschreven** | Orchestrator: state, animatie-trigger, page routing, keyboard/swipe handlers |
| `apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts` | **Uitgebreid** | Types + data fetcher: KennismakingItem, belangrijkeData, kennismakingstraining per team |

---

## Task 1: CSS-bestand aanmaken (design tokens + animaties)

**Files:**
- Create: `apps/ti-studio/src/app/teamindeling/publieke-teamindeling.css`

- [ ] **Stap 1: Maak het CSS-bestand aan**

```css
/* apps/ti-studio/src/app/teamindeling/publieke-teamindeling.css */

.pt-root {
  --pt-oranje: #FF6600;
  --pt-oranje-licht: #ff8833;
  --pt-oranje-dim: rgba(255, 102, 0, 0.15);
  --pt-oranje-glow: rgba(255, 102, 0, 0.30);
  --pt-zwart: #080808;
  --pt-donker: #0f0f0f;
  --pt-border: rgba(255, 255, 255, 0.07);
  --pt-tekst: rgba(255, 255, 255, 0.88);
  --pt-subtekst: rgba(255, 255, 255, 0.40);
}

/* ── Slide animaties (team wisselen) ── */
@keyframes pt-slide-in-right {
  from { transform: translateX(60px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes pt-slide-in-left {
  from { transform: translateX(-60px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes pt-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pt-shimmer {
  0%   { opacity: 0.08; }
  50%  { opacity: 0.18; }
  100% { opacity: 0.08; }
}

.pt-slide-next { animation: pt-slide-in-right 0.30s ease both; }
.pt-slide-prev { animation: pt-slide-in-left  0.30s ease both; }

/* Stagger fade-in voor spelers — nth-child delay */
.pt-speler { opacity: 0; animation: pt-fade-in 0.25s ease forwards; }
.pt-speler:nth-child(1)  { animation-delay: 0.00s; }
.pt-speler:nth-child(2)  { animation-delay: 0.04s; }
.pt-speler:nth-child(3)  { animation-delay: 0.08s; }
.pt-speler:nth-child(4)  { animation-delay: 0.12s; }
.pt-speler:nth-child(5)  { animation-delay: 0.16s; }
.pt-speler:nth-child(6)  { animation-delay: 0.20s; }
.pt-speler:nth-child(7)  { animation-delay: 0.24s; }
.pt-speler:nth-child(8)  { animation-delay: 0.28s; }
.pt-speler:nth-child(9)  { animation-delay: 0.32s; }
.pt-speler:nth-child(10) { animation-delay: 0.36s; }
.pt-speler:nth-child(n+11) { animation-delay: 0.40s; }

.pt-hero-shimmer {
  animation: pt-shimmer 2.5s ease 0.2s 1 forwards;
}
```

- [ ] **Stap 2: Importeer in PubliekeTeamindeling.tsx** (tijdelijk — het hoofd-component bestaat nog)

Voeg bovenaan het bestaande `PubliekeTeamindeling.tsx` toe:
```ts
import "./publieke-teamindeling.css";
```

- [ ] **Stap 3: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/publieke-teamindeling.css
git add apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx
git commit -m "fix(ti-studio): publieke teamindeling — CSS tokens + animatieklassen"
```

---

## Task 2: Types uitbreiden in publieke-presentatie.ts

**Files:**
- Modify: `apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts`

- [ ] **Stap 1: Voeg KennismakingItem type toe en breid bestaande types uit**

Voeg ná de bestaande type-definities toe (na regel `export type PubliekeTeamindelingData`):

```ts
export type KennismakingItem = {
  teamnaam: string;
  datum: string;    // bijv. "za 23 augustus 2026"
  tijd: string;     // bijv. "10:00–12:00"
  locatie: string;  // bijv. "Sporthal De Hollandse IJssel"
};

export type BelangrijkeDatumItem = {
  datum: string;        // bijv. "za 16 augustus 2026"
  omschrijving: string; // bijv. "Eerste training senioren"
};
```

- [ ] **Stap 2: Breid PubliekeToelichtingData uit**

Vervang de bestaande definitie:
```ts
// VOOR:
export type PubliekeToelichtingData = {
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  tcTekst: string;
};

// NA:
export type PubliekeToelichtingData = {
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  tcTekst: string;
  belangrijkeData: BelangrijkeDatumItem[];
  kennismakingstrainingen: KennismakingItem[];
};
```

- [ ] **Stap 3: Breid PubliekTeam uit**

Zoek de `PubliekTeam` type definitie en voeg toe aan het einde van het object (vóór het sluitende `}`):
```ts
  kennismakingstraining: KennismakingItem | null;
```

- [ ] **Stap 4: Update mapToelichting functie** (onderaan het bestand)

```ts
// VOOR:
function mapToelichting(
  p: { titel: string; seizoenLabel: string; introTekst: string; tcTekst: string } | null
): PubliekeToelichtingData | null {
  if (!p) return null;
  return {
    titel: p.titel,
    seizoenLabel: p.seizoenLabel,
    introTekst: p.introTekst,
    tcTekst: p.tcTekst,
  };
}

// NA:
function mapToelichting(
  p: { titel: string; seizoenLabel: string; introTekst: string; tcTekst: string } | null
): PubliekeToelichtingData | null {
  if (!p) return null;
  return {
    titel: p.titel,
    seizoenLabel: p.seizoenLabel,
    introTekst: p.introTekst,
    tcTekst: p.tcTekst,
    belangrijkeData: [],         // gevuld zodra DB-kolom beschikbaar is
    kennismakingstrainingen: [], // gevuld zodra DB-kolom beschikbaar is
  };
}
```

- [ ] **Stap 5: Voeg `kennismakingstraining: null` toe aan beide kaart-opbouw-plekken**

Zoek de twee `kaarten.push({` aanroepen (voor losse teams én selectiegroepen) en voeg onderaan elk object toe:
```ts
      kennismakingstraining: null, // wordt gevuld zodra DB-kolom beschikbaar is
```

- [ ] **Stap 6: Typecheck**
```bash
cd apps/ti-studio && pnpm exec tsc --noEmit 2>&1 | head -30
```
Verwacht: geen fouten.

- [ ] **Stap 7: Commit**
```bash
git add apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts
git commit -m "fix(ti-studio): publieke presentatie types — KennismakingItem, BelangrijkeDatumItem"
```

---

## Task 3: ZoekOverlay component

**Files:**
- Create: `apps/ti-studio/src/app/teamindeling/components/ZoekOverlay.tsx`

De zoekoverlay blijft functioneel identiek maar krijgt de dark stijl.

- [ ] **Stap 1: Maak de components-map aan en schrijf ZoekOverlay.tsx**

```bash
mkdir -p apps/ti-studio/src/app/teamindeling/components
```

```tsx
// apps/ti-studio/src/app/teamindeling/components/ZoekOverlay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { PubliekeSpeler, PubliekTeam } from "@/lib/teamindeling/publieke-presentatie";

function volleNaam(sp: PubliekeSpeler): string {
  return [sp.roepnaam, sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(" ");
}

type ZoekResultaat = {
  naam: string;
  teamnaam: string;
  teamIdx: number;
};

export function ZoekOverlay({
  teams,
  onSluit,
  onKiesTeam,
}: {
  teams: PubliekTeam[];
  onSluit: () => void;
  onKiesTeam: (idx: number) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();
  const resultaten: ZoekResultaat[] = [];

  if (q.length >= 1) {
    teams.forEach((team, teamIdx) => {
      const directe = [...team.dames, ...team.heren];
      directe.forEach((sp) => {
        const naam = volleNaam(sp);
        if (naam.toLowerCase().includes(q))
          resultaten.push({ naam, teamnaam: team.naam, teamIdx });
      });
      team.subteams.forEach((sub) => {
        [...sub.dames, ...sub.heren].forEach((sp) => {
          const naam = volleNaam(sp);
          if (naam.toLowerCase().includes(q))
            resultaten.push({ naam, teamnaam: `${team.naam} → ${sub.naam}`, teamIdx });
        });
      });
    });
  }

  const gezien = new Set<string>();
  const uniek = resultaten.filter((r) => {
    const key = `${r.naam}__${r.teamIdx}`;
    if (gezien.has(key)) return false;
    gezien.add(key);
    return true;
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 60,
      }}
      onClick={onSluit}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          width: "min(480px, calc(100vw - 32px))",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 30px rgba(255,102,0,0.08)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "14px 14px 0" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op naam…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)",
              border: "2px solid #FF6600",
              borderRadius: 8, padding: "12px 16px",
              fontSize: 16, color: "#fff", outline: "none",
            }}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "6px 0" }}>
          {q.length === 0 && (
            <div style={{ padding: "20px 14px", color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" }}>
              Typ een naam om te zoeken · <kbd style={{ fontSize: 11, opacity: 0.6 }}>Ctrl+K</kbd>
            </div>
          )}
          {q.length > 0 && uniek.length === 0 && (
            <div style={{ padding: "20px 14px", color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" }}>
              Geen resultaten
            </div>
          )}
          {uniek.map((r, i) => (
            <button
              key={i}
              onClick={() => { onKiesTeam(r.teamIdx); onSluit(); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                textAlign: "left", borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6600", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>{r.naam}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{r.teamnaam}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ padding: "10px 14px", fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          Tap of klik buiten dit venster om te sluiten
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/components/ZoekOverlay.tsx
git commit -m "fix(ti-studio): publieke teamindeling — ZoekOverlay dark stijl"
```

---

## Task 4: NavHeader component

**Files:**
- Create: `apps/ti-studio/src/app/teamindeling/components/NavHeader.tsx`

- [ ] **Stap 1: Schrijf NavHeader.tsx**

```tsx
// apps/ti-studio/src/app/teamindeling/components/NavHeader.tsx
"use client";

const glassStyle: React.CSSProperties = {
  background: "rgba(8,8,8,0.94)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  padding: "7px 14px",
  whiteSpace: "nowrap" as const,
  letterSpacing: "0.02em",
};

export function NavHeader({
  seizoenLabel,
  onZoek,
  onToelichting,
}: {
  seizoenLabel: string | null;
  onZoek: () => void;
  onToelichting: () => void;
}) {
  return (
    <div
      style={{
        ...glassStyle,
        position: "sticky", top: 3, zIndex: 40,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        gap: 8,
      }}
    >
      {/* Logo + seizoen */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#FF6600",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 7, fontWeight: 900, color: "#fff",
            textAlign: "center", lineHeight: 1.15, flexShrink: 0,
          }}
        >
          OW<br />100
        </div>
        {seizoenLabel && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
            {seizoenLabel}
          </span>
        )}
      </div>

      {/* Knoppen — identieke stijl */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button style={btnStyle} onClick={onZoek}>🔍 Zoek naam</button>
        <button style={btnStyle} onClick={onToelichting}>← Toelichting</button>
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/components/NavHeader.tsx
git commit -m "fix(ti-studio): publieke teamindeling — NavHeader glassmorphism"
```

---

## Task 5: NavFooter component

**Files:**
- Create: `apps/ti-studio/src/app/teamindeling/components/NavFooter.tsx`

- [ ] **Stap 1: Schrijf NavFooter.tsx**

```tsx
// apps/ti-studio/src/app/teamindeling/components/NavFooter.tsx
"use client";

import type { PubliekTeam } from "@/lib/teamindeling/publieke-presentatie";

function Dot({ active, isSelectie }: { active: boolean; isSelectie: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: active ? 18 : 5,
        height: 5,
        borderRadius: active ? 3 : "50%",
        background: active
          ? isSelectie ? "rgba(255,255,255,0.6)" : "#FF6600"
          : "rgba(255,255,255,0.12)",
        boxShadow: active && !isSelectie ? "0 0 6px rgba(255,102,0,0.4)" : "none",
        transition: "width 0.25s ease, background 0.25s ease",
        flexShrink: 0,
      }}
    />
  );
}

const activeBtn: React.CSSProperties = {
  background: "#FF6600",
  color: "#fff",
  boxShadow: "0 2px 12px rgba(255,102,0,0.3)",
};
const disabledBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.2)",
  cursor: "default",
  boxShadow: "none",
};
const baseBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 6,
  padding: "9px 16px",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export function NavFooter({
  teams,
  teamIdx,
  onVorig,
  onVolgend,
  onKiesTeam,
}: {
  teams: PubliekTeam[];
  teamIdx: number;
  onVorig: () => void;
  onVolgend: () => void;
  onKiesTeam: (idx: number) => void;
}) {
  const huidig = teams[teamIdx];

  return (
    <div
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "rgba(8,8,8,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "11px 18px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 10,
      }}
    >
      {/* Vorig */}
      <button
        onClick={onVorig}
        disabled={teamIdx === 0}
        style={{ ...baseBtn, ...(teamIdx === 0 ? disabledBtn : activeBtn) }}
      >
        ← Vorig
      </button>

      {/* Midden */}
      <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
        <div
          style={{
            fontSize: 11, fontWeight: 700, fontStyle: "italic",
            color: "rgba(255,255,255,0.65)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 5,
          }}
        >
          {huidig?.naam ?? ""}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
          {teams.map((t, i) => (
            <button
              key={i}
              title={t.naam}
              onClick={() => onKiesTeam(i)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            >
              <Dot active={i === teamIdx} isSelectie={t.soort === "selectie"} />
            </button>
          ))}
        </div>
      </div>

      {/* Volgend */}
      <button
        onClick={onVolgend}
        disabled={teamIdx === teams.length - 1}
        style={{ ...baseBtn, ...(teamIdx === teams.length - 1 ? disabledBtn : activeBtn) }}
      >
        Volgend →
      </button>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/components/NavFooter.tsx
git commit -m "fix(ti-studio): publieke teamindeling — NavFooter glassmorphism + dots animatie"
```

---

## Task 6: TeamKaart component

**Files:**
- Create: `apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx`

- [ ] **Stap 1: Schrijf TeamKaart.tsx**

```tsx
// apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx
"use client";

import type { PubliekTeam, PubliekeSpeler, KennismakingItem } from "@/lib/teamindeling/publieke-presentatie";

function volleNaam(sp: PubliekeSpeler): string {
  return [sp.roepnaam, sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(" ");
}
function alfa(spelers: PubliekeSpeler[]): PubliekeSpeler[] {
  return [...spelers].sort((a, b) => a.roepnaam.localeCompare(b.roepnaam, "nl"));
}

function SpelerLijst({ spelers, geslacht }: { spelers: PubliekeSpeler[]; geslacht: "V" | "M" }) {
  if (spelers.length === 0) return null;
  const label = geslacht === "V" ? "♀ Dames" : "♂ Heren";
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 9, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.14em", color: "#FF6600",
          paddingBottom: 6, marginBottom: 10,
          borderBottom: "1px solid rgba(255,102,0,0.30)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        {label}
        <span style={{ background: "rgba(255,102,0,0.15)", color: "#FF6600", fontSize: 9, padding: "1px 5px", borderRadius: 10 }}>
          {spelers.length}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alfa(spelers).map((sp, i) => (
          <li
            key={i}
            className="pt-speler"
            style={{
              fontSize: 13, fontWeight: 500,
              color: "rgba(255,255,255,0.88)",
              padding: "5px 0",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {volleNaam(sp)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StafPills({ staf }: { staf: PubliekTeam["staf"] }) {
  if (staf.length === 0) return null;
  const rolWeergave = (s: PubliekTeam["staf"][number]) =>
    s.rolLabel?.trim() || (s.rol.trim().toLowerCase() === "trainer" ? "Trainer/Coach" : s.rol);
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,102,0,0.15)", display: "flex", flexWrap: "wrap", gap: 6 }}>
      {staf.map((s, i) => (
        <span
          key={i}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20, padding: "4px 12px",
            fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500,
          }}
        >
          <span style={{ color: "rgba(255,102,0,0.75)", marginRight: 3 }}>{rolWeergave(s)}</span>
          {s.naam}
        </span>
      ))}
    </div>
  );
}

function KennismakingBlok({ item }: { item: KennismakingItem }) {
  return (
    <div
      style={{
        marginTop: 14, paddingTop: 12,
        borderTop: "1px solid rgba(255,102,0,0.15)",
      }}
    >
      <div
        style={{
          fontSize: 9, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.14em", color: "#FF6600", marginBottom: 6,
        }}
      >
        🏐 Kennismakingstraining
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
        <strong style={{ color: "#fff" }}>{item.datum}</strong>
        {" · "}{item.tijd}
        {item.locatie && (
          <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            📍 {item.locatie}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoBanner() {
  return (
    <div
      style={{
        background: "rgba(255,102,0,0.08)",
        border: "1px solid rgba(255,102,0,0.25)",
        borderRadius: 6, padding: "10px 12px", marginTop: 12,
        fontSize: 12, color: "rgba(255,255,255,0.6)",
        display: "flex", gap: 8, alignItems: "flex-start",
      }}
    >
      <span>ℹ️</span>
      <span>Verdeling over teams na selectie tijdens de voorbereiding.</span>
    </div>
  );
}

export function TeamKaart({ team, animKlasse }: { team: PubliekTeam; animKlasse: string }) {
  const isSelectie = team.soort === "selectie";

  return (
    <div
      className={animKlasse}
      style={{
        background: "var(--pt-donker, #0f0f0f)",
        borderRadius: 0,
        marginBottom: 80,
        overflow: "hidden",
      }}
    >
      {/* Oranje diagonale hero */}
      <div
        style={{
          background: "#FF6600",
          padding: "22px 20px 44px",
          clipPath: "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
          position: "relative",
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="pt-hero-shimmer"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        {/* Badge */}
        {isSelectie ? (
          <span
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.25)",
              color: "#fff", fontSize: 9, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.14em",
              padding: "3px 9px", borderRadius: 3, marginBottom: 6,
            }}
          >
            Selectie
          </span>
        ) : null}
        {/* Teamnaam */}
        <h2
          style={{
            margin: 0, fontSize: 30, fontWeight: 900,
            fontStyle: "italic", textTransform: "uppercase",
            color: "#fff", lineHeight: 0.95, letterSpacing: "-0.02em",
          }}
        >
          {team.naam}
        </h2>
        {/* Meta */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 7 }}>
          {team.dames.length > 0 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              {team.dames.length} dames
            </span>
          )}
          {team.dames.length > 0 && team.heren.length > 0 && (
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.4)", display: "inline-block" }} />
          )}
          {team.heren.length > 0 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              {team.heren.length} heren
            </span>
          )}
          {isSelectie && team.uitkomstTeams.length > 0 && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.4)", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                → {team.uitkomstTeams.join(", ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px" }}>
        {/* Normaal team of gebundelde selectie */}
        {(team.soort === "team" || (team.soort === "selectie" && team.gebundeld)) && (
          <>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <SpelerLijst spelers={team.dames} geslacht="V" />
              <SpelerLijst spelers={team.heren} geslacht="M" />
            </div>
            {team.soort === "selectie" && team.gebundeld && <InfoBanner />}
            <StafPills staf={team.staf} />
          </>
        )}

        {/* Gesplitste selectie */}
        {team.soort === "selectie" && !team.gebundeld && (
          <div>
            {team.subteams.map((sub, i) => (
              <div key={i}>
                {i > 0 && <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "16px 0" }} />}
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6600", display: "inline-block" }} />
                  {sub.naam}
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <SpelerLijst spelers={sub.dames} geslacht="V" />
                  <SpelerLijst spelers={sub.heren} geslacht="M" />
                </div>
                {sub.staf.length > 0 && <StafPills staf={sub.staf} />}
              </div>
            ))}
          </div>
        )}

        {/* Kennismakingstraining */}
        {team.kennismakingstraining && (
          <KennismakingBlok item={team.kennismakingstraining} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx
git commit -m "fix(ti-studio): publieke teamindeling — TeamKaart oranje hero + kennismakingstraining"
```

---

## Task 7: ToelichtingPagina component

**Files:**
- Create: `apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx`

- [ ] **Stap 1: Schrijf ToelichtingPagina.tsx**

```tsx
// apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
"use client";

import type { PubliekeTeamindelingData, BelangrijkeDatumItem, KennismakingItem } from "@/lib/teamindeling/publieke-presentatie";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

function SectieKop({ label, titel }: { label: string; titel: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 9, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.14em", color: "#FF6600", marginBottom: 5,
        }}
      >
        <span style={{ display: "inline-block", width: 12, height: 2, background: "#FF6600" }} />
        {label}
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>
        {titel}
      </h2>
    </div>
  );
}

function BelangrijkeDataBlok({ items }: { items: BelangrijkeDatumItem[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <SectieKop label="Planning" titel="Belangrijke data" />
      <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "8px 0",
              borderBottom: i < items.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6600", flexShrink: 0, marginTop: 5 }} />
            <div>
              <span style={{ fontWeight: 700, color: "#111", fontSize: 14 }}>{item.datum}</span>
              <span style={{ fontSize: 14, color: "#444", marginLeft: 8 }}>{item.omschrijving}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KennismakingBlokToelichting({ items }: { items: KennismakingItem[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <SectieKop label="Kennismaking" titel="Kennismakingstrainingen" />
      <div
        style={{
          background: "rgba(255,102,0,0.06)",
          border: "1px solid rgba(255,102,0,0.2)",
          borderRadius: 6, padding: "8px 12px",
          fontSize: 13, color: "#555",
          margin: "10px 0 12px",
        }}
      >
        Alle nieuwe leden zijn welkom bij de kennismakingstraining van hun team.
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              padding: "10px 0",
              borderBottom: i < items.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
          >
            <div style={{ fontWeight: 700, color: "#111", fontSize: 14, marginBottom: 2 }}>
              {item.teamnaam}
            </div>
            <div style={{ fontSize: 13, color: "#555" }}>
              {item.datum} · {item.tijd}
              {item.locatie && <span style={{ color: "#888" }}> · {item.locatie}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToelichtingPagina({
  toelichting,
  onGaNaar,
}: {
  toelichting: PubliekeTeamindelingData["toelichting"];
  onGaNaar: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Hero — wit met oranje accenten */}
      <div
        style={{
          background: "#fff",
          borderLeft: "5px solid #FF6600",
          padding: "40px 24px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Hoek-driehoek */}
        <div
          style={{
            position: "absolute", bottom: -30, right: -30,
            width: 160, height: 160,
            background: "#FF6600",
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            opacity: 0.10,
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Logo + seizoen */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="c.k.v. Oranje Wit 100 jaar"
              style={{ height: 48, width: "auto", display: "block" }}
            />
            {toelichting && (
              <span
                style={{
                  fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#FF6600",
                }}
              >
                {toelichting.seizoenLabel}
              </span>
            )}
          </div>
          {/* Titel */}
          <h1
            style={{
              margin: 0, fontSize: 36, fontWeight: 900, fontStyle: "italic",
              textTransform: "uppercase", color: "#111",
              lineHeight: 0.95, letterSpacing: "-0.02em",
            }}
          >
            Voorlopige<br />
            teamindeling{" "}
            {toelichting && (
              <span style={{ color: "#FF6600" }}>{toelichting.seizoenLabel}</span>
            )}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#888", fontWeight: 500 }}>
            c.k.v. Oranje Wit · Dordrecht
          </p>
        </div>
      </div>

      {/* Inhoud */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 60px" }}>
        {toelichting ? (
          <>
            {/* Voorwoord */}
            <div style={{ marginBottom: 24 }}>
              <SectieKop label="Voorwoord" titel="Beste leden, ouders en betrokkenen" />
              <div
                style={{ fontSize: 15, lineHeight: 1.75, color: "#333", marginTop: 12 }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{ __html: toelichting.introTekst }}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />

            {/* Voorlopige teamindeling banner */}
            <div
              style={{
                background: "rgba(255,102,0,0.06)",
                borderLeft: "3px solid #FF6600",
                padding: "10px 14px", marginBottom: 24,
                fontSize: 13, color: "#555", lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#333" }}>Voorlopige indeling</strong> — Samenstelling kan nog wijzigen
              tijdens de voorbereiding en selectiedagen. De definitieve indeling volgt voor aanvang
              van het seizoen.
            </div>

            {/* TC tekst */}
            <div style={{ marginBottom: 24 }}>
              <SectieKop label="Totstandkoming" titel="Hoe zijn de teams samengesteld?" />
              <div
                style={{ fontSize: 15, lineHeight: 1.75, color: "#333", marginTop: 12 }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{ __html: toelichting.tcTekst }}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />

            {/* Belangrijke data */}
            <BelangrijkeDataBlok items={toelichting.belangrijkeData} />

            {/* Kennismakingstrainingen */}
            <KennismakingBlokToelichting items={toelichting.kennismakingstrainingen} />

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />

            {/* TC ondertekening */}
            <div
              style={{
                borderLeft: "3px solid #FF6600", paddingLeft: 14,
                fontSize: 14, color: "#666", fontStyle: "italic",
                lineHeight: 1.6, marginBottom: 28,
              }}
            >
              Wij wensen alle teams een fantastisch seizoen toe.<br />
              — De Technische Commissie, c.k.v. Oranje Wit
            </div>
          </>
        ) : (
          <p style={{ fontSize: 15, color: "#999", marginBottom: 28 }}>
            De toelichting is nog niet beschikbaar.
          </p>
        )}

        {/* CTA */}
        <button
          onClick={onGaNaar}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#FF6600", color: "#fff",
            border: "none", borderRadius: 6,
            padding: "14px 28px",
            fontSize: 14, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          Bekijk de teamindeling →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
git commit -m "fix(ti-studio): publieke teamindeling — ToelichtingPagina wit+oranje, sectiekoppen, kennismaking"
```

---

## Task 8: PubliekeTeamindeling.tsx herschrijven (orchestrator)

**Files:**
- Modify: `apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx`

- [ ] **Stap 1: Vervang het volledige bestand**

```tsx
/* eslint-disable max-lines -- Publieke teamindeling UI combineert meerdere nauw verwante sub-componenten */
"use client";

import "./publieke-teamindeling.css";
import { useEffect, useRef, useState } from "react";
import type { PubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { NavHeader } from "./components/NavHeader";
import { NavFooter } from "./components/NavFooter";
import { TeamKaart } from "./components/TeamKaart";
import { ToelichtingPagina } from "./components/ToelichtingPagina";
import { ZoekOverlay } from "./components/ZoekOverlay";

type AnimRichting = "next" | "prev" | null;

function animKlasse(richting: AnimRichting): string {
  if (richting === "next") return "pt-slide-next";
  if (richting === "prev") return "pt-slide-prev";
  return "";
}

export function PubliekeTeamindeling({ data }: { data: PubliekeTeamindelingData }) {
  const [pagina, setPagina] = useState<"toelichting" | "indeling">("toelichting");
  const [teamIdx, setTeamIdx] = useState(0);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [animRichting, setAnimRichting] = useState<AnimRichting>(null);

  // Swipe-detectie
  const touchStartX = useRef<number | null>(null);

  const teams = data.teams;
  const huidigTeam = teams[teamIdx];

  function naarTeam(idx: number, richting: AnimRichting) {
    setAnimRichting(richting);
    setTeamIdx(idx);
  }

  function gaVorig() {
    if (teamIdx > 0) naarTeam(teamIdx - 1, "prev");
  }
  function gaVolgend() {
    if (teamIdx < teams.length - 1) naarTeam(teamIdx + 1, "next");
  }

  // Keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (zoekOpen) {
        if (e.key === "Escape") setZoekOpen(false);
        return;
      }
      if (e.ctrlKey && e.key === "k") { e.preventDefault(); setZoekOpen(true); return; }
      if (pagina !== "indeling") return;
      if (e.key === "ArrowRight") gaVolgend();
      if (e.key === "ArrowLeft") gaVorig();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, teamIdx, teams.length, zoekOpen]);

  // Swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) gaVolgend();
      else gaVorig();
    }
    touchStartX.current = null;
  }

  if (pagina === "toelichting") {
    return (
      <>
        <ToelichtingPagina
          toelichting={data.toelichting}
          onGaNaar={() => setPagina("indeling")}
        />
        {zoekOpen && (
          <ZoekOverlay
            teams={teams}
            onSluit={() => setZoekOpen(false)}
            onKiesTeam={(idx) => { naarTeam(idx, null); setPagina("indeling"); }}
          />
        )}
      </>
    );
  }

  const voortgang = teams.length > 0 ? ((teamIdx + 1) / teams.length) * 100 : 0;

  return (
    <div
      className="pt-root"
      style={{ minHeight: "100vh", background: "#080808" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 3, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            height: "100%",
            width: `${voortgang}%`,
            background: "linear-gradient(90deg, #FF6600, #ff8833)",
            boxShadow: "0 0 10px rgba(255,102,0,0.3)",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Sticky header */}
      <NavHeader
        seizoenLabel={data.toelichting?.seizoenLabel ?? null}
        onZoek={() => setZoekOpen(true)}
        onToelichting={() => setPagina("toelichting")}
      />

      {/* Team kaart */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 0" }}>
        {huidigTeam ? (
          <TeamKaart
            key={teamIdx}
            team={huidigTeam}
            animKlasse={animKlasse(animRichting)}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            Geen teams beschikbaar
          </div>
        )}
      </div>

      {/* Footer nav */}
      <NavFooter
        teams={teams}
        teamIdx={teamIdx}
        onVorig={gaVorig}
        onVolgend={gaVolgend}
        onKiesTeam={(idx) => naarTeam(idx, idx > teamIdx ? "next" : "prev")}
      />

      {/* Zoekoverlay */}
      {zoekOpen && (
        <ZoekOverlay
          teams={teams}
          onSluit={() => setZoekOpen(false)}
          onKiesTeam={(idx) => { naarTeam(idx, null); setZoekOpen(false); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Stap 2: Typecheck + build**
```bash
cd apps/ti-studio && pnpm exec tsc --noEmit 2>&1 | head -40
```
Verwacht: geen fouten.

- [ ] **Stap 3: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx
git commit -m "fix(ti-studio): publieke teamindeling — orchestrator met animaties + swipe"
```

---

## Task 9: Responsive desktop verbetering

**Files:**
- Modify: `apps/ti-studio/src/app/teamindeling/publieke-teamindeling.css`
- Modify: `apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx`

Op desktop (≥640px) willen we: bredere padding, grotere teamnaam in hero (48px), spelersnamen iets groter, max-width gecentreerd.

- [ ] **Stap 1: Voeg media queries toe aan het CSS-bestand**

Voeg toe aan het einde van `publieke-teamindeling.css`:

```css
/* ── Responsive desktop ── */
@media (min-width: 640px) {
  .pt-hero-naam { font-size: 48px !important; }
  .pt-hero-pad  { padding: 28px 32px 60px !important; }
  .pt-body-pad  { padding: 24px 32px 100px !important; }
  .pt-speler    { font-size: 14px !important; padding: 6px 0 !important; }

  .pt-toel-titel { font-size: 48px !important; }
  .pt-toel-hero  { padding: 52px 40px 40px !important; }
  .pt-toel-body  { padding: 32px 40px 60px !important; }
  .pt-toel-tekst { font-size: 15px !important; }
  .pt-sectie-titel { font-size: 22px !important; }
}
```

- [ ] **Stap 2: Voeg CSS klassen toe aan de hero-elementen in TeamKaart.tsx**

Zoek de `<h2>` met de teamnaam en voeg `className="pt-hero-naam"` toe:
```tsx
<h2
  className="pt-hero-naam"
  style={{ ... /* bestaande styles */ }}
>
```

Voeg `className="pt-hero-pad"` toe aan de hero-`<div>`:
```tsx
<div
  className="pt-hero-pad"
  style={{ background: "#FF6600", padding: "22px 20px 44px", ... }}
>
```

Voeg `className="pt-body-pad"` toe aan de body-`<div>`:
```tsx
<div className="pt-body-pad" style={{ padding: "18px 20px" }}>
```

- [ ] **Stap 3: Voeg CSS klassen toe aan ToelichtingPagina.tsx**

`pt-toel-titel` op de `<h1>`, `pt-toel-hero` op het hero-blok, `pt-toel-body` op het inhoud-blok, `pt-toel-tekst` op de tekst-divs, `pt-sectie-titel` op de `<h2>` in `SectieKop`.

- [ ] **Stap 4: Typecheck + build**
```bash
cd apps/ti-studio && pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Stap 5: Commit**
```bash
git add apps/ti-studio/src/app/teamindeling/publieke-teamindeling.css
git add apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx
git add apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
git commit -m "fix(ti-studio): publieke teamindeling — responsive desktop breakpoints"
```

---

## Task 10: Visuele verificatie + push

- [ ] **Stap 1: Start dev server**
```bash
cd apps/ti-studio && pnpm dev
```
Open `http://localhost:3001/teamindeling` (of de geconfigureerde poort).

- [ ] **Stap 2: Controleer checklist**
  - [ ] Toelichting pagina: wit achtergrond, oranje streep links, OW logo zichtbaar
  - [ ] Toelichting pagina: sectiekoppen "Voorwoord", "Totstandkoming" aanwezig
  - [ ] Toelichting pagina: "Voorlopige indeling" banner zichtbaar
  - [ ] Team kaart: oranje diagonale hero, teamnaam bold italic uppercase
  - [ ] Team kaart: donkere body, spelersnamen met stagger fade-in
  - [ ] Team kaart: Zoek naam knop en Toelichting knop **identieke stijl**
  - [ ] Footer: oranje prev/next knoppen, dots animeren bij wisselen
  - [ ] Geen geel (#eab308) zichtbaar — alles oranje (#FF6600) of wit
  - [ ] ← → keys wisselen teams
  - [ ] Ctrl+K opent zoekoverlay
  - [ ] Swipe links/rechts werkt op mobiel
  - [ ] Progress bar vult zich bij wisselen

- [ ] **Stap 3: Push naar main**
```bash
git push origin main
```

---

## Self-review

**Spec coverage:**
- ✅ Kleurenpalet: geen geel, alleen oranje+wit+donker (Task 1)
- ✅ ToelichtingPagina: wit+oranje, sectiekoppen, toelichting-teksten (Task 7)
- ✅ Voorlopige teamindeling banner in toelichting (Task 7)
- ✅ Seizoen 2026–2027 in UI-teksten (Task 7, 8)
- ✅ BelangrijkeData blok in toelichting (Task 7)
- ✅ KennismakingItem type + toelichting blok (Task 2, 7)
- ✅ Kennismakingstraining op teamkaart zelf (Task 6)
- ✅ Oranje diagonale hero, bold italic teamnaam (Task 6)
- ✅ Glassmorphism sticky header, identieke knoppen (Task 4)
- ✅ Glassmorphism footer nav, dots met glow (Task 5)
- ✅ Slide animatie bij teamwissel (Task 1, 8)
- ✅ Stagger fade-in spelersnamen (Task 1, 6)
- ✅ Shimmer hero (Task 1, 6)
- ✅ Progress bar met glow (Task 8)
- ✅ Zoekoverlay dark stijl (Task 3)
- ✅ Ctrl+K shortcut (Task 8)
- ✅ Swipe mobiel (Task 8)
- ✅ Responsive desktop (Task 9)

**Type consistency:** `KennismakingItem` en `BelangrijkeDatumItem` gedefinieerd in Task 2, gebruikt in Task 6 en 7. `animKlasse` string doorgegeven aan `TeamKaart` als `animKlasse` prop — consistent.
