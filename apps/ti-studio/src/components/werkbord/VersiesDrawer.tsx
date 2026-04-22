// apps/ti-studio/src/components/werkbord/VersiesDrawer.tsx
"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./tokens.css";
import type { DrawerData } from "@/app/(protected)/indeling/drawer-actions";
import type { VersiesDrawerConfirm } from "./types";
import { createWhatIfVanHuidigeVersie } from "@/app/(protected)/indeling/drawer-actions";
import { pasWhatIfToe, verwerpWhatIf } from "@/app/(protected)/indeling/whatif-resolve-actions";
import {
  valideerWhatIfVoorToepassen,
  type WhatIfValidatieResultaat,
} from "@/app/(protected)/indeling/whatif-validatie-actions";
import { herstelVersie, verwijderVersie } from "@/app/(protected)/indeling/versies-actions";
import { logger } from "@oranje-wit/types";

interface VersiesDrawerProps {
  open: boolean;
  data: DrawerData | null;
  werkindelingId: string;
  gebruikerEmail: string;
  onClose: () => void;
  onRefresh: () => void;
  actieveWhatIfId?: string | null;
  onOpenWhatIfOpCanvas?: (
    whatIfId: string,
    meta: { vraag: string; basisVersieNummer: number }
  ) => void;
}

export function VersiesDrawer({
  open,
  data,
  werkindelingId,
  gebruikerEmail,
  onClose,
  onRefresh,
  actieveWhatIfId = null,
  onOpenWhatIfOpCanvas,
}: VersiesDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<VersiesDrawerConfirm | null>(null);
  const [toonNieuweWI, setToonNieuweWI] = useState(false);
  const [nieuweVraag, setNieuweVraag] = useState("");
  const [bezig, setBezig] = useState(false);
  const [validatie, setValidatie] = useState<WhatIfValidatieResultaat | null>(null);
  const [validatieLaadt, setValidatieLaadt] = useState(false);
  const [toelichting, setToelichting] = useState("");
  const [confirmFout, setConfirmFout] = useState<string | null>(null);

  const huidigVersieNummer = data?.werkversie.nummer ?? 0;

  // Pre-fetch validatie zodra de promoveer-dialoog opent
  useEffect(() => {
    if (confirm?.type !== "promoveer-whatif") {
      setValidatie(null);
      setToelichting("");
      setConfirmFout(null);
      return;
    }
    let actief = true;
    setValidatieLaadt(true);
    setValidatie(null);
    setConfirmFout(null);
    valideerWhatIfVoorToepassen(confirm.whatIfId)
      .then((result) => {
        if (actief) setValidatie(result);
      })
      .catch((err) => {
        logger.error("Validatie what-if faalde", err);
        if (actief) setConfirmFout("Validatie kon niet geladen worden.");
      })
      .finally(() => {
        if (actief) setValidatieLaadt(false);
      });
    return () => {
      actief = false;
    };
  }, [confirm]);

  function datumLabel(d: Date): string {
    const nu = new Date();
    const dag = 24 * 60 * 60 * 1000;
    const diff = nu.getTime() - new Date(d).getTime();
    if (diff < dag) return "vandaag";
    if (diff < 2 * dag) return "gisteren";
    return `${Math.floor(diff / dag)}d geleden`;
  }

  async function handleNieuweWI() {
    if (!nieuweVraag.trim() || bezig) return;
    setBezig(true);
    try {
      await createWhatIfVanHuidigeVersie(werkindelingId, {
        vraag: nieuweVraag.trim(),
      });
      setNieuweVraag("");
      setToonNieuweWI(false);
      onRefresh();
      startTransition(() => router.refresh());
    } catch (err) {
      logger.error("Fout bij aanmaken what-if", err);
    } finally {
      setBezig(false);
    }
  }

  async function handleConfirm() {
    if (!confirm || bezig) return;
    setBezig(true);
    setConfirmFout(null);
    try {
      if (confirm.type === "promoveer-whatif") {
        const heeftAfwijkingen = validatie?.heeftAfwijkingen ?? false;
        const toelichtingArg = heeftAfwijkingen ? toelichting.trim() : undefined;
        if (heeftAfwijkingen && !toelichtingArg) {
          setConfirmFout("Vul een toelichting in voor de kaderafwijking.");
          return;
        }
        const result = await pasWhatIfToe(confirm.whatIfId, toelichtingArg);
        if (!result.ok) {
          setConfirmFout(result.error);
          return;
        }
      } else if (confirm.type === "herstel-versie") {
        await herstelVersie(confirm.versieId, gebruikerEmail);
      } else if (confirm.type === "archiveer-whatif") {
        const result = await verwerpWhatIf(confirm.whatIfId);
        if (!result.ok) {
          setConfirmFout(result.error);
          return;
        }
      } else if (confirm.type === "verwijder-versie") {
        await verwijderVersie(confirm.versieId);
      }
      setConfirm(null);
      onRefresh();
      startTransition(() => router.refresh());
    } catch (err) {
      logger.error("Fout bij drawer-actie", err);
      setConfirmFout(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setBezig(false);
    }
  }

  return (
    <aside
      style={{
        width: open ? 264 : 0,
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease, opacity 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 14px",
          borderBottom: "1px solid var(--border-0)",
          gap: 8,
          flexShrink: 0,
          background: "var(--bg-0)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".7px",
            color: "var(--text-3)",
            flex: 1,
          }}
        >
          Versies &amp; What-Ifs
        </span>
        <button
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-3)",
            fontSize: 12,
            fontFamily: "inherit",
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!data ? (
          <div
            style={{
              padding: "20px 12px",
              fontSize: 12,
              color: "var(--text-3)",
              textAlign: "center",
            }}
          >
            Laden…
          </div>
        ) : (
          <>
            {/* ─── Werkversie-blok ─── */}
            <div
              style={{
                margin: "12px 10px 6px",
                background: "linear-gradient(135deg, rgba(255,107,0,.09), rgba(255,107,0,.04))",
                border: "1px solid rgba(255,107,0,.22)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 10px 5px",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>⭐</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".7px",
                    color: "var(--accent)",
                    flex: 1,
                  }}
                >
                  Werkversie
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 10,
                    background: "rgba(255,107,0,.14)",
                    color: "var(--accent)",
                    border: "1px solid rgba(255,107,0,.18)",
                  }}
                >
                  v{data.werkversie.nummer} — actief
                </span>
              </div>
              <div
                style={{
                  padding: "0 10px 3px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {data.werkversie.naam ?? `Versie ${data.werkversie.nummer}`}
              </div>
              <div
                style={{
                  padding: "0 10px 10px",
                  fontSize: 10,
                  color: "var(--text-3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{datumLabel(data.werkversie.createdAt)}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{data.werkversie.auteur}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{data.werkversie.aantalIngedeeld} spelers</span>
              </div>
            </div>

            {/* ─── What-Ifs sectie ─── */}
            <SectieHeader
              label="What-Ifs"
              count={data.whatIfs.filter((wi) => wi.status === "OPEN").length + " open"}
            />

            <div
              style={{
                margin: "0 10px 8px",
                padding: "8px 10px",
                background: "rgba(59,130,246,.06)",
                border: "1px solid rgba(59,130,246,.18)",
                borderRadius: 8,
                fontSize: 11,
                color: "var(--text-2)",
                lineHeight: 1.45,
              }}
            >
              Een what-if is een <strong>vrije kopie</strong> van je werkindeling. Schuif spelers,
              teams en staf zoals je wilt — de werkindeling blijft ongemoeid. Pas als je op{" "}
              <strong>Overnemen</strong> klikt wordt de variant de nieuwe werkversie.
            </div>

            {data.whatIfs.map((wi) => {
              const isOpen = wi.status === "OPEN";
              const isDone = wi.status === "TOEGEPAST";

              return (
                <div
                  key={wi.id}
                  style={{
                    margin: "3px 10px",
                    background: isOpen ? "rgba(59,130,246,.03)" : "var(--bg-0)",
                    border: `1px solid ${isOpen ? "rgba(59,130,246,.2)" : "var(--border-0)"}`,
                    borderRadius: 8,
                    opacity: isOpen ? 1 : 0.55,
                  }}
                >
                  {/* Top row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      padding: "8px 10px 4px",
                      gap: 7,
                    }}
                  >
                    <WIIcoon status={wi.status} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: isOpen ? "var(--text-1)" : "var(--text-3)",
                        flex: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {wi.vraag}
                    </span>
                  </div>

                  {/* Basis-versie label */}
                  <div
                    style={{
                      padding: "0 10px 3px 37px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--text-3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <line x1="6" y1="3" x2="6" y2="15" />
                        <circle cx="18" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M18 9a9 9 0 0 1-9 9" />
                      </svg>
                      kopie van
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "#1a2130",
                        color: "#4b6480",
                        border: "1px solid #243044",
                      }}
                    >
                      v{wi.basisVersieNummer}
                    </span>
                    {wi.isStale && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "#d97706",
                          background: "rgba(217,119,6,.1)",
                          borderRadius: 4,
                          padding: "1px 5px",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        verouderd
                      </span>
                    )}
                    {isDone && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--text-3)",
                          marginLeft: 4,
                        }}
                      >
                        → v{wi.basisVersieNummer + 1}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div
                    style={{
                      padding: "0 10px 5px 37px",
                      fontSize: 10,
                      color: "var(--text-3)",
                      display: "flex",
                      gap: 5,
                    }}
                  >
                    <WIStatusBadge status={wi.status} />
                    <span>·</span>
                    <span>
                      {datumLabel(wi.createdAt)} · {wi.aantalTeams} teams
                    </span>
                  </div>

                  {/* Acties — alleen voor open what-ifs */}
                  {isOpen &&
                    (confirm?.type === "archiveer-whatif" && confirm.whatIfId === wi.id ? (
                      <InlineConfirm
                        tekst={`"${wi.vraag}" archiveren?`}
                        onJa={handleConfirm}
                        onNee={() => setConfirm(null)}
                        bezig={bezig}
                      />
                    ) : (
                      <div
                        style={{
                          padding: "0 8px 8px 37px",
                          display: "flex",
                          gap: 5,
                          flexWrap: "wrap",
                        }}
                      >
                        {onOpenWhatIfOpCanvas &&
                          (actieveWhatIfId === wi.id ? (
                            <button
                              onClick={() =>
                                onOpenWhatIfOpCanvas(wi.id, {
                                  vraag: wi.vraag,
                                  basisVersieNummer: wi.basisVersieNummer,
                                })
                              }
                              style={btnCanvasActief}
                              title="Deze variant staat op het canvas"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              >
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                              </svg>
                              Op canvas
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                onOpenWhatIfOpCanvas(wi.id, {
                                  vraag: wi.vraag,
                                  basisVersieNummer: wi.basisVersieNummer,
                                })
                              }
                              style={btnOpenCanvas}
                              title="Open deze variant op het canvas"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              >
                                <path d="M14 3h7v7" />
                                <path d="M21 3l-9 9" />
                                <path d="M21 14v7H3V3h7" />
                              </svg>
                              Open op canvas
                            </button>
                          ))}
                        <button
                          onClick={() =>
                            setConfirm({
                              type: "promoveer-whatif",
                              whatIfId: wi.id,
                              vraag: wi.vraag,
                              basisVersieNummer: wi.basisVersieNummer,
                            })
                          }
                          style={btnPrimair}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <path d="M12 19V5M5 12l7-7 7 7" />
                          </svg>
                          Maak werkversie
                        </button>
                        <button
                          onClick={() =>
                            setConfirm({
                              type: "archiveer-whatif",
                              whatIfId: wi.id,
                              vraag: wi.vraag,
                            })
                          }
                          style={btnSecundair}
                        >
                          Archiveer
                        </button>
                      </div>
                    ))}
                </div>
              );
            })}

            {data.whatIfs.length === 0 && (
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontStyle: "italic",
                }}
              >
                Nog geen what-ifs
              </div>
            )}

            {/* ─── Versie-archief sectie ─── */}
            <SectieHeader label="Versie-archief" count={String(data.archiefVersies.length)} />

            {data.archiefVersies.map((v) =>
              confirm?.type === "verwijder-versie" && confirm.versieId === v.id ? (
                <div key={v.id} style={{ margin: "3px 10px" }}>
                  <InlineConfirm
                    tekst={`Versie v${v.nummer} verwijderen?`}
                    onJa={handleConfirm}
                    onNee={() => setConfirm(null)}
                    bezig={bezig}
                  />
                </div>
              ) : (
                <div
                  key={v.id}
                  style={{
                    margin: "3px 10px",
                    background: "var(--bg-0)",
                    border: "1px solid var(--border-0)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 8px 7px 10px",
                    gap: 7,
                    opacity: 0.7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-3)",
                      width: 20,
                      flexShrink: 0,
                    }}
                  >
                    v{v.nummer}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-2)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {v.naam ?? `Versie ${v.nummer}`}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-3)" }}>
                      {datumLabel(v.createdAt)} · {v.auteur}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "herstel-versie",
                        versieId: v.id,
                        nummer: v.nummer,
                        naam: v.naam,
                      })
                    }
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "3px 7px",
                      borderRadius: 5,
                      background: "none",
                      color: "var(--text-3)",
                      border: "1px solid var(--border-0)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ⭐ Zet actief
                  </button>
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "verwijder-versie",
                        versieId: v.id,
                        nummer: v.nummer,
                      })
                    }
                    style={{
                      fontSize: 11,
                      padding: "3px 5px",
                      borderRadius: 5,
                      background: "none",
                      color: "var(--text-3)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    🗑
                  </button>
                </div>
              )
            )}

            {data.archiefVersies.length === 0 && (
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontStyle: "italic",
                }}
              >
                Geen eerdere versies
              </div>
            )}

            <div style={{ height: 12 }} />
          </>
        )}
      </div>

      {/* Bevestigingsdialog (promoveer / herstel) */}
      {(confirm?.type === "promoveer-whatif" || confirm?.type === "herstel-versie") && (
        <ConfirmDialog
          confirm={confirm}
          huidigVersieNummer={huidigVersieNummer}
          onJa={handleConfirm}
          onNee={() => setConfirm(null)}
          bezig={bezig || isPending}
          validatie={validatie}
          validatieLaadt={validatieLaadt}
          toelichting={toelichting}
          onToelichtingChange={setToelichting}
          fout={confirmFout}
        />
      )}

      {/* Footer: Nieuwe What-If */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {toonNieuweWI ? (
          <div>
            <input
              type="text"
              placeholder="Wat wil je uitproberen?"
              value={nieuweVraag}
              onChange={(e) => setNieuweVraag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNieuweWI();
                if (e.key === "Escape") setToonNieuweWI(false);
              }}
              autoFocus
              style={{
                width: "100%",
                background: "var(--bg-0)",
                border: "1px solid var(--border-1)",
                borderRadius: 7,
                color: "var(--text-1)",
                fontSize: 12,
                fontFamily: "inherit",
                padding: "6px 10px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={handleNieuweWI}
                disabled={!nieuweVraag.trim() || bezig}
                style={{
                  ...btnPrimair,
                  flex: 1,
                  justifyContent: "center",
                  opacity: !nieuweVraag.trim() || bezig ? 0.5 : 1,
                }}
              >
                Aanmaken
              </button>
              <button
                onClick={() => {
                  setToonNieuweWI(false);
                  setNieuweVraag("");
                }}
                style={btnSecundair}
              >
                Annuleer
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setToonNieuweWI(true)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "rgba(59,130,246,.07)",
              border: "1px dashed rgba(59,130,246,.22)",
              borderRadius: 8,
              color: "var(--info)",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Nieuwe What-If aanmaken
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Sub-componenten ──────────────────────────────────────────

function SectieHeader({ label, count }: { label: string; count: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 12px 5px",
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".6px",
          color: "var(--text-3)",
          flex: 1,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600 }}>{count}</span>
    </div>
  );
}

function WIIcoon({ status }: { status: string }) {
  const isOpen = status === "OPEN";
  const isDone = status === "TOEGEPAST";
  const bg = isOpen ? "rgba(59,130,246,.15)" : isDone ? "rgba(34,197,94,.1)" : "rgba(80,80,80,.12)";
  const stroke = isOpen ? "#60a5fa" : isDone ? "#4ade80" : "#6b7280";
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}
    >
      {isDone ? (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )}
    </div>
  );
}

function WIStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    OPEN: { bg: "rgba(59,130,246,.12)", color: "#60a5fa", label: "open" },
    TOEGEPAST: {
      bg: "rgba(34,197,94,.1)",
      color: "#4ade80",
      label: "toegepast",
    },
    VERWORPEN: {
      bg: "rgba(100,100,100,.1)",
      color: "#6b7280",
      label: "gearchiveerd",
    },
    BESLISBAAR: {
      bg: "rgba(234,179,8,.1)",
      color: "#eab308",
      label: "beslisbaar",
    },
  };
  const s = styles[status] ?? styles.VERWORPEN;
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "1px 5px",
        borderRadius: 10,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function InlineConfirm({
  tekst,
  onJa,
  onNee,
  bezig,
}: {
  tekst: string;
  onJa: () => void;
  onNee: () => void;
  bezig: boolean;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: "var(--bg-2)",
        borderTop: "1px solid var(--border-0)",
      }}
    >
      <p style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8 }}>{tekst}</p>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onNee} style={{ ...btnSecundair, fontSize: 10, padding: "3px 10px" }}>
          Nee
        </button>
        <button
          onClick={onJa}
          disabled={bezig}
          style={{
            fontSize: 10,
            padding: "3px 10px",
            borderRadius: 6,
            background: "rgba(239,68,68,.12)",
            color: "#ef4444",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            opacity: bezig ? 0.5 : 1,
          }}
        >
          Ja, archiveer
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  confirm,
  huidigVersieNummer,
  onJa,
  onNee,
  bezig,
  validatie,
  validatieLaadt,
  toelichting,
  onToelichtingChange,
  fout,
}: {
  confirm: VersiesDrawerConfirm;
  huidigVersieNummer: number;
  onJa: () => void;
  onNee: () => void;
  bezig: boolean;
  validatie: WhatIfValidatieResultaat | null;
  validatieLaadt: boolean;
  toelichting: string;
  onToelichtingChange: (v: string) => void;
  fout: string | null;
}) {
  const nieuweNummer = huidigVersieNummer + 1;
  let titel = "";
  let body: React.ReactNode = null;

  const isPromoveer = confirm.type === "promoveer-whatif";
  const heeftHardefouten = isPromoveer && (validatie?.heeftHardefouten ?? false);
  const heeftAfwijkingen = isPromoveer && (validatie?.heeftAfwijkingen ?? false);
  const hardeFoutmeldingen =
    isPromoveer && validatie
      ? [
          ...validatie.crossTeamMeldingen
            .filter((m) => m.ernst === "kritiek")
            .map((m) => m.bericht),
          ...Object.values(validatie.teamValidaties)
            .flatMap((v) => v.meldingen)
            .filter((m) => m.ernst === "kritiek")
            .map((m) => m.bericht),
        ]
      : [];
  const toelichtingOntbreekt = heeftAfwijkingen && !toelichting.trim();
  const knopDisabled =
    bezig || (isPromoveer && (validatieLaadt || heeftHardefouten || toelichtingOntbreekt));

  if (confirm.type === "promoveer-whatif") {
    titel = "Deze variant overnemen als werkindeling?";
    body = (
      <>
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(255,107,0,.08)",
            border: "1px solid rgba(255,107,0,.25)",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: ".6px",
              marginBottom: 6,
            }}
          >
            Let op — dit vervangt de huidige werkindeling
          </p>
          <p style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.5 }}>
            Alle wijzigingen uit deze variant worden de nieuwe werkversie. De huidige werkversie
            wordt automatisch in het archief bewaard en blijft altijd terug te zetten.
          </p>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
          Variant: <strong style={{ color: "var(--text-1)" }}>"{confirm.vraag}"</strong>
          <br />
          <span style={{ fontSize: 11, color: "var(--info)" }}>
            gebaseerd op v{confirm.basisVersieNummer}
          </span>
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", margin: "10px 0 4px" }}>Na overnemen:</p>
        <p
          style={{
            fontSize: 13,
            color: "var(--accent)",
            fontWeight: 700,
          }}
        >
          v{nieuweNummer} — nieuwe werkversie
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
          v{huidigVersieNummer} → archief (terug te zetten via "Herstel")
        </p>

        {validatieLaadt && (
          <p
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              marginTop: 10,
              fontStyle: "italic",
            }}
          >
            Validatie laden…
          </p>
        )}

        {heeftHardefouten && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.25)",
              borderRadius: 6,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#ef4444",
                marginBottom: 4,
              }}
            >
              Harde fouten — promotie geblokkeerd
            </p>
            <ul
              style={{
                fontSize: 11,
                color: "var(--text-2)",
                lineHeight: 1.5,
                paddingLeft: 16,
                margin: 0,
              }}
            >
              {hardeFoutmeldingen.slice(0, 5).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
              {hardeFoutmeldingen.length > 5 && (
                <li style={{ color: "var(--text-3)" }}>
                  …en nog {hardeFoutmeldingen.length - 5} fout(en)
                </li>
              )}
            </ul>
          </div>
        )}

        {heeftAfwijkingen && !heeftHardefouten && validatie && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "rgba(234,179,8,.08)",
              border: "1px solid rgba(234,179,8,.25)",
              borderRadius: 6,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#eab308",
                marginBottom: 6,
              }}
            >
              Afwijkt van blauwdruk-kaders
            </p>
            <ul
              style={{
                fontSize: 11,
                color: "var(--text-2)",
                lineHeight: 1.5,
                paddingLeft: 16,
                margin: "0 0 8px 0",
              }}
            >
              {validatie.kaderAfwijkingen.map((a, i) => (
                <li key={i}>
                  {a.categorie}: verwacht {a.verwachtAantal}, werkelijk {a.werkelijkAantal} (
                  {a.verschil > 0 ? "+" : ""}
                  {a.verschil})
                </li>
              ))}
            </ul>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: ".6px",
                marginBottom: 4,
              }}
            >
              Toelichting afwijking (verplicht)
            </label>
            <textarea
              value={toelichting}
              onChange={(e) => onToelichtingChange(e.target.value)}
              rows={3}
              placeholder="Waarom is deze afwijking gerechtvaardigd?"
              style={{
                width: "100%",
                background: "var(--bg-0)",
                border: "1px solid var(--border-1)",
                borderRadius: 6,
                color: "var(--text-1)",
                fontSize: 11,
                fontFamily: "inherit",
                padding: "6px 8px",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {fout && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.25)",
              borderRadius: 6,
              fontSize: 11,
              color: "#ef4444",
              whiteSpace: "pre-wrap",
            }}
          >
            {fout}
          </div>
        )}
      </>
    );
  } else if (confirm.type === "herstel-versie") {
    titel = `Oude versie v${confirm.nummer} terugzetten als werkindeling?`;
    body = (
      <>
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(255,107,0,.08)",
            border: "1px solid rgba(255,107,0,.25)",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: ".6px",
              marginBottom: 6,
            }}
          >
            Let op — dit vervangt de huidige werkindeling
          </p>
          <p style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.5 }}>
            De archiefversie wordt gekopieerd naar een nieuwe werkversie. De huidige werkversie
            verhuist naar het archief en blijft altijd terug te zetten.
          </p>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
          Bron:{" "}
          <strong style={{ color: "var(--text-1)" }}>
            v{confirm.nummer} "{confirm.naam ?? `Versie ${confirm.nummer}`}"
          </strong>
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", margin: "10px 0 4px" }}>
          Na terugzetten:
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--accent)",
            fontWeight: 700,
          }}
        >
          v{nieuweNummer} — nieuwe werkversie
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
          v{huidigVersieNummer} → archief
        </p>
      </>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 8,
        right: 8,
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: 10,
        overflow: "hidden",
        zIndex: 20,
        boxShadow: "var(--sh-raise)",
      }}
    >
      <div
        style={{
          padding: "11px 14px 8px",
          borderBottom: "1px solid var(--border-0)",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{titel}</p>
      </div>
      <div style={{ padding: "10px 14px" }}>{body}</div>
      <div
        style={{
          padding: "8px 14px 12px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          onClick={onNee}
          style={{
            fontSize: 11,
            padding: "6px 12px",
            borderRadius: 6,
            background: "var(--bg-3)",
            color: "var(--text-2)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Annuleer
        </button>
        <button
          onClick={onJa}
          disabled={knopDisabled}
          style={{
            fontSize: 11,
            padding: "6px 14px",
            borderRadius: 6,
            fontWeight: 700,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: knopDisabled ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: knopDisabled ? 0.5 : 1,
          }}
        >
          Ja, maak v{nieuweNummer}
        </button>
      </div>
    </div>
  );
}

// ─── Gedeelde button-styles ───────────────────────────────────

const btnPrimair: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 6,
  background: "rgba(255,107,0,.1)",
  color: "var(--accent)",
  border: "1px solid rgba(255,107,0,.2)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "inherit",
};

const btnSecundair: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  padding: "4px 9px",
  borderRadius: 6,
  background: "none",
  color: "var(--text-3)",
  border: "1px solid var(--border-0)",
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnOpenCanvas: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 6,
  background: "rgba(59,130,246,.1)",
  color: "var(--info)",
  border: "1px solid rgba(59,130,246,.22)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "inherit",
};

const btnCanvasActief: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: 6,
  background: "var(--accent-dim)",
  color: "var(--accent)",
  border: "1px solid rgba(255,107,0,.35)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "inherit",
};
