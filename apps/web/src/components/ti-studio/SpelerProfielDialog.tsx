"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSpelerProfiel,
  updateSpelerNotitie,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions";
import { logger } from "@oranje-wit/types";

type SpelerProfiel = Awaited<ReturnType<typeof getSpelerProfiel>>;

interface SpelerProfielDialogProps {
  spelerId: string | null;
  open: boolean;
  onClose: () => void;
}

type SpelerspadItem = {
  seizoen?: string;
  team?: string;
  kleur?: string;
  niveau?: string;
  spelvorm?: string;
  categorie?: string;
};

const STATUSSEN = ["beschikbaar", "twijfelt", "gaat_stoppen", "nieuw"] as const;

const STATUS_KLEUR: Record<string, { bg: string; text: string }> = {
  beschikbaar: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
  twijfelt: { bg: "rgba(234,179,8,0.12)", text: "#facc15" },
  gaat_stoppen: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
  nieuw: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
};

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  paars: "#a855f7",
};

function leeftijdGradient(geboortejaar: number | null | undefined): string {
  if (!geboortejaar) return "linear-gradient(135deg, #374151 0%, #1f2937 100%)";
  const huidigJaar = new Date().getFullYear();
  const leeftijd = huidigJaar - geboortejaar;
  if (leeftijd <= 8) return "linear-gradient(135deg, #2478cc 0%, #2d9d5e 100%)";
  if (leeftijd === 9) return "linear-gradient(135deg, #22c55e 0%, #a3c928 100%)";
  if (leeftijd <= 12) return "linear-gradient(135deg, #f0c024 0%, #f09030 100%)";
  if (leeftijd <= 15) return "linear-gradient(135deg, #f07830 0%, #e8c020 100%)";
  if (leeftijd <= 18) return "linear-gradient(135deg, #e85518 0%, #cc2222 100%)";
  return "linear-gradient(135deg, #374151 0%, #1f2937 100%)";
}

function initialen(
  roepnaam: string | null | undefined,
  achternaam: string | null | undefined
): string {
  const v = (roepnaam ?? "").trim().charAt(0).toUpperCase();
  const a = (achternaam ?? "").trim().charAt(0).toUpperCase();
  return `${v}${a}`.trim() || "??";
}

export default function SpelerProfielDialog({ spelerId, open, onClose }: SpelerProfielDialogProps) {
  const [profiel, setProfiel] = useState<SpelerProfiel>(null);
  const [loading, setLoading] = useState(false);
  const [notitie, setNotitie] = useState("");
  const [opslaanBezig, setOpslaanBezig] = useState(false);
  const [huidigStatus, setHuidigStatus] = useState<string>("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !spelerId) {
      setProfiel(null);
      return;
    }
    setLoading(true);
    getSpelerProfiel(spelerId)
      .then((data) => {
        setProfiel(data);
        setHuidigStatus(data?.status ?? "beschikbaar");
        setNotitie("");
      })
      .catch((err: unknown) => {
        logger.error("SpelerProfielDialog: fout bij ophalen profiel", err);
      })
      .finally(() => setLoading(false));
  }, [open, spelerId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const spelerspad: SpelerspadItem[] = Array.isArray(profiel?.spelerspad)
    ? (profiel.spelerspad as SpelerspadItem[])
    : [];

  const huidigJaar = new Date().getFullYear();
  const leeftijd = profiel?.geboortejaar ? huidigJaar - profiel.geboortejaar : null;
  const seizoenenActief = spelerspad.length;

  function cycleerStatus() {
    const idx = STATUSSEN.indexOf(huidigStatus as (typeof STATUSSEN)[number]);
    const volgend = STATUSSEN[(idx + 1) % STATUSSEN.length];
    setHuidigStatus(volgend);
  }

  async function slaNotitieOp() {
    if (!spelerId) return;
    setOpslaanBezig(true);
    try {
      await updateSpelerNotitie(spelerId, notitie);
    } catch (err) {
      logger.error("SpelerProfielDialog: fout bij opslaan notitie", err);
    } finally {
      setOpslaanBezig(false);
    }
  }

  const statusKleur = STATUS_KLEUR[huidigStatus] ?? STATUS_KLEUR.beschikbaar;
  const gradient = leeftijdGradient(profiel?.geboortejaar);
  const init = initialen(profiel?.roepnaam, profiel?.achternaam);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          profiel ? `Profiel van ${profiel.roepnaam} ${profiel.achternaam}` : "Spelersprofiel"
        }
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--surface-raised)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          width: "min(90vw, 720px)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Sluitknop */}
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "1.5rem",
            cursor: "pointer",
            lineHeight: 1,
            padding: "0.25rem 0.5rem",
            borderRadius: 6,
          }}
        >
          ×
        </button>

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
            }}
          >
            Laden...
          </div>
        )}

        {!loading && profiel && (
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {/* LINKS: Mini spelerskaart */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  width: 200,
                  height: 280,
                  borderRadius: 14,
                  background: gradient,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  border: "2px solid rgba(255,255,255,0.12)",
                }}
              >
                {/* Schild-shape met initialen */}
                <div
                  style={{
                    position: "absolute",
                    top: "18%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 80,
                    height: 90,
                    background: "rgba(0,0,0,0.32)",
                    backdropFilter: "blur(4px)",
                    clipPath:
                      "polygon(50% 0%, 100% 12%, 100% 65%, 75% 85%, 50% 100%, 25% 85%, 0% 65%, 0% 12%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "0.05em",
                      marginTop: 4,
                    }}
                  >
                    {init}
                  </span>
                </div>

                {/* Geslacht badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background:
                      profiel.geslacht === "V" ? "rgba(236,72,153,0.25)" : "rgba(59,130,246,0.25)",
                    borderRadius: 99,
                    padding: "0.15rem 0.4rem",
                    fontSize: "0.75rem",
                    color: profiel.geslacht === "V" ? "#f9a8d4" : "#93c5fd",
                    fontWeight: 700,
                  }}
                >
                  {profiel.geslacht === "V" ? "♀" : "♂"}
                </div>

                {/* Naam onderaan */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(10px)",
                    padding: "0.5rem 0.625rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "#fff",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {profiel.roepnaam}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {profiel.achternaam}
                  </div>
                </div>

                {/* Info pills: leeftijd + seizoenen */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    left: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  {leeftijd !== null && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        background: "rgba(0,0,0,0.32)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        padding: "0.15rem 0.4rem",
                        borderRadius: 4,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {leeftijd} jr
                    </span>
                  )}
                  {seizoenenActief > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        background: "rgba(0,0,0,0.32)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        padding: "0.15rem 0.4rem",
                        borderRadius: 4,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {seizoenenActief} sez.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* RECHTS: Spelersdata */}
            <div
              style={{
                flex: 1,
                minWidth: 240,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Naam + status */}
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  {profiel.roepnaam} {profiel.achternaam}
                </h2>
                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {/* Status badge — klikbaar */}
                  <button
                    onClick={cycleerStatus}
                    title="Klik om status te wijzigen"
                    style={{
                      background: statusKleur.bg,
                      color: statusKleur.text,
                      border: "none",
                      borderRadius: 99,
                      padding: "0.25rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: statusKleur.text,
                        display: "inline-block",
                      }}
                    />
                    {huidigStatus.replace("_", " ")}
                  </button>
                  {leeftijd !== null && (
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {leeftijd} jaar
                    </span>
                  )}
                  {profiel.geboortejaar && (
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      ({profiel.geboortejaar})
                    </span>
                  )}
                </div>
              </div>

              {/* Statistieken */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {leeftijd !== null && (
                  <div>
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                      }}
                    >
                      Leeftijd
                    </div>
                    <div
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {leeftijd} jr
                    </div>
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    Seizoenen
                  </div>
                  <div
                    style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}
                  >
                    {seizoenenActief}
                  </div>
                </div>
                {profiel.rating !== null && profiel.rating !== undefined && (
                  <div>
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                      }}
                    >
                      Rating
                    </div>
                    <div
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "var(--ow-oranje-500, #ff6b00)",
                      }}
                    >
                      {profiel.rating}
                    </div>
                  </div>
                )}
              </div>

              {/* Spelerspad tijdlijn */}
              {spelerspad.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Spelerspad
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {spelerspad.map((item, i) => {
                      const dotKleur = item.kleur ? KLEUR_DOT[item.kleur.toLowerCase()] : "#6b7280";
                      return (
                        <span
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "var(--surface-card)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 6,
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.75rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: dotKleur,
                              flexShrink: 0,
                            }}
                          />
                          {item.seizoen && (
                            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                              {item.seizoen}
                            </span>
                          )}
                          {item.team && <span style={{ fontWeight: 500 }}>{item.team}</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Memo veld */}
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-secondary)",
                    marginBottom: "0.375rem",
                  }}
                >
                  Notitie
                </div>
                <textarea
                  value={notitie}
                  onChange={(e) => setNotitie(e.target.value)}
                  placeholder="Voeg een notitie toe..."
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    padding: "0.5rem 0.625rem",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.375rem" }}>
                  <button
                    onClick={slaNotitieOp}
                    disabled={opslaanBezig}
                    style={{
                      background: "var(--ow-oranje-500, #ff6b00)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.375rem 0.875rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: opslaanBezig ? "not-allowed" : "pointer",
                      opacity: opslaanBezig ? 0.6 : 1,
                    }}
                  >
                    {opslaanBezig ? "Opslaan..." : "Opslaan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !profiel && spelerId && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
            }}
          >
            Speler niet gevonden.
          </div>
        )}
      </div>
    </div>
  );
}
