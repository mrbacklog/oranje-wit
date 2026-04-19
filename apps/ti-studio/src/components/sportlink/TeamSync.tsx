"use client";

import { useState } from "react";

type Stap = "spelvorm" | "periode" | "dryrun" | "bezig" | "resultaat" | "apply" | "klaar";
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
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  nieuw: "#10b981",
  nieuwBg: "rgba(16,185,129,.08)",
  nieuwBorder: "rgba(16,185,129,.35)",
  uit: "#ef4444",
  uitBg: "rgba(239,68,68,.08)",
  uitBorder: "rgba(239,68,68,.35)",
  wissel: "#f59e0b",
  wisselBg: "rgba(245,158,11,.08)",
  wisselBorder: "rgba(245,158,11,.35)",
  staf: "#3b82f6",
  stafBg: "rgba(59,130,246,.08)",
  stafBorder: "rgba(59,130,246,.35)",
  inputBg: "#141416",
  inputBorder: "#2a2a2e",
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormInput({
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "9px 12px",
        fontSize: 14,
        background: T.inputBg,
        border: `1px solid ${T.inputBorder}`,
        borderRadius: "var(--radius-sm, 6px)",
        color: "var(--text-1, #fafafa)",
        outline: "none",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent, #ff6b00)";
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255,107,0,.4)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = T.inputBorder;
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function KiesSpelvorm({ onKies }: { onKies: (s: Spelvorm) => void }) {
  const aanbeveling = aanbevolenSpelvorm();

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
          padding: 28,
          maxWidth: 420,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Kies spelvorm</div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {(["Veld", "Zaal"] as Spelvorm[]).map((s) => (
            <button
              key={s}
              onClick={() => onKies(s)}
              style={{
                flex: 1,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 600,
                background:
                  s === aanbeveling.spelvorm ? "rgba(255,107,0,.12)" : "var(--bg-2, #1e1e1e)",
                border: `1px solid ${s === aanbeveling.spelvorm ? "rgba(255,107,0,.5)" : "var(--border-1, #3a3a3a)"}`,
                borderRadius: 8,
                color:
                  s === aanbeveling.spelvorm ? "var(--accent, #ff6b00)" : "var(--text-1, #fafafa)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--text-3, #666)",
            padding: "8px 12px",
            background: "var(--bg-2, #1e1e1e)",
            border: "1px solid var(--border-1, #3a3a3a)",
            borderRadius: 6,
          }}
        >
          {aanbeveling.label} op basis van de huidige maand
        </div>
      </div>
    </div>
  );
}

function KiesPeriode({
  spelvorm,
  onKies,
  onTerug,
}: {
  spelvorm: Spelvorm;
  onKies: (p: Periode) => void;
  onTerug: () => void;
}) {
  const periodes: Periode[] =
    spelvorm === "Veld" ? ["veld_najaar", "veld_voorjaar"] : ["zaal", "zaal_deel1", "zaal_deel2"];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Spelvorm: <strong style={{ color: "var(--text-1, #fafafa)" }}>{spelvorm}</strong>
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 28,
          maxWidth: 420,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Kies periode</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {periodes.map((p) => (
            <button
              key={p}
              onClick={() => onKies(p)}
              style={{
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 500,
                background: "var(--bg-2, #1e1e1e)",
                border: "1px solid var(--border-1, #3a3a3a)",
                borderRadius: 8,
                color: "var(--text-1, #fafafa)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {periodeLabel(p)}
            </button>
          ))}
        </div>

        <button
          onClick={onTerug}
          style={{
            fontSize: 13,
            color: "var(--text-3, #666)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Terug
        </button>
      </div>
    </div>
  );
}

function DryRunForm({
  spelvorm,
  periode,
  onVergelijk,
  onTerug,
  error,
}: {
  spelvorm: Spelvorm;
  periode: Periode;
  onVergelijk: (email: string, password: string) => void;
  onTerug: () => void;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        {periodeLabel(periode)} · {spelvorm}
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 28,
          maxWidth: 420,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              background: "#003082",
              borderRadius: 4,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            SL
          </span>
          Inloggen bij Sportlink
        </h3>

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email && password) onVergelijk(email, password);
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-3, #666)",
                textTransform: "uppercase",
                letterSpacing: ".5px",
                marginBottom: 6,
              }}
            >
              E-mailadres
            </label>
            <FormInput
              type="email"
              placeholder="naam@voorbeeld.nl"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-3, #666)",
                textTransform: "uppercase",
                letterSpacing: ".5px",
                marginBottom: 6,
              }}
            >
              Wachtwoord
            </label>
            <FormInput
              type="password"
              placeholder="Sportlink wachtwoord"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onTerug}
              style={{
                padding: "9px 16px",
                fontSize: 13,
                background: "var(--bg-2, #1e1e1e)",
                border: "1px solid var(--border-1, #3a3a3a)",
                borderRadius: 6,
                color: "var(--text-3, #666)",
                cursor: "pointer",
              }}
            >
              ← Terug
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={!email || !password}
            >
              Vergelijken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
        letterSpacing: ".4px",
        flexShrink: 0,
      }}
    >
      {config.label}
    </span>
  );
}

function WijzigingLijst({
  titel,
  items,
  type,
}: {
  titel: string;
  items: WijzigingRegel[];
  type: "nieuw" | "uit" | "wissel" | "staf";
}) {
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-3, #666)",
          textTransform: "uppercase",
          letterSpacing: ".5px",
          marginBottom: 8,
        }}
      >
        {titel} ({items.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.relCode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              background: "var(--bg-2, #1e1e1e)",
              border: "1px solid var(--border-1, #3a3a3a)",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <WijzigingBadge type={type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: "var(--text-1, #fafafa)" }}>{item.naam}</div>
              <div style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 1 }}>
                {item.vanTeam && item.naarTeam
                  ? `${item.vanTeam} → ${item.naarTeam}`
                  : item.vanTeam
                    ? item.vanTeam
                    : item.naarTeam}
                {item.functie && ` · ${item.functie}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DryRunResultaatView({
  resultaat,
  onDoorvoeren,
  onTerug,
}: {
  resultaat: DryRunResultaat;
  onDoorvoeren: () => void;
  onTerug: () => void;
}) {
  const totaalSpelers = resultaat.teams.reduce((s, t) => s + t.aantalSpelers, 0);
  const totaalStaf = resultaat.teams.reduce((s, t) => s + t.aantalStaf, 0);
  const totaalWijzigingen =
    resultaat.nieuwInTeam.length +
    resultaat.uitTeam.length +
    resultaat.teamWissels.length +
    resultaat.stafWijzigingen.length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 20 }}>
        {periodeLabel(resultaat.periode)} · {resultaat.spelvorm}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 24,
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
              background: "var(--bg-1, #141414)",
              border: "1px solid var(--border-1, #3a3a3a)",
              borderRadius: 8,
              padding: "12px 10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1, #fafafa)" }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {totaalWijzigingen === 0 ? (
        <div
          style={{
            padding: "16px",
            background: T.nieuwBg,
            border: `1px solid ${T.nieuwBorder}`,
            borderRadius: 8,
            fontSize: 13,
            color: T.nieuw,
            marginBottom: 20,
          }}
        >
          Geen wijzigingen — database is al up-to-date.
        </div>
      ) : (
        <>
          <WijzigingLijst titel="Nieuw in team" items={resultaat.nieuwInTeam} type="nieuw" />
          <WijzigingLijst titel="Uit team" items={resultaat.uitTeam} type="uit" />
          <WijzigingLijst titel="Teamwissels" items={resultaat.teamWissels} type="wissel" />
          <WijzigingLijst titel="Stafwijzigingen" items={resultaat.stafWijzigingen} type="staf" />
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onTerug}
          style={{
            padding: "9px 16px",
            fontSize: 13,
            background: "var(--bg-2, #1e1e1e)",
            border: "1px solid var(--border-1, #3a3a3a)",
            borderRadius: 6,
            color: "var(--text-3, #666)",
            cursor: "pointer",
          }}
        >
          ← Terug
        </button>
        {totaalWijzigingen > 0 && (
          <button className="btn-primary" style={{ flex: 1 }} onClick={onDoorvoeren}>
            Doorvoeren ({totaalWijzigingen} wijzigingen)
          </button>
        )}
      </div>
    </div>
  );
}

function ApplyKlaarView({
  resultaat,
  onReset,
}: {
  resultaat: ApplyResultaat;
  onReset: () => void;
}) {
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
          padding: 28,
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            style={{ width: 22, height: 22 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Sync geslaagd</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Aangemaakt", value: resultaat.aangemaakt, kleur: T.nieuw },
            { label: "Verwijderd", value: resultaat.verwijderd, kleur: T.uit },
          ].map(({ label, value, kleur }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-2, #1e1e1e)",
                border: "1px solid var(--border-1, #3a3a3a)",
                borderRadius: 8,
                padding: "12px 10px",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: kleur }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ padding: "9px 24px" }} onClick={onReset}>
          Nieuwe sync
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamSync() {
  const [stap, setStap] = useState<Stap>("spelvorm");
  const [spelvorm, setSpelvorm] = useState<Spelvorm | null>(null);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [dryRunResultaat, setDryRunResultaat] = useState<DryRunResultaat | null>(null);
  const [applyResultaat, setApplyResultaat] = useState<ApplyResultaat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  async function handleVergelijken(email: string, password: string) {
    if (!spelvorm || !periode) return;
    setError(null);
    setCredentials({ email, password });
    setStap("bezig");

    try {
      const res = await fetch("/api/sportlink/team-sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, spelvorm, periode }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? `Fout ${res.status}`
        );
      }

      const data = (await res.json()) as DryRunResultaat;
      setDryRunResultaat(data);
      setStap("resultaat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout bij vergelijken.");
      setStap("dryrun");
    }
  }

  async function handleDoorvoeren() {
    if (!spelvorm || !periode || !credentials) return;
    setStap("apply");

    try {
      const res = await fetch("/api/sportlink/team-sync", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credentials, spelvorm, periode }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? `Fout ${res.status}`
        );
      }

      const data = (await res.json()) as ApplyResultaat;
      setApplyResultaat(data);
      setStap("klaar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout bij doorvoeren.");
      setStap("resultaat");
    }
  }

  function reset() {
    setStap("spelvorm");
    setSpelvorm(null);
    setPeriode(null);
    setDryRunResultaat(null);
    setApplyResultaat(null);
    setCredentials(null);
    setError(null);
  }

  if (stap === "spelvorm") {
    return (
      <KiesSpelvorm
        onKies={(s) => {
          setSpelvorm(s);
          setStap("periode");
        }}
      />
    );
  }

  if (stap === "periode" && spelvorm) {
    return (
      <KiesPeriode
        spelvorm={spelvorm}
        onKies={(p) => {
          setPeriode(p);
          setStap("dryrun");
        }}
        onTerug={() => setStap("spelvorm")}
      />
    );
  }

  if ((stap === "dryrun" || stap === "bezig") && spelvorm && periode) {
    return (
      <DryRunForm
        spelvorm={spelvorm}
        periode={periode}
        onVergelijk={handleVergelijken}
        onTerug={() => setStap("periode")}
        error={error}
      />
    );
  }

  if (stap === "resultaat" && dryRunResultaat) {
    return (
      <DryRunResultaatView
        resultaat={dryRunResultaat}
        onDoorvoeren={handleDoorvoeren}
        onTerug={() => setStap("dryrun")}
      />
    );
  }

  if (stap === "apply" && dryRunResultaat) {
    return (
      <DryRunResultaatView
        resultaat={dryRunResultaat}
        onDoorvoeren={handleDoorvoeren}
        onTerug={() => setStap("dryrun")}
      />
    );
  }

  if (stap === "klaar" && applyResultaat) {
    return <ApplyKlaarView resultaat={applyResultaat} onReset={reset} />;
  }

  return null;
}
