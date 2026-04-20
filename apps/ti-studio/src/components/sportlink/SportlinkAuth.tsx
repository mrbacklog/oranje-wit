"use client";

import { createContext, useContext, useState } from "react";

import { FormInput } from "./shared";

export interface SportlinkCredentials {
  email: string;
  password: string;
}

interface SportlinkAuthContextValue {
  credentials: SportlinkCredentials;
  clearCredentials: () => void;
}

const SportlinkAuthContext = createContext<SportlinkAuthContextValue | null>(null);

/**
 * Hook voor tab-componenten — geeft credentials die al ingelogd zijn via SportlinkAuthGate.
 * Niet-null: tab-component wordt alleen gerenderd ná login.
 */
export function useSportlinkCredentials(): SportlinkCredentials {
  const ctx = useContext(SportlinkAuthContext);
  if (!ctx) {
    throw new Error("useSportlinkCredentials moet binnen SportlinkAuthGate worden gebruikt");
  }
  return ctx.credentials;
}

export function useSportlinkLogout(): () => void {
  const ctx = useContext(SportlinkAuthContext);
  if (!ctx) {
    throw new Error("useSportlinkLogout moet binnen SportlinkAuthGate worden gebruikt");
  }
  return ctx.clearCredentials;
}

/**
 * Gate: toont login-form totdat credentials zijn ingevuld, daarna children.
 * Credentials blijven in memory (verdwijnen bij page refresh).
 */
export function SportlinkAuthGate({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<SportlinkCredentials | null>(null);

  if (!credentials) {
    return <LoginForm onLogin={setCredentials} />;
  }

  return (
    <SportlinkAuthContext.Provider
      value={{
        credentials,
        clearCredentials: () => setCredentials(null),
      }}
    >
      {children}
    </SportlinkAuthContext.Provider>
  );
}

function LoginForm({ onLogin }: { onLogin: (c: SportlinkCredentials) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--text-3, #666)", marginBottom: 28 }}>
        Log één keer in bij Sportlink om alle synchronisatie-acties (Leden, Teams, Wijzigingen,
        Spelers) te kunnen uitvoeren. Je credentials blijven in-memory en worden niet opgeslagen.
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email && password) onLogin({ email, password });
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
            Inloggen
          </button>
        </form>

        <p style={{ fontSize: 11, color: "var(--text-3, #666)", marginTop: 12, lineHeight: 1.4 }}>
          Je credentials blijven alleen in deze browser-sessie. Ze worden niet opgeslagen en
          verdwijnen zodra je de pagina ververst of uitlogt.
        </p>
      </div>
    </div>
  );
}
