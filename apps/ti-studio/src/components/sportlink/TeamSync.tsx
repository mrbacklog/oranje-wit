"use client";

import { useState } from "react";

import { useSportlinkCredentials } from "./SportlinkAuth";

type Stap = "scope" | "bezig" | "resultaat" | "apply" | "klaar";
type Spelvorm = "Veld" | "Zaal";
type Periode = "veld_najaar" | "veld_voorjaar" | "zaal" | "zaal_deel1" | "zaal_deel2";

interface WijzigingRegel {
  relCode: string;
  naam: string;
  vanTeam: string | null;
  naarTeam: string | null;
  rol: string | null;
  functie: string | null;
}

interface TeamSamenvatting {
  teamCode: string;
  teamNaam: string;
  aantalSpelers: number;
  aantalStaf: number;
}

interface DryRunResultaat {
  spelvorm: Spelvorm;
  periode: Periode;
  teams: TeamSamenvatting[];
  nieuwInTeam: WijzigingRegel[];
  uitTeam: WijzigingRegel[];
  teamWissels: WijzigingRegel[];
  stafWijzigingen: WijzigingRegel[];
}

interface ApplyResultaat {
  aangemaakt: number;
  verwijderd: number;
  bijgewerkt: number;
}

interface Voortgang {
  stap: string;
  tekst: string;
  aantal?: number;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  nieuw: "var(--color-success, #10b981)",
  nieuwBg: "rgba(16,185,129,.08)",
  nieuwBorder: "rgba(16,185,129,.35)",
  uit: "var(--color-error, #ef4444)",
  uitBg: "rgba(239,68,68,.08)",
  uitBorder: "rgba(239,68,68,.35)",
  wissel: "var(--color-warning, #f59e0b)",
  wisselBg: "rgba(245,158,11,.08)",
  wisselBorder: "rgba(245,158,11,.35)",
  staf: "var(--color-info, #3b82f6)",
  stafBg: "rgba(59,130,246,.08)",
  stafBorder: "rgba(59,130,246,.35)",
};

function aanbevolenSpelvorm(): { spelvorm: Spelvorm; label: string } {
  const maand = new Date().getMonth() + 1;
  if ((maand >= 1 && maand <= 3) || (maand >= 11 && maand <= 12)) {
    return { spelvorm: "Zaal", label: "Zaal aanbevolen" };
  }
  if (maand >= 4 && maand <= 6) {
    return { spelvorm: "Veld", label: "Veld voorjaar aanbevolen" };
  }
  return { spelvorm: "Veld", label: "Veld najaar aanbevolen" };
}

function periodesVoorSpelvorm(s: Spelvorm): Periode[] {
  return s === "Veld" ? ["veld_najaar", "veld_voorjaar"] : ["zaal", "zaal_deel1", "zaal_deel2"];
}

function periodeLabel(p: Periode): string {
  const labels: Record<Periode, string> = {
    veld_najaar: "Veld najaar",
    veld_voorjaar: "Veld voorjaar",
    zaal: "Zaal",
    zaal_deel1: "Zaal deel 1",
    zaal_deel2: "Zaal deel 2",
  };
  return labels[p];
}

// ─── Stap 1: één keuzescherm voor spelvorm + periode ────────────────────────

function KiesScope({
  initialSpelvorm,
  initialPeriode,
  onVergelijk,
  error,
}: {
  initialSpelvorm: Spelvorm | null;
  initialPeriode: Periode | null;
  onVergelijk: (s: Spelvorm, p: Periode) => void;
  error: string | null;
}) {
  const aanbeveling = aanbevolenSpelvorm();
  const [spelvorm, setSpelvorm] = useState<Spelvorm>(initialSpelvorm ?? aanbeveling.spelvorm);
  const [periode, setPeriode] = useState<Periode | null>(
    initialPeriode ?? (spelvorm === "Veld" ? "veld_voorjaar" : "zaal_deel1")
  );

  const periodes = periodesVoorSpelvorm(spelvorm);
  const periodeGeldig = periode !== null && periodes.includes(periode);
  const effectievePeriode: Periode | null = periodeGeldig ? periode : (periodes[0] ?? null);

  function kiesSpelvorm(nieuw: Spelvorm) {
    setSpelvorm(nieuw);
    // Reset periode naar eerste geldige voor deze spelvorm
    const geldig = periodesVoorSpelvorm(nieuw);
    if (!periode || !geldig.includes(periode)) {
      setPeriode(geldig[0] ?? null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Vergelijk Sportlink team-indelingen met de database en voer wijzigingen door.
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 480,
        }}
      >
        {/* Spelvorm */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
            color: "var(--text-2, #a3a3a3)",
          }}
        >
          Spelvorm
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["Veld", "Zaal"] as Spelvorm[]).map((s) => {
            const actief = s === spelvorm;
            return (
              <button
                key={s}
                type="button"
                onClick={() => kiesSpelvorm(s)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: actief ? 600 : 400,
                  background: actief ? "rgba(255,107,0,.12)" : "var(--bg-2, #1e1e1e)",
                  border: `1px solid ${actief ? "rgba(255,107,0,.5)" : "var(--border-1, #3a3a3a)"}`,
                  borderRadius: 8,
                  color: actief ? "var(--accent, #ff6b00)" : "var(--text-1, #fafafa)",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Periode */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
            color: "var(--text-2, #a3a3a3)",
          }}
        >
          Periode
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: periodes.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {periodes.map((p) => {
            const actief = p === effectievePeriode;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriode(p)}
                style={{
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: actief ? 600 : 400,
                  background: actief ? "rgba(255,107,0,.12)" : "var(--bg-2, #1e1e1e)",
                  border: `1px solid ${actief ? "rgba(255,107,0,.5)" : "var(--border-1, #3a3a3a)"}`,
                  borderRadius: 8,
                  color: actief ? "var(--accent, #ff6b00)" : "var(--text-1, #fafafa)",
                  cursor: "pointer",
                }}
              >
                {periodeLabel(p)}
              </button>
            );
          })}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "var(--text-3, #666)",
            padding: "7px 10px",
            background: "var(--bg-2, #1e1e1e)",
            border: "1px solid var(--border-1, #3a3a3a)",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {aanbeveling.label} op basis van huidige maand
        </div>

        {error && (
          <div
            style={{
              background: T.uitBg,
              border: `1px solid ${T.uitBorder}`,
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              color: T.uit,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          className="btn-primary"
          style={{ width: "100%" }}
          disabled={!effectievePeriode}
          onClick={() => effectievePeriode && onVergelijk(spelvorm, effectievePeriode)}
        >
          Vergelijken
        </button>
      </div>
    </div>
  );
}

// ─── Stap 2: bezig met voortgang ─────────────────────────────────────────────

const BEZIG_STAPPEN = ["login", "teams", "vergelijken", "klaar"];
const BEZIG_LABELS: Record<string, string> = {
  login: "Inloggen",
  teams: "Teams ophalen",
  vergelijken: "Vergelijken",
  klaar: "Klaar",
};

function BezigState({ voortgang }: { voortgang: Voortgang[] }) {
  const huidigStap = voortgang.at(-1)?.stap ?? "login";

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Bezig met vergelijken...
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
        }}
      >
        {BEZIG_STAPPEN.map((stap) => {
          const gedaan = voortgang.some((v) => v.stap === stap);
          const actief = huidigStap === stap && !gedaan;
          const entry = voortgang.find((v) => v.stap === stap);

          return (
            <div
              key={stap}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 14,
                opacity: !gedaan && !actief ? 0.35 : 1,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: gedaan
                    ? T.nieuwBg
                    : actief
                      ? "rgba(255,107,0,.12)"
                      : "var(--bg-2, #1e1e1e)",
                  border: `1px solid ${gedaan ? T.nieuwBorder : actief ? "rgba(255,107,0,.5)" : "var(--border-1, #3a3a3a)"}`,
                  color: gedaan
                    ? T.nieuw
                    : actief
                      ? "var(--accent, #ff6b00)"
                      : "var(--text-3, #666)",
                  fontSize: 10,
                }}
              >
                {gedaan ? "✓" : actief ? "…" : "·"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1, #fafafa)" }}>
                  {BEZIG_LABELS[stap] ?? stap}
                </div>
                {entry && (
                  <div style={{ fontSize: 12, color: "var(--text-3, #666)", marginTop: 2 }}>
                    {entry.tekst}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stap 3: resultaat met checkboxes ────────────────────────────────────────

function WijzigingBadge({ type }: { type: "nieuw" | "uit" | "wissel" | "staf" }) {
  const config = {
    nieuw: { kleur: T.nieuw, bg: T.nieuwBg, border: T.nieuwBorder, label: "Nieuw" },
    uit: { kleur: T.uit, bg: T.uitBg, border: T.uitBorder, label: "Uit" },
    wissel: { kleur: T.wissel, bg: T.wisselBg, border: T.wisselBorder, label: "Wissel" },
    staf: { kleur: T.staf, bg: T.stafBg, border: T.stafBorder, label: "Staf" },
  }[type];

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.kleur,
        textTransform: "uppercase",
        letterSpacing: ".5px",
        flexShrink: 0,
      }}
    >
      {config.label}
    </span>
  );
}

function SelecteerbareLijst({
  titel,
  items,
  type,
  selectie,
  onToggle,
  onToggleAlle,
  selecteerbaar,
}: {
  titel: string;
  items: WijzigingRegel[];
  type: "nieuw" | "uit" | "wissel" | "staf";
  selectie: Set<string>;
  onToggle: (relCode: string) => void;
  onToggleAlle: () => void;
  selecteerbaar: boolean;
}) {
  if (items.length === 0) return null;
  const allesGeselecteerd = items.every((i) => selectie.has(i.relCode));
  const aantalGeselecteerd = items.filter((i) => selectie.has(i.relCode)).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          borderBottom: "1px solid var(--border-0, #262626)",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>{titel}</span>
        <span style={{ fontSize: 12, color: "var(--text-3, #666)" }}>
          {selecteerbaar ? `${aantalGeselecteerd} / ${items.length}` : items.length}
        </span>
        {selecteerbaar && (
          <button
            type="button"
            onClick={onToggleAlle}
            style={{
              fontSize: 11,
              marginLeft: "auto",
              color: allesGeselecteerd ? "var(--text-3, #666)" : "var(--accent, #ff6b00)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {allesGeselecteerd ? "Alles deselecteren" : "Alles selecteren"}
          </button>
        )}
      </div>

      {items.map((item) => {
        const gekozen = selectie.has(item.relCode);
        return (
          <label
            key={item.relCode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              background: "var(--bg-2, #1e1e1e)",
              border: "1px solid var(--border-1, #3a3a3a)",
              borderRadius: 6,
              marginBottom: 4,
              cursor: selecteerbaar ? "pointer" : "default",
              opacity: selecteerbaar && !gekozen ? 0.6 : 1,
            }}
          >
            {selecteerbaar && (
              <input
                type="checkbox"
                checked={gekozen}
                onChange={() => onToggle(item.relCode)}
                style={{ accentColor: "var(--accent, #ff6b00)" }}
              />
            )}
            <WijzigingBadge type={type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: "var(--text-1, #fafafa)", fontSize: 13 }}>
                {item.naam}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 1 }}>
                {item.vanTeam && item.naarTeam
                  ? `${item.vanTeam} → ${item.naarTeam}`
                  : item.vanTeam
                    ? item.vanTeam
                    : (item.naarTeam ?? "onbekend")}
                {item.functie && ` · ${item.functie}`}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function DryRunResultaatView({
  resultaat,
  selectie,
  setSelectie,
  onDoorvoeren,
  onTerug,
  applying,
  applyError,
}: {
  resultaat: DryRunResultaat;
  selectie: {
    nieuw: Set<string>;
    uit: Set<string>;
    wissel: Set<string>;
  };
  setSelectie: React.Dispatch<
    React.SetStateAction<{ nieuw: Set<string>; uit: Set<string>; wissel: Set<string> }>
  >;
  onDoorvoeren: () => void;
  onTerug: () => void;
  applying: boolean;
  applyError: string | null;
}) {
  const totaalSpelers = resultaat.teams.reduce((s, t) => s + t.aantalSpelers, 0);
  const totaalStaf = resultaat.teams.reduce((s, t) => s + t.aantalStaf, 0);
  const totaalGeselecteerd = selectie.nieuw.size + selectie.uit.size + selectie.wissel.size;

  function toggle(categorie: "nieuw" | "uit" | "wissel", relCode: string) {
    setSelectie((prev) => {
      const next = new Set(prev[categorie]);
      if (next.has(relCode)) next.delete(relCode);
      else next.add(relCode);
      return { ...prev, [categorie]: next };
    });
  }

  function toggleAlle(categorie: "nieuw" | "uit" | "wissel", items: WijzigingRegel[]) {
    setSelectie((prev) => {
      const alles = items.every((i) => prev[categorie].has(i.relCode));
      const next = new Set(alles ? [] : items.map((i) => i.relCode));
      return { ...prev, [categorie]: next };
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 20 }}>
        {periodeLabel(resultaat.periode)} · {resultaat.spelvorm}
      </p>

      {/* Samenvatting */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 20,
          maxWidth: 720,
        }}
      >
        {[
          { label: "Teams", value: resultaat.teams.length },
          { label: "Spelers", value: totaalSpelers },
          { label: "Staf", value: totaalStaf },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-2, #1e1e1e)",
              border: "1px solid var(--border-1, #3a3a3a)",
              borderRadius: 8,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1, #fafafa)" }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 720 }}>
        {applyError && (
          <div
            style={{
              background: T.uitBg,
              border: `1px solid ${T.uitBorder}`,
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              color: T.uit,
              marginBottom: 16,
            }}
          >
            {applyError}
          </div>
        )}

        <SelecteerbareLijst
          titel="Nieuw in team"
          items={resultaat.nieuwInTeam}
          type="nieuw"
          selectie={selectie.nieuw}
          onToggle={(r) => toggle("nieuw", r)}
          onToggleAlle={() => toggleAlle("nieuw", resultaat.nieuwInTeam)}
          selecteerbaar
        />
        <SelecteerbareLijst
          titel="Uit team"
          items={resultaat.uitTeam}
          type="uit"
          selectie={selectie.uit}
          onToggle={(r) => toggle("uit", r)}
          onToggleAlle={() => toggleAlle("uit", resultaat.uitTeam)}
          selecteerbaar
        />
        <SelecteerbareLijst
          titel="Teamwissels"
          items={resultaat.teamWissels}
          type="wissel"
          selectie={selectie.wissel}
          onToggle={(r) => toggle("wissel", r)}
          onToggleAlle={() => toggleAlle("wissel", resultaat.teamWissels)}
          selecteerbaar
        />
        <SelecteerbareLijst
          titel="Stafwijzigingen (informatief)"
          items={resultaat.stafWijzigingen}
          type="staf"
          selectie={new Set()}
          onToggle={() => {}}
          onToggleAlle={() => {}}
          selecteerbaar={false}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={onTerug}
            disabled={applying}
            style={{
              padding: "9px 16px",
              fontSize: 13,
              background: "var(--bg-2, #1e1e1e)",
              border: "1px solid var(--border-1, #3a3a3a)",
              borderRadius: 6,
              color: "var(--text-3, #666)",
              cursor: applying ? "not-allowed" : "pointer",
            }}
          >
            ← Terug
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={applying || totaalGeselecteerd === 0}
            onClick={onDoorvoeren}
          >
            {applying
              ? "Bezig met doorvoeren..."
              : `Doorvoeren (${totaalGeselecteerd} geselecteerd)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stap 5: klaar ───────────────────────────────────────────────────────────

function KlaarView({ resultaat, onReset }: { resultaat: ApplyResultaat; onReset: () => void }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Wijzigingen doorgevoerd.
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: T.nieuwBg,
            border: `1px solid ${T.nieuwBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: T.nieuw,
          }}
        >
          ✓
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Sync geslaagd</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Aangemaakt", value: resultaat.aangemaakt },
            { label: "Bijgewerkt", value: resultaat.bijgewerkt },
            { label: "Verwijderd", value: resultaat.verwijderd },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-2, #1e1e1e)",
                border: "1px solid var(--border-1, #3a3a3a)",
                borderRadius: 8,
                padding: "10px 8px",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1, #fafafa)" }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: "auto", padding: "9px 24px" }}
          onClick={onReset}
        >
          Nieuwe sync
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamSync() {
  const credentials = useSportlinkCredentials();
  const [stap, setStap] = useState<Stap>("scope");
  const [spelvorm, setSpelvorm] = useState<Spelvorm | null>(null);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [voortgang, setVoortgang] = useState<Voortgang[]>([]);
  const [dryRunResultaat, setDryRunResultaat] = useState<DryRunResultaat | null>(null);
  const [applyResultaat, setApplyResultaat] = useState<ApplyResultaat | null>(null);
  const [selectie, setSelectie] = useState<{
    nieuw: Set<string>;
    uit: Set<string>;
    wissel: Set<string>;
  }>({ nieuw: new Set(), uit: new Set(), wissel: new Set() });
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  async function handleVergelijken(s: Spelvorm, p: Periode) {
    setSpelvorm(s);
    setPeriode(p);
    setScopeError(null);
    setVoortgang([]);
    setStap("bezig");

    try {
      const res = await fetch("/api/sportlink/team-sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credentials, spelvorm: s, periode: p }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? `Fout ${res.status}`
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const dataLine = chunk.replace(/^data: /, "").trim();
          if (!dataLine) continue;

          const event = JSON.parse(dataLine) as {
            stap: string;
            tekst: string;
            aantal?: number;
            resultaat?: DryRunResultaat;
          };

          if (event.stap === "fout") {
            throw new Error(event.tekst);
          }

          if (event.stap === "klaar" && event.resultaat) {
            setDryRunResultaat(event.resultaat);
            // Default: alles geselecteerd
            setSelectie({
              nieuw: new Set(event.resultaat.nieuwInTeam.map((i) => i.relCode)),
              uit: new Set(event.resultaat.uitTeam.map((i) => i.relCode)),
              wissel: new Set(event.resultaat.teamWissels.map((i) => i.relCode)),
            });
            setVoortgang((prev) => [...prev, { stap: event.stap, tekst: event.tekst }]);
            setStap("resultaat");
            return;
          }

          setVoortgang((prev) => [
            ...prev,
            { stap: event.stap, tekst: event.tekst, aantal: event.aantal },
          ]);
        }
      }
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : "Onbekende fout bij vergelijken.");
      setStap("scope");
    }
  }

  async function handleDoorvoeren() {
    if (!spelvorm || !periode) return;
    setApplyError(null);
    setApplying(true);

    try {
      const res = await fetch("/api/sportlink/team-sync", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credentials,
          spelvorm,
          periode,
          nieuwRelCodes: [...selectie.nieuw],
          uitRelCodes: [...selectie.uit],
          wisselRelCodes: [...selectie.wissel],
        }),
      });

      const envelope = (await res.json()) as
        | { ok: true; data: ApplyResultaat }
        | { ok: false; error: { message?: string } };

      if (!res.ok || !envelope.ok) {
        throw new Error((!envelope.ok && envelope.error?.message) || `Fout ${res.status}`);
      }

      setApplyResultaat(envelope.data);
      setStap("klaar");
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Onbekende fout bij doorvoeren.");
    } finally {
      setApplying(false);
    }
  }

  function reset() {
    setStap("scope");
    setSpelvorm(null);
    setPeriode(null);
    setDryRunResultaat(null);
    setApplyResultaat(null);
    setSelectie({ nieuw: new Set(), uit: new Set(), wissel: new Set() });
    setScopeError(null);
    setApplyError(null);
    setVoortgang([]);
  }

  if (stap === "scope") {
    return (
      <KiesScope
        initialSpelvorm={spelvorm}
        initialPeriode={periode}
        onVergelijk={handleVergelijken}
        error={scopeError}
      />
    );
  }

  if (stap === "bezig") {
    return <BezigState voortgang={voortgang} />;
  }

  if ((stap === "resultaat" || stap === "apply") && dryRunResultaat) {
    return (
      <DryRunResultaatView
        resultaat={dryRunResultaat}
        selectie={selectie}
        setSelectie={setSelectie}
        onDoorvoeren={handleDoorvoeren}
        onTerug={() => setStap("scope")}
        applying={applying}
        applyError={applyError}
      />
    );
  }

  if (stap === "klaar" && applyResultaat) {
    return <KlaarView resultaat={applyResultaat} onReset={reset} />;
  }

  return null;
}
