"use client";

import { useState } from "react";
import type { SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch } from "@/lib/sportlink/types";

type State = "login" | "loading" | "diff" | "done";

interface ApplyResult {
  aangemaakt: number;
  afgemeld: number;
  gekoppeld: number;
}

// ─── Sync-specific tokens (not yet in global tokens.css) ─────────────────────
const T = {
  syncNieuw: "#10b981",
  syncNieuwBg: "rgba(16, 185, 129, .08)",
  syncNieuwBorder: "rgba(16, 185, 129, .35)",
  syncAfgemeld: "#ef4444",
  syncAfgemeldBg: "rgba(239, 68, 68, .08)",
  syncAfgemeldBorder: "rgba(239, 68, 68, .40)",
  syncMatch: "#3b82f6",
  syncMatchBg: "rgba(59, 130, 246, .08)",
  syncMatchBorder: "rgba(59, 130, 246, .35)",
  sexeH: "#2563eb",
  sexeV: "#d946ef",
  inputBg: "#141416",
  inputBorder: "#2a2a2e",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(firstName: string | null, lastName: string | null): string {
  return (firstName?.[0] ?? "") + (lastName?.[0] ?? "");
}

function genderChar(code: "Male" | "Female"): "m" | "v" {
  return code === "Male" ? "m" : "v";
}

function geboortejaar(dob: string): number {
  return new Date(dob).getFullYear();
}

function korfbalLeeftijd(dob: string): number {
  return new Date().getFullYear() - new Date(dob).getFullYear();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  firstName,
  lastName,
  gender,
}: {
  firstName: string | null;
  lastName: string | null;
  gender: "Male" | "Female";
}) {
  const g = genderChar(gender);
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        background: g === "m" ? "rgba(37, 99, 235, .15)" : "rgba(217, 70, 239, .15)",
        color: g === "m" ? T.sexeH : T.sexeV,
      }}
    >
      {initials(firstName, lastName).toUpperCase()}
    </div>
  );
}

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
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent, #ff6b00)";
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255, 107, 0, .4)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = T.inputBorder;
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

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
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sportlink Sync</h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-3, #666)",
          marginBottom: 28,
        }}
      >
        Haal de actuele ledenlijst op uit Sportlink en vergelijk met de spelerspool.
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
              background: T.syncAfgemeldBg,
              border: `1px solid ${T.syncAfgemeldBorder}`,
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              color: T.syncAfgemeld,
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
            Ophalen
          </button>
        </form>

        <p
          style={{
            fontSize: 11,
            color: "var(--text-3, #666)",
            marginTop: 12,
            lineHeight: 1.4,
          }}
        >
          Je gegevens worden niet opgeslagen. Ze worden eenmalig gebruikt om in te loggen bij
          Sportlink en worden daarna verwijderd.
        </p>
      </div>
    </div>
  );
}

// ─── State: Loading ───────────────────────────────────────────────────────────

interface Voortgang {
  stap: string;
  tekst: string;
  aantal?: number;
}

function LoadingState({ stappen }: { stappen: Voortgang[] }) {
  const huidigeStap = stappen[stappen.length - 1];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sportlink Sync</h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-3, #666)",
          marginBottom: 28,
        }}
      >
        Bezig met ophalen...
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: "40px 28px",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--border-1, #3a3a3a)",
            borderTopColor: "var(--accent, #ff6b00)",
            borderRadius: "50%",
            animation: "spin .8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 14, color: "var(--text-2, #a3a3a3)" }}>
          {huidigeStap?.tekst ?? "Verbinden met Sportlink..."}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--text-3, #666)",
            lineHeight: 2,
            textAlign: "left",
          }}
        >
          {stappen.map((s) => (
            <div key={s.stap} style={{ color: T.syncNieuw }}>
              ✓ {s.tekst}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── State: Diff ─────────────────────────────────────────────────────────────

function CategoryHeader({
  indicator,
  title,
  count,
  allSelected,
  onSelectAll,
}: {
  indicator: "nieuw" | "afgemeld" | "match";
  title: string;
  count: number;
  allSelected: boolean;
  onSelectAll: () => void;
}) {
  const indicatorColor =
    indicator === "nieuw" ? T.syncNieuw : indicator === "afgemeld" ? T.syncAfgemeld : T.syncMatch;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border-0, #262626)",
        marginBottom: 2,
      }}
    >
      <div
        style={{
          width: 3,
          height: 18,
          borderRadius: 2,
          background: indicatorColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
      <span
        style={{
          fontSize: 12,
          color: "var(--text-3, #666)",
          marginLeft: "auto",
        }}
      >
        {count}
      </span>
      <button
        onClick={onSelectAll}
        style={{
          fontSize: 11,
          color: allSelected ? "var(--text-3, #666)" : "var(--accent, #ff6b00)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginLeft: 8,
          padding: 0,
        }}
      >
        {allSelected ? "Deselecteer alles" : "Alles selecteren"}
      </button>
    </div>
  );
}

function MemberRow({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 6,
        gap: 12,
        background: hovered ? "var(--bg-2, #1e1e1e)" : "transparent",
        transition: "background .1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}

function DiffState({
  diff,
  onApply,
  onCancel,
  applying,
}: {
  diff: SyncDiff;
  onApply: (
    selectedNieuwe: Set<string>,
    selectedAfgemeld: Set<string>,
    selectedKoppelingen: Set<string>
  ) => void;
  onCancel: () => void;
  applying: boolean;
}) {
  const [selectedNieuwe, setSelectedNieuwe] = useState<Set<string>>(
    new Set(diff.nieuwe.map((n) => n.lid.PublicPersonId))
  );
  const [selectedAfgemeld, setSelectedAfgemeld] = useState<Set<string>>(
    new Set(diff.afgemeld.map((a) => a.spelerId))
  );
  const [selectedKoppelingen, setSelectedKoppelingen] = useState<Set<string>>(
    new Set(diff.fuzzyMatches.map((m) => m.spelerId))
  );

  const totalSelected = selectedNieuwe.size + selectedAfgemeld.size + selectedKoppelingen.size;
  const totalItems = diff.nieuwe.length + diff.afgemeld.length + diff.fuzzyMatches.length;

  function toggleNieuw(id: string) {
    setSelectedNieuwe((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAfgemeld(id: string) {
    setSelectedAfgemeld((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKoppeling(id: string) {
    setSelectedKoppelingen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allNieuwSelected = selectedNieuwe.size === diff.nieuwe.length;
  const allAfgemeldSelected = selectedAfgemeld.size === diff.afgemeld.length;
  const allKoppelingenSelected = selectedKoppelingen.size === diff.fuzzyMatches.length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sportlink Sync</h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-3, #666)",
          marginBottom: 28,
        }}
      >
        Vergelijking met spelerspool — selecteer wat je wilt doorvoeren.
      </p>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          {[
            {
              color: T.syncNieuw,
              label: `${diff.nieuwe.length} nieuwe leden`,
            },
            {
              color: T.syncAfgemeld,
              label: `${diff.afgemeld.length} afmeldingen`,
            },
            {
              color: T.syncMatch,
              label: `${diff.fuzzyMatches.length} koppelingen`,
            },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--text-2, #a3a3a3)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Nieuwe leden */}
      {diff.nieuwe.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <CategoryHeader
            indicator="nieuw"
            title="Nieuwe leden"
            count={diff.nieuwe.length}
            allSelected={allNieuwSelected}
            onSelectAll={() =>
              setSelectedNieuwe(
                allNieuwSelected ? new Set() : new Set(diff.nieuwe.map((n) => n.lid.PublicPersonId))
              )
            }
          />
          {diff.nieuwe.map(({ lid, isNieuwLid }: NieuwLid) => (
            <MemberRow key={lid.PublicPersonId}>
              <input
                type="checkbox"
                checked={selectedNieuwe.has(lid.PublicPersonId)}
                onChange={() => toggleNieuw(lid.PublicPersonId)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--accent, #ff6b00)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <Avatar firstName={lid.FirstName} lastName={lid.LastName} gender={lid.GenderCode} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lid.FirstName} {lid.Infix ? `${lid.Infix} ` : ""}
                  {lid.LastName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3, #666)",
                    marginTop: 1,
                  }}
                >
                  {isNieuwLid ? "Nieuw lid" : "Korfbalspeler"} · aangemeld {lid.RelationStart}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: 12,
                  color: "var(--text-3, #666)",
                  flexShrink: 0,
                }}
              >
                <span>
                  <span style={{ color: "#555", marginRight: 3 }}>Leeftijd</span>{" "}
                  {korfbalLeeftijd(lid.DateOfBirth)}
                </span>
                <span>
                  <span style={{ color: "#555", marginRight: 3 }}>Cat.</span>{" "}
                  {lid.AgeClassDescription}
                </span>
                <span>
                  <span style={{ color: "#555", marginRight: 3 }}>Rel.</span>{" "}
                  {lid.PublicPersonId.slice(0, 7)}
                </span>
              </div>
            </MemberRow>
          ))}
        </div>
      )}

      {/* Afmeldingen */}
      {diff.afgemeld.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <CategoryHeader
            indicator="afgemeld"
            title="Afmeldingen"
            count={diff.afgemeld.length}
            allSelected={allAfgemeldSelected}
            onSelectAll={() =>
              setSelectedAfgemeld(
                allAfgemeldSelected ? new Set() : new Set(diff.afgemeld.map((a) => a.spelerId))
              )
            }
          />
          {diff.afgemeld.map(({ lid, spelerId, spelerNaam, reden }: AfgemeldLid) => (
            <MemberRow key={spelerId}>
              <input
                type="checkbox"
                checked={selectedAfgemeld.has(spelerId)}
                onChange={() => toggleAfgemeld(spelerId)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--accent, #ff6b00)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <Avatar firstName={lid.FirstName} lastName={lid.LastName} gender={lid.GenderCode} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{spelerNaam}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3, #666)",
                    marginTop: 1,
                  }}
                >
                  In spelerspool als actief
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.syncAfgemeld,
                  background: T.syncAfgemeldBg,
                  border: `1px solid ${T.syncAfgemeldBorder}`,
                  borderRadius: 4,
                  padding: "3px 8px",
                  flexShrink: 0,
                }}
              >
                {reden === "afmelddatum"
                  ? `Afmelddatum ${lid.RelationEnd ?? "onbekend"}`
                  : reden === "niet-actief"
                    ? "Lidmaatschap niet actief"
                    : reden === "niet-spelend"
                      ? "Geen spelactiviteit meer"
                      : "Niet meer in Sportlink"}
              </div>
            </MemberRow>
          ))}
        </div>
      )}

      {/* Fuzzy matches */}
      {diff.fuzzyMatches.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <CategoryHeader
            indicator="match"
            title="Mogelijke koppelingen"
            count={diff.fuzzyMatches.length}
            allSelected={allKoppelingenSelected}
            onSelectAll={() =>
              setSelectedKoppelingen(
                allKoppelingenSelected
                  ? new Set()
                  : new Set(diff.fuzzyMatches.map((m) => m.spelerId))
              )
            }
          />
          {diff.fuzzyMatches.map(({ lid, spelerId, spelerNaam }: FuzzyMatch) => (
            <MemberRow key={spelerId}>
              <input
                type="checkbox"
                checked={selectedKoppelingen.has(spelerId)}
                onChange={() => toggleKoppeling(spelerId)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--accent, #ff6b00)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <Avatar firstName={lid.FirstName} lastName={lid.LastName} gender={lid.GenderCode} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {lid.FirstName} {lid.Infix ? `${lid.Infix} ` : ""}
                  {lid.LastName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3, #666)",
                    marginTop: 1,
                  }}
                >
                  Geboortedatum {lid.DateOfBirth} · Sportlink rel. {lid.PublicPersonId.slice(0, 7)}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: T.syncMatch,
                  background: T.syncMatchBg,
                  border: `1px solid ${T.syncMatchBorder}`,
                  borderRadius: 4,
                  padding: "3px 8px",
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ width: 12, height: 12 }}
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Koppel aan &ldquo;{spelerNaam}&rdquo;
              </div>
            </MemberRow>
          ))}
        </div>
      )}

      {/* Sticky action bar */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--bg-1, #141414)",
          borderTop: "1px solid var(--border-1, #3a3a3a)",
          padding: "14px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 24,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-2, #a3a3a3)" }}>
          <strong style={{ color: "var(--text-1, #fafafa)" }}>{totalSelected}</strong> van{" "}
          {totalItems} geselecteerd
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary btn-sm" onClick={onCancel}>
            Annuleren
          </button>
          <button
            className="btn-primary btn-sm"
            disabled={totalSelected === 0 || applying}
            onClick={() => onApply(selectedNieuwe, selectedAfgemeld, selectedKoppelingen)}
          >
            {applying ? "Bezig..." : "Doorvoeren"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── State: Done ─────────────────────────────────────────────────────────────

function DoneState({ result, onReset }: { result: ApplyResult; onReset: () => void }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sportlink Sync</h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-3, #666)",
          marginBottom: 28,
        }}
      >
        Synchronisatie voltooid.
      </p>

      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: "40px 28px",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "rgba(16, 185, 129, .1)",
            borderRadius: "50%",
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
            style={{ width: 24, height: 24 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          Wijzigingen doorgevoerd
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-3, #666)",
            lineHeight: 1.5,
          }}
        >
          {result.aangemaakt} spelers aangemaakt
          <br />
          {result.afgemeld} afmeldingen gesignaleerd
          <br />
          {result.gekoppeld} rel_codes gekoppeld
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: 20, width: "auto", padding: "9px 24px" }}
          onClick={onReset}
        >
          Opnieuw synchroniseren
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SportlinkSync() {
  const [state, setState] = useState<State>("login");
  const [diff, setDiff] = useState<SyncDiff | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [voortgang, setVoortgang] = useState<Voortgang[]>([]);

  async function handleLogin(email: string, password: string) {
    setError(null);
    setVoortgang([]);
    setState("loading");

    try {
      const res = await fetch("/api/sportlink/sync", {
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

      // Lees SSE stream voor voortgang
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
            diff?: SyncDiff;
          };

          if (event.stap === "fout") {
            throw new Error(event.tekst);
          }

          if (event.stap === "klaar" && event.diff) {
            setDiff(event.diff);
            setState("diff");
            return;
          }

          setVoortgang((prev) => [
            ...prev,
            { stap: event.stap, tekst: event.tekst, aantal: event.aantal },
          ]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout bij ophalen Sportlink data.");
      setState("login");
    }
  }

  async function handleApply(
    selectedNieuwe: Set<string>,
    selectedAfgemeld: Set<string>,
    selectedKoppelingen: Set<string>
  ) {
    if (!diff) return;
    setApplying(true);

    try {
      const nieuwePayload = diff.nieuwe
        .filter((n) => selectedNieuwe.has(n.lid.PublicPersonId))
        .map(({ lid, isNieuwLid }) => ({
          relCode: lid.PublicPersonId,
          roepnaam: lid.FirstName,
          achternaam: lid.LastName,
          geboortejaar: geboortejaar(lid.DateOfBirth),
          geboortedatum: lid.DateOfBirth,
          geslacht: genderChar(lid.GenderCode),
          isNieuwLid,
        }));

      const afgemeldPayload = diff.afgemeld
        .filter((a) => selectedAfgemeld.has(a.spelerId))
        .map((a) => a.spelerId);

      const koppelingenPayload = diff.fuzzyMatches
        .filter((m) => selectedKoppelingen.has(m.spelerId))
        .map((m) => ({
          oudSpelerId: m.spelerId,
          nieuweRelCode: m.lid.PublicPersonId,
        }));

      const res = await fetch("/api/sportlink/apply", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nieuwe: nieuwePayload,
          afgemeld: afgemeldPayload,
          koppelingen: koppelingenPayload,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Fout ${res.status}`);
      }

      setResult({
        aangemaakt: nieuwePayload.length,
        afgemeld: afgemeldPayload.length,
        gekoppeld: koppelingenPayload.length,
      });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout bij doorvoeren wijzigingen.");
    } finally {
      setApplying(false);
    }
  }

  function handleReset() {
    setDiff(null);
    setResult(null);
    setError(null);
    setState("login");
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      {state === "login" && <LoginState onSubmit={handleLogin} error={error} />}
      {state === "loading" && <LoadingState stappen={voortgang} />}
      {state === "diff" && diff && (
        <DiffState diff={diff} onApply={handleApply} onCancel={handleReset} applying={applying} />
      )}
      {state === "done" && result && <DoneState result={result} onReset={handleReset} />}
    </div>
  );
}
