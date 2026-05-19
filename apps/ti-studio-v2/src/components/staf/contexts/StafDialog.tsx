"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  StafRijData,
  SpelerWerkitemDetail,
  StafSeizoenHistorie,
} from "@/components/personen/types";
import { SpelerAvatar } from "@/components/shared/SpelerAvatar";
import { logger } from "@oranje-wit/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

type TabId = "historie" | "memo";

function formatDatum(datum: Date): string {
  const nu = new Date();
  const diff = nu.getTime() - new Date(datum).getTime();
  const dagen = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dagen === 0) return "vandaag";
  if (dagen === 1) return "gisteren";
  if (dagen < 30) return `${dagen}d geleden`;
  const maanden = Math.floor(dagen / 30);
  if (maanden < 12) return `${maanden}mnd geleden`;
  return new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function werkitemStatusDot(status: string): string {
  switch (status) {
    case "OPEN":
      return "#eab308";
    case "IN_BESPREKING":
      return "#60a5fa";
    case "OPGELOST":
      return "#22c55e";
    case "RISICO":
      return "#ef4444";
    default:
      return "var(--text-tertiary)";
  }
}

function prioBadgeStijl(prioriteit: string): { bg: string; label: string } {
  switch (prioriteit.toUpperCase()) {
    case "HOOG":
      return { bg: "#f97316", label: "H" };
    case "MIDDEL":
      return { bg: "#eab308", label: "M" };
    case "LAAG":
      return { bg: "#3b82f6", label: "L" };
    default:
      return { bg: "var(--text-tertiary)", label: "?" };
  }
}

function dotKleur(kleur: string | null): string {
  if (!kleur) return "var(--cat-senior)";
  const map: Record<string, string> = {
    rood: "var(--cat-rood)",
    oranje: "var(--cat-oranje)",
    geel: "var(--cat-geel)",
    groen: "var(--cat-groen)",
    blauw: "var(--cat-blauw)",
    senior: "var(--cat-senior)",
    senioren: "var(--cat-senior)",
  };
  return map[kleur.toLowerCase()] ?? "var(--cat-senior)";
}

// ── Component ────────────────────────────────────────────────────────────────

interface StafDialogProps {
  staflid: StafRijData;
  open: boolean;
  onClose: () => void;
}

export function StafDialog({ staflid, open, onClose }: StafDialogProps) {
  const [actieveTab, setActieveTab] = useState<TabId>("historie");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset tab bij nieuw staflid
  useEffect(() => {
    if (open) setActieveTab("historie");
  }, [open, staflid.id]);

  // Escape sluit
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Focus bij open
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const eersteRol = staflid.rollen[0] ?? "Geen rol";
  const seizoenshistorie: StafSeizoenHistorie[] = staflid.seizoenshistorie ?? [];
  const werkitems: SpelerWerkitemDetail[] = (staflid.werkitemsDetail ?? []).slice().sort((a, b) => {
    // OPEN eerst
    const volgorde = ["OPEN", "IN_BESPREKING", "RISICO", "OPGELOST"];
    return volgorde.indexOf(a.status) - volgorde.indexOf(b.status);
  });

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          zIndex: 10000,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Staflid: ${staflid.naam}`}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          maxWidth: "calc(96vw)",
          maxHeight: "calc(96vh)",
          background: "var(--surface-page)",
          border: "1px solid var(--border-light)",
          borderRadius: 16,
          boxShadow: "0 24px 80px rgba(0,0,0,.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
          zIndex: 10001,
          outline: "none",
        }}
      >
        {/* ─── Header ─── */}
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-light)",
            background: "linear-gradient(160deg, rgba(255,140,0,.04) 0%, transparent 60%)",
            flexShrink: 0,
          }}
        >
          {/* Foto / avatar */}
          {staflid.relCode ? (
            <SpelerAvatar
              relCode={staflid.relCode}
              roepnaam={staflid.naam.split(" ")[0] ?? staflid.naam}
              achternaam={staflid.naam.split(" ").slice(-1)[0] ?? ""}
              size="lg"
              style={{
                width: 80,
                height: 80,
                borderRadius: 6,
                flexShrink: 0,
                border: "2px solid rgba(255,140,0,.2)",
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 6,
                flexShrink: 0,
                background: "rgba(255,140,0,.06)",
                border: "2px solid rgba(255,140,0,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 900,
                color: "rgba(255,140,0,.3)",
              }}
            >
              {(staflid.naam[0] ?? "").toUpperCase()}
            </div>
          )}

          {/* Info-blok */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Naam-rij + memo-icoon + sluit-knop */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {staflid.naam}
              </span>
              {staflid.heeftOpenMemo && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    color: "#eab308",
                    flexShrink: 0,
                  }}
                  title="Open memo's"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
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
              <button
                onClick={onClose}
                aria-label="Sluiten"
                style={{
                  marginLeft: "auto",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Rol-badge */}
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
                  color: "var(--staf-rol-text, rgba(255,140,0,.9))",
                  background: "rgba(255,140,0,.06)",
                  border: "1px solid rgba(255,140,0,.15)",
                  cursor: "default",
                }}
              >
                {eersteRol}
              </span>
            </div>

            {/* Koppelingen + speler-badge */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {staflid.teamKoppelingen.map((k, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid var(--border-default)",
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
                  <span style={{ fontSize: 9, color: "var(--text-tertiary)", marginLeft: 2 }}>
                    {k.rol}
                  </span>
                </span>
              ))}

              {staflid.speelteamNaam && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                  </span>
                  {staflid.speelteamNaam}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tab-balk ─── */}
        <div
          style={{
            display: "flex",
            padding: "0 24px",
            borderBottom: "1px solid var(--border-light)",
            flexShrink: 0,
          }}
        >
          {[
            { id: "historie" as TabId, label: "Historie" },
            { id: "memo" as TabId, label: "Memo's" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActieveTab(id)}
              style={{
                position: "relative",
                padding: "10px 16px",
                fontSize: 12,
                fontWeight: actieveTab === id ? 700 : 600,
                color: actieveTab === id ? "var(--ow-accent)" : "var(--text-tertiary)",
                cursor: "pointer",
                border: "none",
                background: "none",
                borderBottom: "2px solid transparent",
                marginBottom: -1,
                fontFamily: "inherit",
              }}
            >
              {label}
              {actieveTab === id && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--ow-accent)",
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ─── Tab body ─── */}
        <div
          className="ow-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px", minHeight: 260 }}
        >
          {/* ═══ TAB: HISTORIE ═══ */}
          {actieveTab === "historie" && (
            <>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Seizoenshistorie
                {seizoenshistorie.length > 0 && ` · ${seizoenshistorie.length} seizoenen bij OW`}
              </div>

              {seizoenshistorie.length === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    lineHeight: 1.6,
                  }}
                >
                  Historische seizoensdata wordt opgehaald in een volgende iteratie.
                </div>
              ) : (
                <div>
                  {seizoenshistorie
                    .slice()
                    .sort((a, b) => b.seizoen.localeCompare(a.seizoen))
                    .map((entry) => (
                      <div
                        key={entry.seizoen}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 10,
                          padding: "6px 0",
                          borderBottom: "1px solid var(--border-light)",
                          fontSize: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-tertiary)",
                            fontVariantNumeric: "tabular-nums",
                            minWidth: 65,
                            flexShrink: 0,
                            fontWeight: 600,
                          }}
                        >
                          {entry.seizoen.replace("-", "–")}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                          {entry.teamKoppelingen.map((tk, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                color: "var(--text-secondary)",
                              }}
                            >
                              <span
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: dotKleur(tk.teamKleur),
                                  flexShrink: 0,
                                }}
                              />
                              {tk.teamNaam}
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--text-tertiary)",
                                  marginLeft: "auto",
                                }}
                              >
                                {tk.rol}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* ═══ TAB: MEMO'S ═══ */}
          {actieveTab === "memo" && (
            <>
              {/* + Nieuw memo knop */}
              <button
                onClick={() => logger.info("staf-werkitem-create: backlog-punt 3")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: "rgba(255,107,0,.12)",
                  color: "var(--ow-accent)",
                  border: "1px solid rgba(255,107,0,.3)",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 14,
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>+</span>
                Nieuw memo
              </button>

              {werkitems.length === 0 ? (
                <div
                  style={{
                    padding: "16px 0",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                  }}
                >
                  Geen memo&apos;s voor dit staflid.
                </div>
              ) : (
                <div>
                  {werkitems.map((item) => {
                    const statusKleur = werkitemStatusDot(item.status);
                    const isOpgelost = item.status === "OPGELOST";
                    const prio = prioBadgeStijl(item.prioriteit);

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--border-light)",
                          cursor: "pointer",
                        }}
                      >
                        {/* Status-dot */}
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: statusKleur,
                            flexShrink: 0,
                          }}
                        />

                        {/* Prio-badge */}
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 7,
                            fontWeight: 900,
                            color: "#fff",
                            background: prio.bg,
                          }}
                        >
                          {prio.label}
                        </span>

                        {/* Tekst */}
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 12,
                            color: isOpgelost ? "var(--text-tertiary)" : "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textDecoration: isOpgelost ? "line-through" : "none",
                          }}
                        >
                          {item.titel}
                        </span>

                        {/* Datum */}
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            flexShrink: 0,
                          }}
                        >
                          {formatDatum(item.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
