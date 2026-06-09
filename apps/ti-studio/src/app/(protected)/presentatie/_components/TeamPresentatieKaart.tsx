"use client";
/**
 * TeamPresentatieKaart — read-only presentatiekaart, gespiegeld op werkbord-TeamKaart.
 *
 * Kolom-layout per kaarttype:
 *   soort="team", teamType="viertal"    → 1 kolom (dames boven, heren onder)
 *   soort="team", teamType="achttal"    → 2 kolommen: Dames | Heren
 *   soort="selectie", gebundeld=true    → 2 kolommen: Dames | Heren (gepoolde spelers)
 *   soort="selectie", gebundeld=false   → per lidteam een blok met teamnaam-kopje
 *
 * Geen fidelity-verschil in inhoud — center en side tonen exact hetzelfde.
 * De visuele schaal wordt uitsluitend door Swiper/coverflow geregeld.
 */
import type { PresentatieTeam } from "../presentatie-types";
import { KNKV_KLEUR, bouwSubtitel } from "./knkv-kleur";
import { StafPresentatieLijst } from "./StafPresentatieLijst";
import { ViertalLayout, TweeKolommenLayout, OngecombineerdLayout } from "./presentatie-layouts";

// ── Kaartbreedtes (px) ──────────────────────────────────────────────────────

export const KAART_BREEDTE_VIERTAL = 320;
export const KAART_BREEDTE_ACHTTAL = 560;
export const KAART_BREEDTE_SELECTIE = 820;

export function kaartBreedte(team: PresentatieTeam): number {
  if (team.soort === "selectie") return KAART_BREEDTE_SELECTIE;
  if (team.teamType === "viertal") return KAART_BREEDTE_VIERTAL;
  return KAART_BREEDTE_ACHTTAL;
}

const HEADER_HOOGTE = 88;

function formatDatum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

// ── Hoofdcomponent ──────────────────────────────────────────────────────────

interface TeamPresentatieKaartProps {
  team: PresentatieTeam;
  peildatum: Date;
}

export function TeamPresentatieKaart({ team, peildatum }: TeamPresentatieKaartProps) {
  const kleurCss = KNKV_KLEUR[team.kleur ?? ""] ?? "var(--cat-senior)";
  const subtitel = bouwSubtitel(team);
  const breedte = kaartBreedte(team);
  const heeftSpelers = team.aantalDames + team.aantalHeren > 0;
  const heeftOpmerkingen = team.opmerkingen.length > 0;

  return (
    <div
      style={{
        width: breedte,
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-1)",
        border: "1px solid var(--border-0)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 18px 50px rgba(0,0,0,.55)",
        flexShrink: 0,
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Kleurband links — 4px (gespiegeld werkbord) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: kleurCss,
          zIndex: 1,
        }}
      />

      {/* ── HEADER ── */}
      <div
        style={{
          height: HEADER_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px 0 20px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Categorie-driehoek rechtsboven — 56×56px (gespiegeld werkbord) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "0 56px 56px 0",
            borderColor: `transparent ${kleurCss} transparent transparent`,
            zIndex: 2,
          }}
        />

        {/* Naam + subtitel */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--text-1)",
              paddingLeft: 4,
              paddingRight: 56,
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
                style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}
                title={`${team.openMemoCount} open memo's`}
              >
                ▲ {team.openMemoCount}
              </span>
            )}
          </div>
          {subtitel && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: 3,
                paddingLeft: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitel}
            </div>
          )}
        </div>

        {/* Meta-pills: ♀ / ♂ tellers + gem. leeftijd + validaties */}
        <div style={{ display: "flex", gap: 5, flexShrink: 0, zIndex: 2 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 13,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 7,
              background: "rgba(236,72,153,.12)",
              color: "var(--pink)",
            }}
          >
            ♀ {team.aantalDames}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 13,
              fontWeight: 700,
              padding: "4px 10px",
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
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 7,
                background: "rgba(255,255,255,.05)",
                color: "var(--text-2)",
              }}
            >
              {team.gemiddeldeLeeftijd.toFixed(1)}j
            </span>
          )}
          {team.validatieCount > 0 && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 10px",
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

      {/* ── BODY (scrollbaar) ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!heeftSpelers ? (
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
        ) : team.soort === "selectie" && !team.gebundeld ? (
          <OngecombineerdLayout leden={team.leden} peildatum={peildatum} />
        ) : team.soort === "selectie" && team.gebundeld ? (
          <TweeKolommenLayout dames={team.dames} heren={team.heren} peildatum={peildatum} />
        ) : team.teamType === "viertal" ? (
          <ViertalLayout dames={team.dames} heren={team.heren} peildatum={peildatum} />
        ) : (
          <TweeKolommenLayout dames={team.dames} heren={team.heren} peildatum={peildatum} />
        )}

        {/* Opmerkingen */}
        {heeftOpmerkingen && (
          <div
            style={{
              margin: "12px 16px 14px",
              borderTop: "1px solid var(--border-0)",
              paddingTop: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
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
                  padding: "8px 12px",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 3 }}>
                  {op.bron} · {op.type} · {formatDatum(op.datum)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.4 }}>
                  {op.tekst}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER: aanwezige staf (geen lege slots) ── */}
      <StafPresentatieLijst staf={team.staf} />
    </div>
  );
}
