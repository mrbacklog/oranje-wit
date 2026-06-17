// apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx
"use client";

import { Search } from "lucide-react";
import type {
  PubliekTeam,
  PubliekeSpeler,
  KennismakingItem,
} from "@/lib/teamindeling/publieke-presentatie";

function volleNaam(sp: PubliekeSpeler): string {
  return [sp.roepnaam, sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(" ");
}
function alfa(spelers: PubliekeSpeler[]): PubliekeSpeler[] {
  return [...spelers].sort((a, b) => a.roepnaam.localeCompare(b.roepnaam, "nl"));
}
function initialen(sp: PubliekeSpeler): string {
  return (sp.roepnaam[0] ?? "") + (sp.achternaam[0] ?? "");
}

function SpelerRij({ sp }: { sp: PubliekeSpeler }) {
  const isDame = sp.geslacht === "V";
  return (
    <div
      className="pt-speler"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "5px 8px",
        borderRadius: 8,
        marginBottom: 3,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: isDame
            ? "linear-gradient(135deg, rgba(147,197,253,0.2) 0%, rgba(147,197,253,0.06) 100%)"
            : "linear-gradient(135deg, rgba(255,102,0,0.2) 0%, rgba(255,102,0,0.06) 100%)",
          border: isDame ? "1px solid rgba(147,197,253,0.35)" : "1px solid rgba(255,102,0,0.3)",
          color: isDame ? "rgba(147,197,253,0.85)" : "rgba(255,102,0,0.85)",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          textTransform: "uppercase",
        }}
      >
        {initialen(sp)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.88)" }}>
        {volleNaam(sp)}
      </span>
    </div>
  );
}

function SpelerLijst({ spelers, geslacht }: { spelers: PubliekeSpeler[]; geslacht: "V" | "M" }) {
  if (spelers.length === 0) return null;
  const label = geslacht === "V" ? "Dames" : "Heren";
  const accentKleur = geslacht === "V" ? "rgba(147,197,253,0.7)" : "#FF6600";
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.45)",
          paddingBottom: 8,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            background: accentKleur,
            flexShrink: 0,
            display: "inline-block",
          }}
        />
        {label}
        <span
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.4)",
            borderRadius: 8,
            fontSize: 9,
            padding: "1px 6px",
          }}
        >
          {spelers.length}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alfa(spelers).map((sp, i) => (
          <SpelerRij key={i} sp={sp} />
        ))}
      </ul>
    </div>
  );
}

function StafKolom({ staf }: { staf: PubliekTeam["staf"] }) {
  const rolWeergave = (s: PubliekTeam["staf"][number]) =>
    s.rolLabel?.trim() || (s.rol.trim().toLowerCase() === "trainer" ? "Trainer/Coach" : s.rol);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.45)",
          paddingBottom: 8,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            background: "rgba(255,255,255,0.35)",
            flexShrink: 0,
            display: "inline-block",
          }}
        />
        Staf
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {staf.map((s, i) => (
          <li
            key={i}
            className="pt-speler"
            style={{
              fontWeight: 500,
              color: "rgba(255,255,255,0.88)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span
              style={{
                color: "rgba(255,102,0,0.75)",
                fontSize: 10,
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {rolWeergave(s)}
            </span>
            {s.naam}
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
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: "1px solid rgba(255,102,0,0.15)",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {staf.map((s, i) => (
        <div
          key={i}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,102,0,0.12) 0%, rgba(255,102,0,0.04) 100%)",
            border: "1px solid rgba(255,102,0,0.3)",
            borderRadius: 10,
            padding: "8px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#FF6600",
            }}
          >
            {rolWeergave(s)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
            {s.naam}
          </span>
        </div>
      ))}
    </div>
  );
}

function KennismakingBlok({ item }: { item: KennismakingItem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        padding: "8px 12px",
        borderLeft: "3px solid #FF6600",
        background: "rgba(255,102,0,0.06)",
        borderRadius: "0 6px 6px 0",
        boxShadow: "-1px 0 12px rgba(255,102,0,0.12)",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>📅</span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "rgba(255,102,0,0.8)",
            marginBottom: 2,
          }}
        >
          Kennismakingstraining
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.88)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.datum}
          {item.tijd && (
            <>
              <span style={{ color: "rgba(255,102,0,0.6)", margin: "0 5px" }}>·</span>
              {item.tijd}
            </>
          )}
          {item.locatie && (
            <>
              <span style={{ color: "rgba(255,102,0,0.6)", margin: "0 5px" }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{item.locatie}</span>
            </>
          )}
        </div>
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
        borderRadius: 6,
        padding: "10px 12px",
        marginTop: 12,
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <span>ℹ️</span>
      <span>Verdeling over teams na selectie tijdens de voorbereiding.</span>
    </div>
  );
}

export function TeamKaart({
  team,
  animKlasse,
  onZoek,
  seizoenLabel,
}: {
  team: PubliekTeam;
  animKlasse: string;
  onZoek: () => void;
  seizoenLabel: string | null;
}) {
  const isSelectie = team.soort === "selectie";

  return (
    <div
      className={animKlasse}
      style={{
        background: "var(--pt-donker, #0f0f0f)",
        borderRadius: 0,
        marginBottom: 80,
      }}
    >
      {/* Oranje diagonale hero — sticky, vol-breed */}
      <div
        className="pt-hero-pad"
        style={{
          background: "#FF6600",
          padding: "16px 0 44px",
          clipPath: "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          overflow: "hidden",
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="pt-hero-shimmer"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        {/* Inhoud gecentreerd op max 720px */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 24px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Badge + zoekknop op één rij */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            {isSelectie ? (
              <span
                style={{
                  background: "rgba(255,255,255,0.25)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  padding: "3px 9px",
                  borderRadius: 3,
                }}
              >
                Selectie
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={onZoek}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 4,
                padding: "6px 10px",
                color: "#fff",
                cursor: "pointer",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={16} />
            </button>
          </div>
          {/* Teamnaam */}
          <h2
            className="pt-hero-naam"
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              color: "#fff",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            {team.naam}
          </h2>
          {/* Meta */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 7,
            }}
          >
            {team.dames.length > 0 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                {team.dames.length} dames
              </span>
            )}
            {team.dames.length > 0 && team.heren.length > 0 && (
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  display: "inline-block",
                }}
              />
            )}
            {team.heren.length > 0 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                {team.heren.length} heren
              </span>
            )}
            {isSelectie && team.uitkomstTeams.length > 0 && (
              <>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.4)",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  → {team.uitkomstTeams.join(", ")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="pt-body-pad"
        style={{ maxWidth: 720, margin: "0 auto", padding: "18px 24px" }}
      >
        {/* Normaal team of gebundelde selectie */}
        {(team.soort === "team" || (team.soort === "selectie" && team.gebundeld)) && (
          <>
            {team.kennismakingstraining && <KennismakingBlok item={team.kennismakingstraining} />}
            {/* Mobiel: 2 kolommen + pills */}
            <div className="pt-staf-desktop-hide">
              <div style={{ display: "flex", gap: 20 }}>
                <SpelerLijst spelers={team.dames} geslacht="V" />
                <SpelerLijst spelers={team.heren} geslacht="M" />
              </div>
              {team.soort === "selectie" && team.gebundeld && <InfoBanner />}
              <StafPills staf={team.staf} />
            </div>

            {/* Desktop: 3 kolommen */}
            <div className="pt-staf-desktop-show">
              <div style={{ display: "flex", gap: 20 }}>
                <SpelerLijst spelers={team.dames} geslacht="V" />
                <SpelerLijst spelers={team.heren} geslacht="M" />
                {team.staf.length > 0 && <StafKolom staf={team.staf} />}
              </div>
              {team.soort === "selectie" && team.gebundeld && <InfoBanner />}
            </div>
          </>
        )}

        {/* Gesplitste selectie */}
        {team.soort === "selectie" && !team.gebundeld && (
          <div>
            {team.kennismakingstraining && <KennismakingBlok item={team.kennismakingstraining} />}
            {team.subteams.map((sub, i) => (
              <div key={i}>
                {i > 0 && (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      margin: "16px 0",
                    }}
                  />
                )}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#fff",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#FF6600",
                      display: "inline-block",
                    }}
                  />
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
      </div>
    </div>
  );
}
