"use client";

import { useState } from "react";

import { useSportlinkCredentials } from "./SportlinkAuth";

type State = "start" | "syncing" | "resultaat" | "fout";

interface VeldWijziging {
  veld: string;
  oud: string | null;
  nieuw: string | null;
}

interface LidWijziging {
  relCode: string;
  naam: string;
  type: "nieuw" | "bijgewerkt";
  wijzigingen: VeldWijziging[];
}

interface SyncResultaat {
  bijgewerkt: number;
  nieuw: number;
  ongewijzigd: number;
  totaalVergeleken: number;
  wijzigingen: LidWijziging[];
}

const VELD_LABELS: Record<string, string> = {
  roepnaam: "Roepnaam",
  achternaam: "Achternaam",
  tussenvoegsel: "Tussenvoegsel",
  voorletters: "Voorletters",
  geslacht: "Geslacht",
  geboortejaar: "Geboortejaar",
  geboortedatum: "Geboortedatum",
  email: "E-mail",
  lidSinds: "Lid sinds",
  registratieDatum: "Registratie",
  afmelddatum: "Afmelddatum",
  lidsoort: "Lidsoort",
  lidStatus: "Lidstatus",
  spelactiviteiten: "Spelactiviteiten",
  clubTeams: "Clubteams",
  leeftijdscategorie: "Leeftijdscategorie",
};

interface NotifResultaat {
  opgeslagen: number;
  overgeslagen: number;
}

interface Voortgang {
  stap: string;
  tekst: string;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  syncNieuw: "var(--color-success, #10b981)",
  syncNieuwBg: "rgba(16, 185, 129, .08)",
  syncNieuwBorder: "rgba(16, 185, 129, .35)",
  syncFout: "var(--color-error, #ef4444)",
  syncFoutBg: "rgba(239, 68, 68, .08)",
  syncFoutBorder: "rgba(239, 68, 68, .40)",
};

// ─── State: Start ─────────────────────────────────────────────────────────────

function StartState({ onStart, error }: { onStart: () => void; error: string | null }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leden Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Haal de actuele ledenlijst op uit Sportlink en sync naar de database.
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 28,
          maxWidth: 400,
        }}
      >
        {error && (
          <div
            style={{
              background: T.syncFoutBg,
              border: `1px solid ${T.syncFoutBorder}`,
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              color: T.syncFout,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={onStart}>
          Start leden synchronisatie
        </button>
      </div>
    </div>
  );
}

// ─── State: Syncing ───────────────────────────────────────────────────────────

const STAP_LABELS: Record<string, string> = {
  login: "Inloggen",
  leden: "Leden ophalen",
  sync: "Synchroniseren",
  notificaties: "Notificaties",
  klaar: "Klaar",
};

function SyncingState({ voortgang }: { voortgang: Voortgang[] }) {
  const stappen = ["login", "leden", "sync", "notificaties", "klaar"];
  const huidigStap = voortgang.at(-1)?.stap ?? "login";

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leden Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Bezig met synchroniseren...
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
        {stappen.map((stap) => {
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
                    ? T.syncNieuwBg
                    : actief
                      ? "rgba(255, 107, 0, .12)"
                      : "var(--bg-2, #1e1e1e)",
                  border: `1px solid ${gedaan ? T.syncNieuwBorder : actief ? "rgba(255, 107, 0, .5)" : "var(--border-1, #3a3a3a)"}`,
                  color: gedaan
                    ? T.syncNieuw
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
                  {STAP_LABELS[stap] ?? stap}
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

// ─── State: Resultaat ─────────────────────────────────────────────────────────

function WijzigingKaart({ w }: { w: LidWijziging }) {
  const [open, setOpen] = useState(false);
  const isNieuw = w.type === "nieuw";
  const kleur = isNieuw ? T.syncNieuw : "var(--accent, #ff6b00)";
  const bg = isNieuw ? T.syncNieuwBg : "rgba(255,107,0,.08)";
  const border = isNieuw ? T.syncNieuwBorder : "rgba(255,107,0,.35)";

  return (
    <div
      style={{
        background: "var(--bg-2, #1e1e1e)",
        border: "1px solid var(--border-1, #3a3a3a)",
        borderRadius: 8,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => !isNieuw && setOpen(!open)}
        disabled={isNieuw}
        style={{
          width: "100%",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "none",
          border: "none",
          color: "var(--text-1, #fafafa)",
          cursor: isNieuw ? "default" : "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            background: bg,
            border: `1px solid ${border}`,
            color: kleur,
            textTransform: "uppercase",
            letterSpacing: ".5px",
            flexShrink: 0,
          }}
        >
          {isNieuw ? "Nieuw" : `${w.wijzigingen.length} wijz.`}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{w.naam}</span>
        <span style={{ fontSize: 11, color: "var(--text-3, #666)" }}>{w.relCode}</span>
        {!isNieuw && (
          <span
            style={{
              fontSize: 12,
              color: "var(--text-3, #666)",
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform .15s",
            }}
          >
            ▸
          </span>
        )}
      </button>

      {!isNieuw && open && (
        <div
          style={{
            padding: "10px 14px 12px",
            borderTop: "1px solid var(--border-0, #262626)",
            fontSize: 12,
            color: "var(--text-2, #a3a3a3)",
          }}
        >
          {w.wijzigingen.map((v, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, padding: "4px 0", alignItems: "baseline" }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--text-1, #fafafa)",
                  minWidth: 140,
                  fontSize: 11,
                }}
              >
                {VELD_LABELS[v.veld] ?? v.veld}
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "var(--text-3, #666)",
                    marginRight: 8,
                  }}
                >
                  {v.oud ?? "∅"}
                </span>
                <span style={{ color: kleur, fontWeight: 500 }}>→ {v.nieuw ?? "∅"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultaatState({
  resultaat,
  notifResultaat,
  onReset,
}: {
  resultaat: SyncResultaat;
  notifResultaat: NotifResultaat | null;
  onReset: () => void;
}) {
  const [filter, setFilter] = useState<"alle" | "nieuw" | "bijgewerkt">("alle");

  const zichtbaar = resultaat.wijzigingen.filter((w) => filter === "alle" || w.type === filter);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leden Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 20 }}>
        Synchronisatie voltooid.
      </p>

      {/* Samenvatting */}
      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 720,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          {[
            { label: "Vergeleken", value: resultaat.totaalVergeleken },
            { label: "Nieuw", value: resultaat.nieuw },
            { label: "Bijgewerkt", value: resultaat.bijgewerkt },
            { label: "Ongewijzigd", value: resultaat.ongewijzigd },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-2, #1e1e1e)",
                border: "1px solid var(--border-1, #3a3a3a)",
                borderRadius: 8,
                padding: "12px 10px",
                textAlign: "center",
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

        {notifResultaat && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3, #666)",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {notifResultaat.opgeslagen} notificaties opgeslagen, {notifResultaat.overgeslagen}{" "}
            overgeslagen
          </div>
        )}
      </div>

      {/* Wijzigingen lijst */}
      {resultaat.wijzigingen.length > 0 && (
        <div style={{ maxWidth: 720, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {(
              [
                { key: "alle", label: `Alle (${resultaat.wijzigingen.length})` },
                { key: "nieuw", label: `Nieuw (${resultaat.nieuw})` },
                { key: "bijgewerkt", label: `Bijgewerkt (${resultaat.bijgewerkt})` },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  background: filter === f.key ? "var(--accent, #ff6b00)" : "var(--bg-2, #1e1e1e)",
                  border: `1px solid ${filter === f.key ? "var(--accent, #ff6b00)" : "var(--border-1, #3a3a3a)"}`,
                  borderRadius: 6,
                  color: filter === f.key ? "#fff" : "var(--text-2, #a3a3a3)",
                  cursor: "pointer",
                  fontWeight: filter === f.key ? 600 : 400,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            style={{
              maxHeight: 500,
              overflowY: "auto",
              padding: 2,
            }}
          >
            {zichtbaar.map((w) => (
              <WijzigingKaart key={`${w.type}-${w.relCode}`} w={w} />
            ))}
          </div>
        </div>
      )}

      {resultaat.wijzigingen.length === 0 && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-3, #666)",
            maxWidth: 720,
            marginBottom: 16,
            textAlign: "center",
            padding: 20,
          }}
        >
          Geen wijzigingen — alle leden zijn al actueel.
        </div>
      )}

      <button
        className="btn-primary"
        style={{ width: "auto", padding: "9px 24px" }}
        onClick={onReset}
      >
        Opnieuw synchroniseren
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LedenSync() {
  const credentials = useSportlinkCredentials();
  const [state, setState] = useState<State>("start");
  const [voortgang, setVoortgang] = useState<Voortgang[]>([]);
  const [resultaat, setResultaat] = useState<SyncResultaat | null>(null);
  const [notifResultaat, setNotifResultaat] = useState<NotifResultaat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    setVoortgang([]);
    setState("syncing");

    try {
      const res = await fetch("/api/sportlink/leden-sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
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
            resultaat?: SyncResultaat;
            notifResultaat?: NotifResultaat;
          };

          if (event.stap === "fout") {
            throw new Error(event.tekst);
          }

          setVoortgang((prev) => [...prev, { stap: event.stap, tekst: event.tekst }]);

          if (event.stap === "klaar") {
            setResultaat(event.resultaat ?? null);
            setNotifResultaat(event.notifResultaat ?? null);
            setState("resultaat");
            return;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout bij leden sync.");
      setState("start");
    }
  }

  function handleReset() {
    setState("start");
    setVoortgang([]);
    setResultaat(null);
    setNotifResultaat(null);
    setError(null);
  }

  if (state === "syncing") {
    return <SyncingState voortgang={voortgang} />;
  }

  if (state === "resultaat" && resultaat) {
    return (
      <ResultaatState resultaat={resultaat} notifResultaat={notifResultaat} onReset={handleReset} />
    );
  }

  return <StartState onStart={handleStart} error={error} />;
}
