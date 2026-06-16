// apps/ti-studio/src/app/teamindeling/components/TeamKaart.tsx
"use client";

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

function SpelerLijst({ spelers, geslacht }: { spelers: PubliekeSpeler[]; geslacht: "V" | "M" }) {
  if (spelers.length === 0) return null;
  const label = geslacht === "V" ? "♀ Dames" : "♂ Heren";
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#FF6600",
          paddingBottom: 6,
          marginBottom: 10,
          borderBottom: "1px solid rgba(255,102,0,0.30)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {label}
        <span
          style={{
            background: "rgba(255,102,0,0.15)",
            color: "#FF6600",
            fontSize: 9,
            padding: "1px 5px",
            borderRadius: 10,
          }}
        >
          {spelers.length}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alfa(spelers).map((sp, i) => (
          <li
            key={i}
            className="pt-speler"
            style={{
              fontWeight: 500,
              color: "rgba(255,255,255,0.88)",
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
          color: "#FF6600",
          paddingBottom: 6,
          marginBottom: 10,
          borderBottom: "1px solid rgba(255,102,0,0.30)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
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
        gap: 6,
      }}
    >
      {staf.map((s, i) => (
        <span
          key={i}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
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
        marginTop: 14,
        paddingTop: 12,
        borderTop: "1px solid rgba(255,102,0,0.15)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#FF6600",
          marginBottom: 6,
        }}
      >
        🏐 Kennismakingstraining
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
        <strong style={{ color: "#fff" }}>{item.datum}</strong>
        {" · "}
        {item.tijd}
        {item.locatie && (
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              marginTop: 2,
            }}
          >
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
        className="pt-hero-pad"
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
            position: "absolute",
            inset: 0,
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
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              padding: "3px 9px",
              borderRadius: 3,
              marginBottom: 6,
            }}
          >
            Selectie
          </span>
        ) : null}
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
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 7 }}>
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

      {/* Body */}
      <div className="pt-body-pad" style={{ padding: "18px 20px" }}>
        {/* Normaal team of gebundelde selectie */}
        {(team.soort === "team" || (team.soort === "selectie" && team.gebundeld)) && (
          <>
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

        {/* Kennismakingstraining */}
        {team.kennismakingstraining && <KennismakingBlok item={team.kennismakingstraining} />}
      </div>
    </div>
  );
}
