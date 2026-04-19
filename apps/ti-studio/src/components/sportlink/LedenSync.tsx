"use client";

import { useState } from "react";

import { FormInput } from "./shared";

type State = "login" | "syncing" | "resultaat" | "fout";

interface SyncResultaat {
  bijgewerkt: number;
  nieuw: number;
  totaalVergeleken: number;
}

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

// ─── State: Login ─────────────────────────────────────────────────────────────

function LoginState({
  onSubmit,
  error,
}: {
  onSubmit: (email: string, password: string) => void;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email && password) onSubmit(email, password);
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

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={!email || !password}
          >
            Synchroniseren
          </button>
        </form>

        <p style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 12, lineHeight: 1.4 }}>
          Je gegevens worden niet opgeslagen. Ze worden eenmalig gebruikt om in te loggen bij
          Sportlink en worden daarna verwijderd.
        </p>
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

function ResultaatState({
  resultaat,
  notifResultaat,
  onReset,
}: {
  resultaat: SyncResultaat;
  notifResultaat: NotifResultaat | null;
  onReset: () => void;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leden Sync</h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Synchronisatie voltooid.
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: 28,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: T.syncNieuwBg,
            border: `1px solid ${T.syncNieuwBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: T.syncNieuw,
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
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: notifResultaat ? 12 : 20,
          }}
        >
          {[
            { label: "Vergeleken", value: resultaat.totaalVergeleken },
            { label: "Nieuw", value: resultaat.nieuw },
            { label: "Bijgewerkt", value: resultaat.bijgewerkt },
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

        {notifResultaat && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3, #666)",
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            {notifResultaat.opgeslagen} notificaties opgeslagen, {notifResultaat.overgeslagen}{" "}
            overgeslagen
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
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LedenSync() {
  const [state, setState] = useState<State>("login");
  const [voortgang, setVoortgang] = useState<Voortgang[]>([]);
  const [resultaat, setResultaat] = useState<SyncResultaat | null>(null);
  const [notifResultaat, setNotifResultaat] = useState<NotifResultaat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(email: string, password: string) {
    setError(null);
    setVoortgang([]);
    setState("syncing");

    try {
      const res = await fetch("/api/sportlink/leden-sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      setState("login");
    }
  }

  function handleReset() {
    setState("login");
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

  return <LoginState onSubmit={handleLogin} error={error} />;
}
