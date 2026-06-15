/* eslint-disable max-lines -- Publieke teamindeling UI combineert meerdere nauw verwante sub-componenten in één bestand */
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type {
  PubliekeSpeler,
  PubliekeTeamindelingData,
  PubliekTeam,
} from "@/lib/teamindeling/publieke-presentatie";
import type { KennismakingConfig } from "@/lib/teamindeling/kennismakingstraining";
import { slotsVoorTeam } from "@/lib/teamindeling/kennismakingstraining";
import { KennismakingOverzicht, KennismakingTeamSectie } from "./KennismakingOverzicht";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

// ── Helpers ───────────────────────────────────────────────────────────────────

function volleNaam(sp: PubliekeSpeler): string {
  return [sp.roepnaam, sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(" ");
}

function alfa(spelers: PubliekeSpeler[]): PubliekeSpeler[] {
  return [...spelers].sort((a, b) => a.roepnaam.localeCompare(b.roepnaam, "nl"));
}

// ── Kleuren ───────────────────────────────────────────────────────────────────

const C = {
  oranje: "#ff6600",
  geel: "#eab308",
  tekst: "#111827",
  subTekst: "#6b7280",
  border: "#e5e7eb",
  achtergrond: "#f9fafb",
  wit: "#ffffff",
  donker: "#111827",
} as const;

// ── Sub-componenten ───────────────────────────────────────────────────────────

function SpelersKolom({
  titel,
  symbool,
  spelers,
}: {
  titel: string;
  symbool: string;
  spelers: PubliekeSpeler[];
}) {
  if (spelers.length === 0) return null;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.subTekst,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>{symbool}</span> {titel}{" "}
        <span
          style={{
            background: C.achtergrond,
            border: `1px solid ${C.border}`,
            borderRadius: 99,
            padding: "0 6px",
            fontSize: 11,
          }}
        >
          {spelers.length}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alfa(spelers).map((sp, i) => (
          <li
            key={i}
            style={{
              padding: "5px 0",
              borderBottom: i < spelers.length - 1 ? `1px solid ${C.border}` : "none",
              fontSize: 15,
              color: C.tekst,
            }}
          >
            {volleNaam(sp)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StafPills({ staf }: { staf: { naam: string; rol: string }[] }) {
  if (staf.length === 0) return null;
  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.subTekst,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        Staf
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {staf.map((s, i) => (
          <span
            key={i}
            style={{
              background: C.achtergrond,
              border: `1px solid ${C.border}`,
              borderRadius: 99,
              padding: "4px 12px",
              fontSize: 13,
              color: C.tekst,
            }}
          >
            <span style={{ color: C.subTekst }}>{s.rol}</span>
            {s.rol ? " · " : ""}
            {s.naam}
          </span>
        ))}
      </div>
    </div>
  );
}

function SpelersBlok({ dames, heren }: { dames: PubliekeSpeler[]; heren: PubliekeSpeler[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <SpelersKolom titel="Dames" symbool="♀" spelers={dames} />
      <SpelersKolom titel="Heren" symbool="♂" spelers={heren} />
    </div>
  );
}

function TeamKaartHeader({ team, borderKleur }: { team: PubliekTeam; borderKleur: string }) {
  const isSelectie = team.soort === "selectie";
  return (
    <div
      style={{
        background: `linear-gradient(135deg, #1f2937 0%, #111827 100%)`,
        borderBottom: `3px solid ${borderKleur}`,
        padding: "20px 24px",
        borderRadius: "16px 16px 0 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          {isSelectie && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.geel,
                marginBottom: 4,
                display: "block",
              }}
            >
              Selectie
            </span>
          )}
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.wit }}>{team.naam}</h2>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!isSelectie && (
            <>
              {team.dames.length > 0 && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#f3f4f6",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  ♀ {team.dames.length}
                </span>
              )}
              {team.heren.length > 0 && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#f3f4f6",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  ♂ {team.heren.length}
                </span>
              )}
            </>
          )}
          {isSelectie &&
            (team.uitkomstTeams.length > 0
              ? team.uitkomstTeams
              : team.subteams.map((s) => s.naam)
            ).map((naam, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(234,179,8,0.15)",
                  color: C.geel,
                  border: `1px solid rgba(234,179,8,0.3)`,
                  borderRadius: 99,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                → {naam}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

function InfoBanner({ gebundeld }: { gebundeld: boolean }) {
  return (
    <div
      style={{
        background: "rgba(234,179,8,0.08)",
        border: `1px solid rgba(234,179,8,0.3)`,
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 20,
        fontSize: 13,
        color: "#92400e",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 16 }}>ℹ️</span>
      <span>
        {gebundeld
          ? "Uit deze gecombineerde pool worden de teams gevormd. De definitieve verdeling volgt later."
          : "De verdeling over de onderstaande teams is voorlopig en kan nog wijzigen."}
      </span>
    </div>
  );
}

function TeamKaart({
  team,
  kennismaking,
}: {
  team: PubliekTeam;
  kennismaking: KennismakingConfig | null;
}) {
  const borderKleur = team.soort === "selectie" ? C.geel : C.oranje;
  const kennismakingTeam = kennismaking?.teams.find(
    (t) => t.naam.toLowerCase() === team.naam.toLowerCase()
  );
  const dagSlots = kennismaking && kennismakingTeam ? slotsVoorTeam(kennismaking, team.naam) : [];

  return (
    <div
      style={{
        background: C.wit,
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        overflow: "hidden",
        marginBottom: 80,
      }}
    >
      <TeamKaartHeader team={team} borderKleur={borderKleur} />
      <div style={{ padding: 24 }}>
        {team.soort === "selectie" && <InfoBanner gebundeld={team.gebundeld} />}

        {(team.soort === "team" || (team.soort === "selectie" && team.gebundeld)) && (
          <>
            <SpelersBlok dames={team.dames} heren={team.heren} />
            <StafPills staf={team.staf} />
          </>
        )}

        {team.soort === "selectie" && !team.gebundeld && (
          <div>
            {team.subteams.map((sub, i) => (
              <div key={i}>
                {i > 0 && (
                  <hr
                    style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "20px 0" }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: C.geel,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 15, color: C.tekst }}>{sub.naam}</span>
                </div>
                <SpelersBlok dames={sub.dames} heren={sub.heren} />
                {sub.staf.length > 0 && <StafPills staf={sub.staf} />}
              </div>
            ))}
          </div>
        )}

        {kennismakingTeam && dagSlots.length > 0 && (
          <KennismakingTeamSectie dagSlots={dagSlots} duurMinuten={kennismakingTeam.duurMinuten} />
        )}
      </div>
    </div>
  );
}

// ── Zoekoverlay ───────────────────────────────────────────────────────────────

type ZoekResultaat = {
  naam: string;
  teamnaam: string;
  teamIdx: number;
  isSelectie: boolean;
};

function ZoekOverlay({
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resultaten: ZoekResultaat[] = [];
  const q = query.trim().toLowerCase();

  if (q.length >= 1) {
    teams.forEach((team, teamIdx) => {
      const directeSpelers = [
        ...team.dames.map((sp) => ({ sp, teamnaam: team.naam })),
        ...team.heren.map((sp) => ({ sp, teamnaam: team.naam })),
      ];
      for (const { sp, teamnaam } of directeSpelers) {
        const naam = volleNaam(sp);
        if (naam.toLowerCase().includes(q)) {
          resultaten.push({ naam, teamnaam, teamIdx, isSelectie: team.soort === "selectie" });
        }
      }
      for (const sub of team.subteams) {
        const subSpelers = [...sub.dames, ...sub.heren];
        for (const sp of subSpelers) {
          const naam = volleNaam(sp);
          if (naam.toLowerCase().includes(q)) {
            resultaten.push({
              naam,
              teamnaam: `${team.naam} → ${sub.naam}`,
              teamIdx,
              isSelectie: true,
            });
          }
        }
      }
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
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 60,
      }}
      onClick={onSluit}
    >
      <div
        style={{
          background: C.wit,
          borderRadius: 16,
          width: "min(560px, calc(100vw - 32px))",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 16px 0" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op naam…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 16px",
              border: `2px solid ${C.oranje}`,
              borderRadius: 8,
              fontSize: 16,
              outline: "none",
              color: C.tekst,
            }}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
          {q.length === 0 && (
            <div
              style={{ padding: "20px 16px", color: C.subTekst, fontSize: 14, textAlign: "center" }}
            >
              Typ een naam om te zoeken
            </div>
          )}
          {q.length > 0 && uniek.length === 0 && (
            <div
              style={{ padding: "20px 16px", color: C.subTekst, fontSize: 14, textAlign: "center" }}
            >
              Geen resultaten gevonden
            </div>
          )}
          {uniek.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onKiesTeam(r.teamIdx);
                onSluit();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.achtergrond)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: r.isSelectie ? C.geel : C.oranje,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 500, fontSize: 15, color: C.tekst }}>{r.naam}</div>
                <div style={{ fontSize: 12, color: C.subTekst }}>{r.teamnaam}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Toelichting pagina ────────────────────────────────────────────────────────

function ToelichtingPagina({
  toelichting,
  onGaNaar,
  kennismaking,
}: {
  toelichting: PubliekeTeamindelingData["toelichting"];
  onGaNaar: () => void;
  kennismaking: KennismakingConfig | null;
}) {
  return (
    <div style={{ minHeight: "100vh", background: C.achtergrond }}>
      <div
        style={{
          background: "linear-gradient(135deg, #111827 0%, #1a0e00 100%)",
          borderBottom: `3px solid ${C.oranje}`,
          padding: "32px 24px 40px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Image
            src={LOGO_URL}
            alt="c.k.v. Oranje Wit 100 jaar"
            width={160}
            height={44}
            style={{ width: "auto", height: 44, display: "block", marginBottom: 20 }}
            unoptimized
          />
          {toelichting && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.oranje,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              {toelichting.seizoenLabel}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.wit, lineHeight: 1.2 }}>
            Teamindeling{" "}
            {toelichting && <span style={{ color: C.oranje }}>{toelichting.seizoenLabel}</span>}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            background: C.wit,
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            padding: "32px 32px",
          }}
        >
          {toelichting ? (
            <>
              {/* Inhoud komt uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */}
              <div
                style={{ fontSize: 16, lineHeight: 1.7, color: C.tekst, marginBottom: 24 }}
                dangerouslySetInnerHTML={{ __html: toelichting.introTekst }}
              />
              {/* Inhoud komt uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */}
              <div
                style={{ fontSize: 16, lineHeight: 1.7, color: C.tekst, marginBottom: 28 }}
                dangerouslySetInnerHTML={{ __html: toelichting.tcTekst }}
              />
            </>
          ) : (
            <p style={{ fontSize: 16, color: C.subTekst, marginBottom: 28 }}>
              De toelichting bij de teamindeling is nog niet beschikbaar.
            </p>
          )}
          <div
            style={{
              fontSize: 14,
              color: C.subTekst,
              fontStyle: "italic",
              marginBottom: 32,
            }}
          >
            — De Technische Commissie, c.k.v. Oranje Wit
          </div>
          <button
            onClick={onGaNaar}
            style={{
              background: C.oranje,
              color: C.wit,
              border: "none",
              borderRadius: 10,
              padding: "14px 28px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Ga naar de teamindeling →
          </button>
        </div>
      </div>

      {kennismaking && kennismaking.beschikbaarheid.length > 0 && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 40px" }}>
          <KennismakingOverzicht config={kennismaking} />
        </div>
      )}
    </div>
  );
}

// ── Hoofd-component ───────────────────────────────────────────────────────────

export function PubliekeTeamindeling({
  data,
  kennismaking,
}: {
  data: PubliekeTeamindelingData;
  kennismaking: KennismakingConfig | null;
}) {
  const [pagina, setPagina] = useState<"toelichting" | "indeling">("toelichting");
  const [teamIdx, setTeamIdx] = useState(0);
  const [zoekOpen, setZoekOpen] = useState(false);

  const teams = data.teams;
  const huidigTeam = teams[teamIdx];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (zoekOpen) {
        if (e.key === "Escape") setZoekOpen(false);
        return;
      }
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setZoekOpen(true);
        return;
      }
      if (pagina !== "indeling") return;
      if (e.key === "ArrowRight") setTeamIdx((i) => Math.min(i + 1, teams.length - 1));
      if (e.key === "ArrowLeft") setTeamIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pagina, teams.length, zoekOpen]);

  if (pagina === "toelichting") {
    return (
      <>
        <ToelichtingPagina
          toelichting={data.toelichting}
          onGaNaar={() => setPagina("indeling")}
          kennismaking={kennismaking}
        />
        {zoekOpen && (
          <ZoekOverlay
            teams={teams}
            onSluit={() => setZoekOpen(false)}
            onKiesTeam={(idx) => {
              setTeamIdx(idx);
              setPagina("indeling");
            }}
          />
        )}
      </>
    );
  }

  const voortgang = teams.length > 0 ? ((teamIdx + 1) / teams.length) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: C.achtergrond }}>
      {/* Voortgangsbalk */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 3,
          background: C.border,
        }}
      >
        <div
          style={{
            height: "100%",
            background: C.oranje,
            width: `${voortgang}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 3,
          zIndex: 40,
          background: C.wit,
          borderBottom: `1px solid ${C.border}`,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src={LOGO_URL}
            alt="c.k.v. Oranje Wit 100 jaar"
            width={160}
            height={44}
            style={{ width: "auto", height: 44, display: "block" }}
            unoptimized
          />
          {data.toelichting && (
            <span style={{ fontSize: 13, color: C.subTekst, fontWeight: 500 }}>
              {data.toelichting.seizoenLabel}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPagina("toelichting")}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              cursor: "pointer",
              color: C.tekst,
            }}
          >
            Toelichting
          </button>
          <button
            onClick={() => setZoekOpen(true)}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              cursor: "pointer",
              color: C.tekst,
            }}
          >
            🔍 Zoek naam
          </button>
        </div>
      </div>

      {/* Team-kaart */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
        {huidigTeam ? (
          <TeamKaart team={huidigTeam} kennismaking={kennismaking} />
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: C.subTekst }}>
            Geen teams beschikbaar
          </div>
        )}
      </div>

      {/* Vaste nav-footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: C.wit,
          borderTop: `1px solid ${C.border}`,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          onClick={() => setTeamIdx((i) => Math.max(i - 1, 0))}
          disabled={teamIdx === 0}
          style={{
            background: teamIdx === 0 ? C.achtergrond : C.oranje,
            color: teamIdx === 0 ? C.subTekst : C.wit,
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: teamIdx === 0 ? "default" : "pointer",
            opacity: teamIdx === 0 ? 0.5 : 1,
          }}
        >
          ← Vorig
        </button>

        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div style={{ fontSize: 12, color: C.subTekst, marginBottom: 4 }}>
            {teamIdx + 1} / {teams.length}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.tekst,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: 6,
            }}
          >
            {huidigTeam?.naam ?? ""}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
            {teams.map((t, i) => (
              <button
                key={i}
                onClick={() => setTeamIdx(i)}
                title={t.naam}
                style={{
                  width: i === teamIdx ? 16 : 8,
                  height: 8,
                  borderRadius: 99,
                  border: "none",
                  cursor: "pointer",
                  background:
                    i === teamIdx
                      ? t.soort === "selectie"
                        ? C.geel
                        : C.oranje
                      : t.soort === "selectie"
                        ? "rgba(234,179,8,0.3)"
                        : C.border,
                  padding: 0,
                  transition: "width 0.2s ease, background 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setTeamIdx((i) => Math.min(i + 1, teams.length - 1))}
          disabled={teamIdx === teams.length - 1}
          style={{
            background: teamIdx === teams.length - 1 ? C.achtergrond : C.oranje,
            color: teamIdx === teams.length - 1 ? C.subTekst : C.wit,
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: teamIdx === teams.length - 1 ? "default" : "pointer",
            opacity: teamIdx === teams.length - 1 ? 0.5 : 1,
          }}
        >
          Volgend →
        </button>
      </div>

      {zoekOpen && (
        <ZoekOverlay
          teams={teams}
          onSluit={() => setZoekOpen(false)}
          onKiesTeam={(idx) => {
            setTeamIdx(idx);
            setZoekOpen(false);
          }}
        />
      )}
    </div>
  );
}
