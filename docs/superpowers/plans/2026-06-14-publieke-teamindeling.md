# Publieke Teamindeling Weergave — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Design spec:** `docs/superpowers/specs/2026-06-14-publieke-teamindeling-design.md` — lees dit EERST.
>
> **Prototype:** `/tmp/brainstorm/content/prototype-v3.html` — referentie voor de UI.

**Goal:** Een publiek toegankelijke pagina op `/teamindeling` in `apps/ti-studio` die de actieve teamindeling toont zonder inlog.

**Architecture:** De bestaande `getTeamsVoorPresentatie()` heeft een `requireTC()` guard. We extraheren de data-laag naar een auth-loze lib-functie `getPubliekeTeamindelingData()` die direct Prisma gebruikt. Een nieuwe server component op `/teamindeling` roept deze lib aan en geeft data door aan een client component voor de interactieve UI (toelichting-pagina + team-per-team navigatie).

**Tech Stack:** Next.js 16 server/client components, Prisma (via `@/lib/teamindeling/db/prisma`), `@oranje-wit/types`, inline CSS (geen Tailwind in dit component — consistent met prototype).

---

## Bestandsstructuur

| Actie | Bestand | Verantwoordelijkheid |
|---|---|---|
| Aanmaken | `apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts` | Data-fetch zonder auth — herbruikbaar voor publieke route |
| Aanmaken | `apps/ti-studio/src/app/teamindeling/page.tsx` | Server component — haalt data op, geeft door aan client |
| Aanmaken | `apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx` | Client component — toelichting + team-navigatie UI |

---

## Task 1: Publieke data-lib

**Files:**
- Aanmaken: `apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts`

- [ ] **Stap 1: Maak de lib-file aan**

```typescript
// apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts
import { prisma } from "@/lib/teamindeling/db/prisma";
import { korfbalPeildatum, berekenKorfbalLeeftijd, type Seizoen } from "@oranje-wit/types";
import { effectieveSpelerStatus } from "@/lib/teamindeling/speler-status";

// ── Types ────────────────────────────────────────────────────────────────────

export type PubliekeSpeler = {
  roepnaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
  geslacht: "V" | "M";
};

export type PubliekeStaf = {
  naam: string;
  rol: string;
};

export type PubliekTeam = {
  id: string;
  naam: string;
  volgorde: number;
  soort: "team" | "selectie";
  gebundeld: boolean;
  dames: PubliekeSpeler[];
  heren: PubliekeSpeler[];
  /** Alleen gevuld als soort=selectie en gebundeld=false */
  subteams: { naam: string; dames: PubliekeSpeler[]; heren: PubliekeSpeler[]; staf: PubliekeStaf[] }[];
  /** Teamnamen die uit deze selectie-pool voortkomen (gebundeld=true) */
  uitkomstTeams: string[];
  staf: PubliekeStaf[];
};

export type PubliekeToelichtingData = {
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  tcTekst: string;
};

export type PubliekeTeamindelingData = {
  toelichting: PubliekeToelichtingData | null;
  teams: PubliekTeam[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const KLEUR_MAP: Record<string, string> = {
  PAARS: "blauw", BLAUW: "blauw", GROEN: "groen",
  GEEL: "geel", ORANJE: "oranje", ROOD: "rood",
};

function bouwSpeler(r: {
  roepnaam: string;
  achternaam: string;
  geslacht: string;
  tussenvoegsel?: string | null;
}): PubliekeSpeler {
  return {
    roepnaam: r.roepnaam,
    achternaam: r.achternaam,
    tussenvoegsel: r.tussenvoegsel ?? null,
    geslacht: r.geslacht === "V" ? "V" : "M",
  };
}

// ── Hoofdfunctie ─────────────────────────────────────────────────────────────

export async function getPubliekeTeamindelingData(): Promise<PubliekeTeamindelingData> {
  // 1. Actieve kaders vinden (meest recente werkindeling)
  const werkindeling = await prisma.werkindeling.findFirst({
    orderBy: { aangemaaktop: "desc" },
    select: {
      id: true,
      kaders: { select: { id: true, seizoen: true } },
    },
  });

  if (!werkindeling) return { toelichting: null, teams: [] };

  const kadersId = werkindeling.kaders.id;
  const seizoen = werkindeling.kaders.seizoen as Seizoen;

  // 2. Toelichting ophalen
  const publicatie = await prisma.teamindelingPublicatie.findUnique({
    where: { kadersId },
    select: { titel: true, seizoenLabel: true, introTekst: true, tcTekst: true },
  });

  const toelichting: PubliekeToelichtingData | null = publicatie
    ? {
        titel: publicatie.titel,
        seizoenLabel: publicatie.seizoenLabel,
        introTekst: publicatie.introTekst,
        tcTekst: publicatie.tcTekst,
      }
    : null;

  // 3. Actieve versie ophalen (eerste versie van de werkindeling)
  const versie = await prisma.versie.findFirst({
    where: { werkindelingId: werkindeling.id },
    orderBy: { nummer: "asc" },
    select: {
      id: true,
      teams: {
        select: {
          id: true,
          naam: true,
          volgorde: true,
          selectieGroepId: true,
          spelers: {
            select: {
              speler: {
                select: {
                  roepnaam: true,
                  achternaam: true,
                  geslacht: true,
                  lid: { select: { tussenvoegsel: true } },
                },
              },
            },
          },
          staf: {
            select: {
              rol: true,
              staf: { select: { naam: true } },
            },
          },
        },
      },
      selectieGroepen: {
        select: {
          id: true,
          naam: true,
          gebundeld: true,
          spelers: {
            select: {
              speler: {
                select: {
                  roepnaam: true,
                  achternaam: true,
                  geslacht: true,
                  lid: { select: { tussenvoegsel: true } },
                },
              },
            },
          },
          staf: {
            select: {
              rol: true,
              staf: { select: { naam: true } },
            },
          },
        },
      },
    },
  });

  if (!versie) return { toelichting, teams: [] };

  // 4. Teams opbouwen
  const selectieTeamIds = new Set(versie.teams.filter((t) => t.selectieGroepId).map((t) => t.id));
  const teamsPerSg = new Map<string, typeof versie.teams[number][]>();
  for (const t of versie.teams) {
    if (!t.selectieGroepId) continue;
    const arr = teamsPerSg.get(t.selectieGroepId) ?? [];
    arr.push(t);
    teamsPerSg.set(t.selectieGroepId, arr);
  }

  const kaarten: PubliekTeam[] = [];

  // Losse teams
  for (const team of versie.teams) {
    if (selectieTeamIds.has(team.id)) continue;
    const dames: PubliekeSpeler[] = [];
    const heren: PubliekeSpeler[] = [];
    for (const ts of team.spelers) {
      if (!ts.speler) continue;
      const sp = bouwSpeler({
        roepnaam: ts.speler.roepnaam,
        achternaam: ts.speler.achternaam,
        geslacht: ts.speler.geslacht,
        tussenvoegsel: ts.speler.lid?.tussenvoegsel,
      });
      if (ts.speler.geslacht === "V") dames.push(sp); else heren.push(sp);
    }
    kaarten.push({
      id: team.id,
      naam: team.naam ?? "",
      volgorde: team.volgorde ?? 0,
      soort: "team",
      gebundeld: false,
      dames,
      heren,
      subteams: [],
      uitkomstTeams: [],
      staf: team.staf.map((s) => ({ naam: s.staf?.naam ?? "", rol: s.rol ?? "" })),
    });
  }

  // Selectie-groepen
  for (const sg of versie.selectieGroepen) {
    const groepTeams = teamsPerSg.get(sg.id) ?? [];
    const minVolgorde = groepTeams.reduce((m, t) => Math.min(m, t.volgorde ?? 999), 999);
    const groepNaam =
      (typeof sg.naam === "string" && sg.naam.trim()) ||
      groepTeams.map((t) => t.naam).join(" / ") ||
      "Selectie";

    if (sg.gebundeld) {
      const dames: PubliekeSpeler[] = [];
      const heren: PubliekeSpeler[] = [];
      for (const ss of sg.spelers) {
        if (!ss.speler) continue;
        const sp = bouwSpeler({
          roepnaam: ss.speler.roepnaam,
          achternaam: ss.speler.achternaam,
          geslacht: ss.speler.geslacht,
          tussenvoegsel: ss.speler.lid?.tussenvoegsel,
        });
        if (ss.speler.geslacht === "V") dames.push(sp); else heren.push(sp);
      }
      kaarten.push({
        id: sg.id,
        naam: groepNaam,
        volgorde: minVolgorde,
        soort: "selectie",
        gebundeld: true,
        dames,
        heren,
        subteams: [],
        uitkomstTeams: groepTeams.map((t) => t.naam ?? ""),
        staf: sg.staf.map((s) => ({ naam: s.staf?.naam ?? "", rol: s.rol ?? "" })),
      });
    } else {
      const subteams = groepTeams.map((t) => {
        const d: PubliekeSpeler[] = [];
        const h: PubliekeSpeler[] = [];
        for (const ts of t.spelers) {
          if (!ts.speler) continue;
          const sp = bouwSpeler({
            roepnaam: ts.speler.roepnaam,
            achternaam: ts.speler.achternaam,
            geslacht: ts.speler.geslacht,
            tussenvoegsel: ts.speler.lid?.tussenvoegsel,
          });
          if (ts.speler.geslacht === "V") d.push(sp); else h.push(sp);
        }
        return {
          naam: t.naam ?? "",
          dames: d,
          heren: h,
          staf: t.staf.map((s) => ({ naam: s.staf?.naam ?? "", rol: s.rol ?? "" })),
        };
      });
      kaarten.push({
        id: sg.id,
        naam: groepNaam,
        volgorde: minVolgorde,
        soort: "selectie",
        gebundeld: false,
        dames: subteams.flatMap((s) => s.dames),
        heren: subteams.flatMap((s) => s.heren),
        subteams,
        uitkomstTeams: [],
        staf: [],
      });
    }
  }

  kaarten.sort((a, b) => a.volgorde - b.volgorde);
  return { toelichting, teams: kaarten };
}
```

- [ ] **Stap 2: Controleer of `prisma.versie` en `prisma.werkindeling` de verwachte veldnamen hebben**

```bash
grep -n "model Versie\|model Werkindeling\|aangemaaktop\|nummer\|selectieGroepen\|werkindelingId" packages/database/prisma/schema.prisma | head -40
```

Pas veldnamen in de lib aan als ze afwijken van de schema-output.

- [ ] **Stap 3: Controleer of `speler.lid` een relatie is of dat `tussenvoegsel` direct op het speler-model staat**

```bash
grep -n "tussenvoegsel\|model Speler" packages/database/prisma/schema.prisma | head -20
```

Als `tussenvoegsel` direct op `Speler` staat (niet via `lid`), pas de query aan:
```typescript
// In de spelers-select: vervang lid: { select: { tussenvoegsel: true } }
// door: tussenvoegsel: true
// En in bouwSpeler: tussenvoegsel: ts.speler.tussenvoegsel
```

- [ ] **Stap 4: Commit**

```bash
git add apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts
git commit -m "feat(ti-studio): publieke data-lib zonder auth guard"
```

---

## Task 2: Client component `PubliekeTeamindeling`

**Files:**
- Aanmaken: `apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx`

- [ ] **Stap 1: Maak het client component aan**

```tsx
// apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { PubliekeTeamindelingData, PubliekTeam, PubliekeSpeler, PubliekeStaf } from "@/lib/teamindeling/publieke-presentatie";

// ── Helpers ──────────────────────────────────────────────────────────────────

function volleNaam(sp: PubliekeSpeler): string {
  return [sp.roepnaam, sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(" ");
}

function alfa(spelers: PubliekeSpeler[]): PubliekeSpeler[] {
  return [...spelers].sort((a, b) =>
    a.roepnaam.localeCompare(b.roepnaam, "nl")
  );
}

// ── Sub-componenten ──────────────────────────────────────────────────────────

function SpelerLijst({ spelers }: { spelers: PubliekeSpeler[] }) {
  return (
    <div>
      {alfa(spelers).map((sp, i) => (
        <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14, color: "#1f2937" }}>
          {volleNaam(sp)}
        </div>
      ))}
    </div>
  );
}

function StafGrid({ staf }: { staf: PubliekeStaf[] }) {
  if (!staf.length) return null;
  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#9ca3af", marginBottom: 10 }}>
        Staf
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {staf.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
            <span style={{ color: "#6b7280", fontSize: 11 }}>{s.rol}</span>
            <span style={{ color: "#9ca3af" }}>·</span>
            <span style={{ color: "#1f2937", fontWeight: 600 }}>{s.naam}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KolomHeader({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#ff6600", marginBottom: 10, paddingBottom: 8, borderBottom: "1.5px solid #e5e7eb" }}>
      {label}
    </div>
  );
}

function PoolBanner({ tekst }: { tekst: string }) {
  return (
    <div style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 10, fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}
      dangerouslySetInnerHTML={{ __html: "ℹ️ &nbsp;" + tekst }}
    />
  );
}

// ── Kaart-inhoud per soort ────────────────────────────────────────────────────

function GewoonTeam({ team }: { team: PubliekTeam }) {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <KolomHeader label="♀ Dames" />
          <SpelerLijst spelers={team.dames} />
        </div>
        <div>
          <KolomHeader label="♂ Heren" />
          <SpelerLijst spelers={team.heren} />
        </div>
      </div>
      <StafGrid staf={team.staf} />
    </div>
  );
}

function SelectieCombineerd({ team }: { team: PubliekTeam }) {
  const uitlegTekst = `Uit deze gezamenlijke spelersgroep worden na de start van het seizoen ${
    team.uitkomstTeams.length > 1
      ? "de teams <strong>" + team.uitkomstTeams.join("</strong> en <strong>") + "</strong> gevormd."
      : "één team gevormd."
  }`;
  return (
    <div style={{ padding: "24px 28px" }}>
      <PoolBanner tekst={uitlegTekst} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <KolomHeader label="♀ Dames" />
          <SpelerLijst spelers={team.dames} />
        </div>
        <div>
          <KolomHeader label="♂ Heren" />
          <SpelerLijst spelers={team.heren} />
        </div>
      </div>
      <StafGrid staf={team.staf} />
    </div>
  );
}

function SelectieGesplitst({ team }: { team: PubliekTeam }) {
  const subNamen = team.subteams.map((s) => `<strong>${s.naam}</strong>`).join(" en ");
  const uitleg = `De spelers zijn voorlopig verdeeld over ${subNamen}. De definitieve samenstelling volgt na de eerste trainingen.`;
  return (
    <div style={{ padding: "24px 28px" }}>
      <PoolBanner tekst={uitleg} />
      {team.subteams.map((sub, i) => (
        <div key={i} style={i > 0 ? { marginTop: 24, paddingTop: 24, borderTop: "1.5px solid #e5e7eb" } : {}}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff6600", flexShrink: 0 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{sub.naam}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>{sub.dames.length + sub.heren.length} spelers</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <KolomHeader label="♀ Dames" />
              <SpelerLijst spelers={sub.dames} />
            </div>
            <div>
              <KolomHeader label="♂ Heren" />
              <SpelerLijst spelers={sub.heren} />
            </div>
          </div>
          <StafGrid staf={sub.staf} />
        </div>
      ))}
    </div>
  );
}

// ── Teamkaart header ──────────────────────────────────────────────────────────

function KaartHeader({ team }: { team: PubliekTeam }) {
  const isSelectie = team.soort === "selectie";
  const accentKleur = isSelectie ? "#eab308" : "#ff6600";
  return (
    <div style={{
      background: "linear-gradient(135deg, #111827 0%, #1a0e00 100%)",
      padding: "24px 28px 20px",
      borderBottom: `3px solid ${accentKleur}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: -20, top: -20, width: 130, height: 130, background: `radial-gradient(circle, ${isSelectie ? "rgba(234,179,8,0.15)" : "rgba(255,102,0,0.15)"} 0%, transparent 70%)`, borderRadius: "50%" }} />
      {isSelectie && (
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#eab308", marginBottom: 6 }}>
          Selectie
        </div>
      )}
      <div style={{ fontSize: 26, fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: -0.3 }}>
        {team.naam}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {isSelectie && team.uitkomstTeams.map((u) => (
          <span key={u} style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fde047", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
            → {u}
          </span>
        ))}
        {isSelectie && team.subteams.map((s) => (
          <span key={s.naam} style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fde047", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
            → {s.naam}
          </span>
        ))}
        {!isSelectie && (
          <>
            <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
              ♀ {team.dames.length} dames
            </span>
            <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
              ♂ {team.heren.length} heren
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Zoekoverlay ───────────────────────────────────────────────────────────────

function ZoekOverlay({
  teams,
  open,
  onSluit,
  onSelecteer,
}: {
  teams: PubliekTeam[];
  open: boolean;
  onSluit: () => void;
  onSelecteer: (idx: number) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  type Resultaat = { naam: string; label: string; idx: number; isSel: boolean };
  const resultaten: Resultaat[] = [];
  if (query.length >= 2) {
    const lower = query.toLowerCase();
    teams.forEach((t, ti) => {
      const bronnen =
        t.soort === "selectie" && !t.gebundeld
          ? t.subteams.flatMap((s) =>
              [...s.dames, ...s.heren].map((sp) => ({ sp, label: `${t.naam} → ${s.naam}` }))
            )
          : [...t.dames, ...t.heren].map((sp) => ({ sp, label: t.naam }));

      bronnen.forEach(({ sp, label }) => {
        if (volleNaam(sp).toLowerCase().includes(lower)) {
          resultaten.push({ naam: volleNaam(sp), label, idx: ti, isSel: t.soort === "selectie" });
        }
      });
    });
  }

  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onSluit(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}
    >
      <div style={{ background: "white", borderRadius: 16, width: "90%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: 10, alignItems: "center" }}>
          <span>🔍</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op naam..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 16, color: "#111827" }}
          />
          <button onClick={onSluit} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {query.length < 2 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#6b7280", fontSize: 14 }}>Begin met typen om te zoeken...</div>
          ) : resultaten.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#6b7280", fontSize: 14 }}>Geen spelers gevonden</div>
          ) : (
            resultaten.map((r, i) => (
              <div
                key={i}
                onClick={() => { onSelecteer(r.idx); onSluit(); }}
                style={{ padding: "10px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f3f4f6" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#fff7f0")}
                onMouseOut={(e) => (e.currentTarget.style.background = "")}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.isSel ? "#eab308" : "#ff6600", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.naam}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{r.label}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Hoofd-component ───────────────────────────────────────────────────────────

export function PubliekeTeamindeling({ data }: { data: PubliekeTeamindelingData }) {
  const { teams, toelichting } = data;
  const [pagina, setPagina] = useState<"toelichting" | "indeling">("toelichting");
  const [huidigIdx, setHuidigIdx] = useState(0);
  const [zoekOpen, setZoekOpen] = useState(false);

  const navigeer = useCallback((richting: number) => {
    setHuidigIdx((i) => Math.max(0, Math.min(teams.length - 1, i + richting)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [teams.length]);

  useEffect(() => {
    if (pagina !== "indeling") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigeer(1);
      if (e.key === "ArrowLeft") navigeer(-1);
      if (e.key === "Escape") setZoekOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setZoekOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pagina, navigeer]);

  const team = teams[huidigIdx];
  const voortgang = teams.length > 0 ? ((huidigIdx + 1) / teams.length) * 100 : 0;
  const seizoenLabel = toelichting?.seizoenLabel ?? "2026–2027";

  return (
    <>
      {/* HEADER */}
      <header style={{
        background: "white", borderBottom: "3px solid #ff6600",
        padding: "0 24px", display: "flex", alignItems: "center", gap: 14,
        height: 68, position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp"
          alt="c.k.v. Oranje Wit 100 jaar"
          style={{ height: 44, width: "auto", display: "block" }}
        />
        <div style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
            Teamindeling {seizoenLabel}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>c.k.v. Oranje Wit · Dordrecht</div>
        </div>
        {pagina === "indeling" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => { setPagina("toelichting"); window.scrollTo({ top: 0 }); }}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}
            >
              📄 <span>Toelichting</span>
            </button>
            <button
              onClick={() => setZoekOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}
            >
              🔍 <span>Zoek naam</span>
            </button>
          </div>
        )}
      </header>

      {/* TOELICHTING PAGINA */}
      {pagina === "toelichting" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div style={{ background: "white", borderRadius: 20, maxWidth: 680, width: "100%", border: "1px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #111827 0%, #1a0e00 100%)", padding: "36px 40px 28px", borderBottom: "3px solid #ff6600", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -30, bottom: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(255,102,0,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#ff6600", marginBottom: 10 }}>
                Seizoen {seizoenLabel} · 100 jaar c.k.v. Oranje Wit
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: -0.5 }}>
                Teamindeling<br />
                <span style={{ color: "#ff8533" }}>{seizoenLabel}</span>
              </div>
            </div>
            <div style={{ padding: "32px 40px" }}>
              {toelichting ? (
                <div style={{ fontSize: 15, lineHeight: 1.75, color: "#1f2937" }}
                  dangerouslySetInnerHTML={{ __html: toelichting.introTekst + (toelichting.tcTekst ? "<br/><br/>" + toelichting.tcTekst : "") }}
                />
              ) : (
                <div style={{ fontSize: 15, lineHeight: 1.75, color: "#1f2937" }}>
                  <p>Beste leden, ouders en begeleiders,</p>
                  <p style={{ marginTop: 14 }}>Van harte welkom bij de teamindeling voor het seizoen {seizoenLabel}.</p>
                  <p style={{ marginTop: 14 }}>Heb je vragen? Mail naar <strong>tc@ckvoranjewit.nl</strong>.</p>
                </div>
              )}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>
                — De Technische Commissie, c.k.v. Oranje Wit
              </div>
            </div>
            <div style={{ padding: "20px 40px 32px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => { setPagina("indeling"); window.scrollTo({ top: 0 }); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ff6600", color: "white", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(255,102,0,0.3)" }}
              >
                Ga naar de teamindeling →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAMINDELING PAGINA */}
      {pagina === "indeling" && team && (
        <>
          {/* Voortgangsbalk */}
          <div style={{ background: "#e5e7eb", height: 3 }}>
            <div style={{ height: "100%", background: "#ff6600", width: `${voortgang}%`, transition: "width 0.3s ease", borderRadius: "0 2px 2px 0" }} />
          </div>

          {/* Teamkaart */}
          <main style={{ flex: 1, padding: "32px 24px 120px", maxWidth: 940, margin: "0 auto", width: "100%" }}>
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <KaartHeader team={team} />
              {team.soort === "team" && <GewoonTeam team={team} />}
              {team.soort === "selectie" && team.gebundeld && <SelectieCombineerd team={team} />}
              {team.soort === "selectie" && !team.gebundeld && <SelectieGesplitst team={team} />}
            </div>
          </main>

          {/* Vaste navigatie footer */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
            background: "white", borderTop: "1px solid #e5e7eb",
            boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", maxWidth: 940, margin: "0 auto" }}>
              <button
                onClick={() => navigeer(-1)}
                disabled={huidigIdx === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: huidigIdx === 0 ? "not-allowed" : "pointer", border: "none", background: huidigIdx === 0 ? "#e5e7eb" : "#ff6600", color: huidigIdx === 0 ? "#9ca3af" : "white" }}
              >
                ← Vorig
              </button>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{huidigIdx + 1} / {teams.length}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{team.naam}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6, flexWrap: "wrap", maxWidth: 180 }}>
                  {teams.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setHuidigIdx(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      title={t.naam}
                      style={{ width: 7, height: 7, borderRadius: "50%", border: "none", cursor: "pointer", background: i === huidigIdx ? (t.soort === "selectie" ? "#eab308" : "#ff6600") : (t.soort === "selectie" ? "rgba(234,179,8,0.4)" : "#e5e7eb"), transform: i === huidigIdx ? "scale(1.3)" : "scale(1)", transition: "all 0.15s", flexShrink: 0 }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigeer(1)}
                disabled={huidigIdx === teams.length - 1}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: huidigIdx === teams.length - 1 ? "not-allowed" : "pointer", border: "none", background: huidigIdx === teams.length - 1 ? "#e5e7eb" : "#ff6600", color: huidigIdx === teams.length - 1 ? "#9ca3af" : "white" }}
              >
                Volgend →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ZOEKOVERLAY */}
      <ZoekOverlay
        teams={teams}
        open={zoekOpen}
        onSluit={() => setZoekOpen(false)}
        onSelecteer={(idx) => { setHuidigIdx(idx); setPagina("indeling"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />
    </>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx
git commit -m "feat(ti-studio): publieke teamindeling client component"
```

---

## Task 3: Server component (publieke route)

**Files:**
- Aanmaken: `apps/ti-studio/src/app/teamindeling/page.tsx`

- [ ] **Stap 1: Maak de server component aan**

```tsx
// apps/ti-studio/src/app/teamindeling/page.tsx
import type { Metadata } from "next";
import { getPubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { PubliekeTeamindeling } from "./PubliekeTeamindeling";

export const metadata: Metadata = {
  title: "Teamindeling — c.k.v. Oranje Wit",
  description: "De officiële teamindeling van c.k.v. Oranje Wit",
};

export default async function PubliekeTeamindelingPage() {
  const data = await getPubliekeTeamindelingData();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#111827" }}>
      <PubliekeTeamindeling data={data} />
      <footer style={{ background: "#111827", color: "#9ca3af", textAlign: "center", padding: "16px 24px", fontSize: 12 }}>
        <strong style={{ color: "white" }}>c.k.v. Oranje Wit</strong> · Dordrecht ·{" "}
        Vragen? <strong style={{ color: "white" }}>tc@ckvoranjewit.nl</strong>
      </footer>
    </div>
  );
}
```

- [ ] **Stap 2: Controleer of de app een root layout heeft die de html/body tag bevat**

```bash
cat apps/ti-studio/src/app/layout.tsx
```

De `page.tsx` geeft alleen een `<div>` terug — de `<html>` en `<body>` zitten in `layout.tsx`. Als `layout.tsx` zelf een `<body>` heeft met dark-mode classes, controleer dan of die de lichte achtergrond van de publieke pagina niet overschrijven. Zo ja, voeg een `teamindeling` specifieke layout toe:

```tsx
// apps/ti-studio/src/app/teamindeling/layout.tsx  (alleen aanmaken als nodig)
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Stap 3: Commit**

```bash
git add apps/ti-studio/src/app/teamindeling/
git commit -m "feat(ti-studio): publieke teamindeling route zonder auth"
```

---

## Task 4: Typecheck & bouw verifiëren

- [ ] **Stap 1: Typecheck**

```bash
cd apps/ti-studio && pnpm exec tsc --noEmit
```

Los typefouten op. Meest voorkomende issues:
- Prisma-model veldnamen wijken af (zie Task 1 stap 2-3)
- `speler.lid` bestaat niet als relatie → gebruik `tussenvoegsel` direct op speler

- [ ] **Stap 2: Dev server starten en pagina controleren**

```bash
pnpm dev
```

Open `http://localhost:3000/teamindeling` (geen inlog). Controleer:
- Toelichting-pagina laadt met het 100-jaar logo
- Knop "Ga naar de teamindeling →" werkt
- Teams worden getoond in de juiste volgorde
- Selecties (gecombineerd en gesplitst) worden correct weergegeven
- Zoekfunctie vindt spelers
- Vaste nav-footer staat onderaan
- "Toelichting"-knop brengt terug naar de eerste pagina

- [ ] **Stap 3: Mobiel controleren (verklein browser naar ~375px breedte)**

Controleer:
- Spelers-grid wordt één kolom
- Nav-footer knoppen zijn goed bereikbaar
- Header logo + titels kloppen

- [ ] **Stap 4: Commit na succesvolle verifikatie**

```bash
git add -p
git commit -m "fix(ti-studio): typecheck en layout correcties publieke teamindeling"
```

---

## Task 5: Deploy

- [ ] **Stap 1: Push naar main**

```bash
git push origin main
```

- [ ] **Stap 2: Wacht op Railway deploy en verifieer op productie**

Controleer `https://teamindeling.ckvoranjewit.app/teamindeling` — geen inlog vereist.

---

## Aandachtspunten voor agents

- **Geen `requireTC()` in de publieke lib** — die route is bewust zonder auth
- **Volgorde** komt uit `team.volgorde` — niet zelf sorteren op naam of categorie
- **Spelersnamen** alleen roepnaam + tussenvoegsel + achternaam, geen status of badge
- **De bestaande `actions.ts`** in `(protected)/presentatie/` blijft onaangeroerd
- **Logo-URL** is extern (ckvoranjewit.nl) — geen lokale kopie nodig voor nu
