"use client";
import type { PresentatieTeam } from "../presentatie-types";
import { KNKV_KLEUR, bouwSubtitel } from "./knkv-kleur";
import { SpelerPresentatieRij } from "./SpelerPresentatieRij";
import { StafPresentatieLijst } from "./StafPresentatieLijst";

interface TeamPresentatieKaartProps {
  team: PresentatieTeam;
  peildatum: Date;
  fidelity: "center" | "side";
}

function formatDatum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export function TeamPresentatieKaart({ team, peildatum, fidelity }: TeamPresentatieKaartProps) {
  const kleurCss = KNKV_KLEUR[team.kleur ?? ""] ?? "var(--cat-senior)";
  const subtitel = bouwSubtitel(team);
  const isCenter = fidelity === "center";

  // Bij center: alle spelers; bij side: maximaal 5 per geslacht
  const damesVis = isCenter ? team.dames : team.dames.slice(0, 5);
  const herenVis = isCenter ? team.heren : team.heren.slice(0, 5);

  const heeftOpmerkingen = isCenter && team.opmerkingen.length > 0;
  const heeftSpelers = team.aantalDames + team.aantalHeren > 0;

  return (
    <div
      style={{
        width: isCenter ? 580 : 440,
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-1)",
        border: isCenter ? `1px solid rgba(255,133,51,.22)` : "1px solid var(--border-0)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: isCenter
          ? "0 30px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,133,51,.22)"
          : "0 18px 50px rgba(0,0,0,.55)",
        opacity: isCenter ? 1 : 0.85,
        transition: "all .45s cubic-bezier(.22,1,.36,1)",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          position: "relative",
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {/* Kleurstrip links */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: kleurCss,
          }}
        />

        {/* Categorie-driehoek rechtsboven */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "0 40px 40px 0",
            borderColor: `transparent ${kleurCss} transparent transparent`,
          }}
        />

        {/* Naam */}
        <div
          style={{
            fontSize: isCenter ? 26 : 18,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "var(--text-1)",
            paddingLeft: 6,
            paddingRight: 40,
            lineHeight: 1.15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {team.naam}
          </span>
          {team.openMemoCount > 0 && (
            <span
              style={{
                fontSize: isCenter ? 14 : 11,
                color: "var(--accent)",
                fontWeight: 700,
                flexShrink: 0,
              }}
              title={`${team.openMemoCount} open memo's`}
            >
              ▲ {team.openMemoCount}
            </span>
          )}
        </div>

        {/* Subtitel */}
        {subtitel && (
          <div
            style={{
              fontSize: 9,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: 4,
              paddingLeft: 6,
            }}
          >
            {subtitel}
          </div>
        )}

        {/* Meta-pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 11,
            flexWrap: "wrap",
            paddingLeft: 6,
          }}
        >
          <span
            style={{
              fontSize: isCenter ? 13 : 11,
              fontWeight: 700,
              padding: isCenter ? "5px 11px" : "3px 8px",
              borderRadius: 7,
              background: "rgba(236,72,153,.12)",
              color: "var(--pink)",
            }}
          >
            ♀ {team.aantalDames}
          </span>
          <span
            style={{
              fontSize: isCenter ? 13 : 11,
              fontWeight: 700,
              padding: isCenter ? "5px 11px" : "3px 8px",
              borderRadius: 7,
              background: "rgba(96,165,250,.12)",
              color: "var(--blue)",
            }}
          >
            ♂ {team.aantalHeren}
          </span>
          {team.gemiddeldeLeeftijd !== null && (
            <span
              style={{
                fontSize: isCenter ? 13 : 11,
                fontWeight: 700,
                padding: isCenter ? "5px 11px" : "3px 8px",
                borderRadius: 7,
                background: "rgba(255,255,255,.05)",
                color: "var(--text-2)",
              }}
            >
              Gem. {team.gemiddeldeLeeftijd.toFixed(1)}j
            </span>
          )}
          {team.validatieCount > 0 && (
            <span
              style={{
                fontSize: isCenter ? 13 : 11,
                fontWeight: 700,
                padding: isCenter ? "5px 11px" : "3px 8px",
                borderRadius: 7,
                background: "rgba(234,179,8,.10)",
                color: "var(--warn)",
              }}
            >
              ⚠ {team.validatieCount}
            </span>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        style={{
          padding: "14px 20px",
          flex: 1,
          minHeight: 0,
          overflowY: isCenter ? "auto" : "hidden",
        }}
      >
        {isCenter && !heeftSpelers ? (
          <div
            style={{
              padding: "28px 0",
              textAlign: "center",
              color: "var(--text-3)",
              fontSize: 13,
            }}
          >
            Nog geen spelers ingedeeld
          </div>
        ) : isCenter ? (
          /* Center: 2 kolommen Dames | Heren */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {/* Dames */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-3)",
                  marginBottom: 6,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Dames</span>
                <span>{team.aantalDames}</span>
              </div>
              {damesVis.map((sp) => (
                <SpelerPresentatieRij
                  key={sp.relCode}
                  speler={sp}
                  peildatum={peildatum}
                  fidelity="center"
                />
              ))}
            </div>
            {/* Heren */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-3)",
                  marginBottom: 6,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Heren</span>
                <span>{team.aantalHeren}</span>
              </div>
              {herenVis.map((sp) => (
                <SpelerPresentatieRij
                  key={sp.relCode}
                  speler={sp}
                  peildatum={peildatum}
                  fidelity="center"
                />
              ))}
            </div>
          </div>
        ) : (
          /* Side: 1 kolom, beknopt (max 3 per geslacht) */
          <div>
            {damesVis.map((sp) => (
              <SpelerPresentatieRij
                key={sp.relCode}
                speler={sp}
                peildatum={peildatum}
                fidelity="side"
              />
            ))}
            {herenVis.map((sp) => (
              <SpelerPresentatieRij
                key={sp.relCode}
                speler={sp}
                peildatum={peildatum}
                fidelity="side"
              />
            ))}
            {team.aantalDames + team.aantalHeren > 10 && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-3)",
                  textAlign: "center",
                  paddingTop: 4,
                }}
              >
                + {team.aantalDames + team.aantalHeren - 10} meer
              </div>
            )}
          </div>
        )}

        {/* Opmerkingen — alleen center */}
        {heeftOpmerkingen && (
          <div
            style={{
              marginTop: 14,
              borderTop: "1px solid var(--border-0)",
              paddingTop: 11,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--accent-h)",
                marginBottom: 8,
              }}
            >
              Opmerkingen
            </div>
            {team.opmerkingen.map((op, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-0)",
                  borderLeft: "3px solid var(--accent)",
                  borderRadius: 7,
                  padding: "9px 13px",
                  marginBottom: 7,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-3)",
                    marginBottom: 3,
                  }}
                >
                  {op.bron} · {op.type} · {formatDatum(op.datum)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-1)",
                    lineHeight: 1.4,
                  }}
                >
                  {op.tekst}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER: 8 gereserveerde staf-plaatsen ── */}
      <StafPresentatieLijst staf={team.staf} fidelity={fidelity} />
    </div>
  );
}
