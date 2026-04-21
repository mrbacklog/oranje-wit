"use client";

import { useEffect, useState } from "react";
import { logger } from "@oranje-wit/types";
import { getStafProfiel } from "@/app/(protected)/indeling/werkindeling-actions";
import { WerkitemPanel } from "@/components/WerkitemPanel";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

type StafProfiel = Awaited<ReturnType<typeof getStafProfiel>>;

export interface StafProfielDialogProps {
  stafId: string | null;
  open: boolean;
  onClose: () => void;
  kadersId?: string;
}

// ──────────────────────────────────────────────────────────
// Design tokens
// ──────────────────────────────────────────────────────────

const T = {
  bg0: "#0a0a0a",
  bg1: "#141414",
  bg2: "#1e1e1e",
  bg3: "#262626",
  accent: "#ff6b00",
  accentDim: "rgba(255,107,0,.12)",
  accentBorder: "rgba(255,107,0,.4)",
  text1: "#fafafa",
  text2: "#a3a3a3",
  text3: "#666666",
  textMuted: "#444444",
  border0: "#262626",
  border1: "#3a3a3a",
  warn: "#eab308",
  stafAccent: "#ff8c00",
  stafAccentDim: "rgba(255,140,0,.08)",
  stafAccentBorder: "rgba(255,140,0,.2)",
};

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  paars: "#a855f7",
  grijs: "#6b7280",
  senior: "#94a3b8",
};

// ──────────────────────────────────────────────────────────
// Hulpfuncties
// ──────────────────────────────────────────────────────────

function initialen(naam: string): string {
  return naam
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function dotKleur(kleur: string | null | undefined): string {
  return KLEUR_DOT[(kleur ?? "grijs").toLowerCase()] ?? "#6b7280";
}

// ──────────────────────────────────────────────────────────
// Hoofd-component
// ──────────────────────────────────────────────────────────

export default function StafProfielDialog({
  stafId,
  open,
  onClose,
  kadersId,
}: StafProfielDialogProps) {
  const [profiel, setProfiel] = useState<StafProfiel>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"historie" | "memo">("historie");

  useEffect(() => {
    if (!open || !stafId) {
      setProfiel(null);
      return;
    }
    setLoading(true);
    setActiveTab("historie");
    getStafProfiel(stafId, kadersId)
      .then(setProfiel)
      .catch((err: unknown) => {
        logger.error("StafProfielDialog: fout bij ophalen profiel", err);
      })
      .finally(() => setLoading(false));
  }, [open, stafId, kadersId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const init = profiel ? initialen(profiel.naam) : "??";
  const heeftOpenMemo = (profiel?.memoCount ?? 0) > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      {/* ── Dialog ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={profiel ? `Profiel van ${profiel.naam}` : "Stafprofiel"}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: T.bg1,
          border: `1px solid ${T.border1}`,
          borderRadius: 16,
          width: 480,
          maxWidth: "92vw",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "20px 24px",
            borderBottom: `1px solid ${T.border0}`,
            background: `linear-gradient(160deg, ${T.stafAccentDim} 0%, transparent 60%)`,
            flexShrink: 0,
          }}
        >
          {/* Foto / initialen */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
              background: T.stafAccentDim,
              border: `2px solid ${T.stafAccentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              color: "rgba(255,140,0,.4)",
            }}
          >
            {profiel?.fotoUrl ? (
              <img
                src={profiel.fotoUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 25%",
                  filter: "grayscale(1)",
                }}
              />
            ) : (
              <span>{init}</span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Naam rij */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: T.text1,
                  letterSpacing: "-0.02em",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profiel?.naam ?? "—"}
              </span>

              {/* Memo-icoon (geel als open memos) */}
              {heeftOpenMemo && (
                <span
                  title={`${profiel?.memoCount} open memo('s)`}
                  style={{
                    width: 20,
                    height: 20,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: T.warn,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 3h10l4 4v14H5z" />
                    <path d="M15 3v4h4" />
                    <path d="M8 12h8M8 15h8M8 18h5" />
                  </svg>
                </span>
              )}

              {/* Sluitknop */}
              <button
                onClick={onClose}
                aria-label="Sluiten"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: `1px solid ${T.border1}`,
                  color: T.text3,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                  marginLeft: "auto",
                }}
              >
                ×
              </button>
            </div>

            {/* Rol-badge */}
            {profiel?.rol && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 10px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: T.stafAccent,
                    background: T.stafAccentDim,
                    border: `1px solid ${T.stafAccentBorder}`,
                  }}
                >
                  {profiel.rol}
                </span>
              </div>
            )}

            {/* Koppelingen + speler-badge */}
            {profiel && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {profiel.koppelingen.map((k: any) => (
                  <span
                    key={k.teamId}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 5,
                      fontSize: 11,
                      fontWeight: 500,
                      color: T.text1,
                      background: "rgba(255,255,255,.04)",
                      border: `1px solid ${T.border1}`,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: dotKleur(k.teamKleur),
                        flexShrink: 0,
                      }}
                    />
                    {k.teamNaam}
                    {k.rol && (
                      <span style={{ fontSize: 9, color: T.text3, marginLeft: 2 }}>{k.rol}</span>
                    )}
                  </span>
                ))}

                {profiel.isSpeler && profiel.spelerTeamNaam && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 5,
                      fontSize: 11,
                      fontWeight: 500,
                      color: T.text2,
                      background: "rgba(255,255,255,.03)",
                      border: `1px solid ${T.border1}`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                    </svg>
                    {profiel.spelerTeamNaam}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${T.border0}`,
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          {(["historie", "memo"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "historie" ? "Historie" : "Memo's";
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? T.accent : T.text3,
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  borderBottom: `2px solid ${isActive ? T.accent : "transparent"}`,
                  marginBottom: -1,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {label}
                {tab === "memo" && heeftOpenMemo && (
                  <span style={{ fontSize: 8, color: T.accent }}>▲</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB BODY ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "16px 24px 24px",
            minHeight: 260,
            scrollbarWidth: "thin",
            scrollbarColor: `${T.bg3} transparent`,
          }}
        >
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 120,
                color: T.text3,
                fontSize: 13,
              }}
            >
              Laden...
            </div>
          )}

          {!loading && activeTab === "historie" && (
            <div>
              {/* Sectie-titel */}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: T.textMuted,
                  marginBottom: 8,
                }}
              >
                Seizoenshistorie
                {profiel && profiel.historie.length > 0
                  ? ` · ${profiel.historie.length} seizoen${profiel.historie.length !== 1 ? "en" : ""}`
                  : ""}
              </div>

              {!profiel || profiel.historie.length === 0 ? (
                <div style={{ fontSize: 13, color: T.text3 }}>Geen historiedata beschikbaar</div>
              ) : (
                profiel.historie.map(({ seizoen, items }) => (
                  <div
                    key={seizoen}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: `1px solid ${T.border0}`,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: T.text3,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 65,
                        flexShrink: 0,
                        fontWeight: 600,
                      }}
                    >
                      {seizoen}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{ display: "flex", alignItems: "center", gap: 5, color: T.text2 }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: dotKleur(item.teamKleur),
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ flex: 1, fontSize: 12 }}>{item.teamNaam}</span>
                          {item.rol && (
                            <span
                              style={{
                                fontSize: 10,
                                color: T.text3,
                                marginLeft: "auto",
                              }}
                            >
                              {item.rol}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && activeTab === "memo" && stafId && (
            <WerkitemPanel
              entiteitType="STAF"
              stafId={stafId}
              kadersId={kadersId ?? ""}
              initieleWerkitems={
                (profiel?.werkitems as Array<{
                  id: string;
                  titel: string | null;
                  beschrijving: string;
                  type: string;
                  status: string;
                  prioriteit: string;
                  volgorde: number;
                  resolutie: string | null;
                  createdAt: string;
                }>) ?? []
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
