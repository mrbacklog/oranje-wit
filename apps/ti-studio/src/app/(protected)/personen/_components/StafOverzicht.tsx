"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import type { BeheerStaf } from "../staf-actions";
import {
  setStafActief,
  voegStafAanDoelToe,
  verwijderStafUitDoel,
  updateStafRolOpDoel,
} from "../staf-actions";
import { NieuweStafDialog } from "./NieuweStafDialog";

const ROL_SUGGESTIES = [
  "Trainer/Coach",
  "Coach",
  "Trainer",
  "Assistent",
  "Verzorger",
  "Begeleider",
  "Manager",
];

type DoelOptie = {
  id: string;
  naam: string;
  kleur: string | null;
  volgorde: number;
  type: "team" | "selectie";
};

const KLEUR_DOT: Record<string, string> = {
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

type SortKey = "naam" | "volgorde";

interface Props {
  stafLeden: BeheerStaf[];
  alleDoelen: DoelOptie[];
}

type StafRij = {
  rowKey: string;
  staf: BeheerStaf;
  // Als sortKey === "volgorde" tonen we per team een eigen rij; anders undefined.
  team?: BeheerStaf["teams"][number];
};

export function StafOverzicht({ stafLeden, alleDoelen }: Props) {
  const [zoekterm, setZoekterm] = useState("");
  const [editorStafId, setEditorStafId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState("allen");
  const [toonInactief, setToonInactief] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("naam");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimistischActief, setOptimistischActief] = useState<Record<string, boolean>>({});

  const teamFilterOpties = useMemo(
    () => [...new Set(stafLeden.flatMap((s) => s.teams.map((t) => t.teamNaam)))].sort(),
    [stafLeden]
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleToggleActief(stafId: string, nieuwActief: boolean) {
    setOptimistischActief((prev) => ({ ...prev, [stafId]: nieuwActief }));
    startTransition(async () => {
      const resultaat = await setStafActief(stafId, nieuwActief);
      if (!resultaat.ok) {
        setOptimistischActief((prev) => {
          const kopie = { ...prev };
          delete kopie[stafId];
          return kopie;
        });
      }
    });
  }

  function isActief(s: BeheerStaf): boolean {
    return optimistischActief[s.id] ?? s.actief;
  }

  const rijen: StafRij[] = useMemo(() => {
    // Filteren
    let result = stafLeden;
    if (!toonInactief) result = result.filter((s) => isActief(s));
    if (zoekterm.trim()) {
      const q = zoekterm.trim().toLowerCase();
      result = result.filter((s) => s.naam.toLowerCase().includes(q));
    }
    if (teamFilter !== "allen")
      result = result.filter((s) => s.teams.some((t) => t.teamNaam === teamFilter));

    // Bouw rijen (bij team-sortering: 1 rij per team op een staflid)
    const allerijen: StafRij[] = [];
    if (sortKey === "volgorde") {
      for (const s of result) {
        if (s.teams.length === 0) {
          allerijen.push({ rowKey: s.id, staf: s });
        } else {
          for (const team of s.teams) {
            allerijen.push({ rowKey: `${s.id}:${team.teamId}`, staf: s, team });
          }
        }
      }
    } else {
      for (const s of result) allerijen.push({ rowKey: s.id, staf: s });
    }

    // Sorteren — inactief altijd onderaan (ongeacht richting)
    allerijen.sort((a, b) => {
      const aActief = isActief(a.staf);
      const bActief = isActief(b.staf);
      if (aActief !== bActief) return aActief ? -1 : 1;

      let cmp = 0;
      switch (sortKey) {
        case "naam":
          cmp = a.staf.naam.localeCompare(b.staf.naam, "nl");
          break;
        case "volgorde": {
          const av = a.team?.volgorde ?? 99999;
          const bv = b.team?.volgorde ?? 99999;
          cmp = av - bv;
          if (cmp === 0) cmp = a.staf.naam.localeCompare(b.staf.naam, "nl");
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return allerijen;
  }, [stafLeden, optimistischActief, zoekterm, teamFilter, toonInactief, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return (
      <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}>
        {" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const chipStyle = (aan: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.625rem",
    borderRadius: 99,
    border: aan ? "1px solid var(--ow-oranje-500)" : "1px solid var(--border-default)",
    background: aan ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
    color: aan ? "var(--ow-oranje-500)" : "var(--text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const dropdownStyle: React.CSSProperties = {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    padding: "0.375rem 0.625rem",
    color: "var(--text-primary)",
    fontSize: "0.8125rem",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem",
    textAlign: "left",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  // Tel unieke stafleden in gefilterde weergave (niet duplicaten bij team-sortering)
  const aantalUniek = useMemo(() => new Set(rijen.map((r) => r.staf.id)).size, [rijen]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Zoek op naam..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            padding: "0.375rem 0.75rem",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            outline: "none",
            width: 200,
            fontFamily: "inherit",
          }}
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={dropdownStyle}
        >
          <option value="allen">Team: Allen</option>
          {teamFilterOpties.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button onClick={() => setToonInactief((v) => !v)} style={chipStyle(toonInactief)}>
          Toon inactief
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          {aantalUniek} staflid{aantalUniek !== 1 ? "en" : ""}
          {sortKey === "volgorde" && rijen.length !== aantalUniek && (
            <span style={{ opacity: 0.7 }}> · {rijen.length} rijen</span>
          )}
        </span>
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: 7,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Nieuw staflid
        </button>
      </div>
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border-default)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th onClick={() => handleSort("naam")} style={thStyle}>
                Naam
                <SortIcon col="naam" />
              </th>
              <th onClick={() => handleSort("volgorde")} style={thStyle}>
                Team + rol
                <SortIcon col="volgorde" />
              </th>
              <th style={{ ...thStyle, cursor: "default", textAlign: "center" }}>Actief</th>
            </tr>
          </thead>
          <tbody>
            {rijen.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Geen stafleden gevonden
                </td>
              </tr>
            )}
            {rijen.map((rij, i) => {
              const staf = rij.staf;
              const actief = isActief(staf);
              const initialen = staf.naam
                .split(" ")
                .filter((w: string) => w.length > 0 && w[0] === w[0].toUpperCase())
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isInactief = !actief;
              // Bij team-sortering: teams te tonen = alleen dit specifieke team
              const teamsOmTeTonen = rij.team ? [rij.team] : staf.teams;
              return (
                <tr
                  key={rij.rowKey}
                  style={{
                    borderBottom: i < rijen.length - 1 ? "1px solid var(--border-default)" : "none",
                    opacity: isInactief ? 0.5 : 1,
                  }}
                >
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: isInactief ? "rgba(148,163,184,0.15)" : "rgba(255,107,0,.15)",
                          border: isInactief
                            ? "1.5px solid rgba(148,163,184,0.3)"
                            : "1.5px solid rgba(255,107,0,.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          color: isInactief ? "var(--text-secondary)" : "var(--accent)",
                          flexShrink: 0,
                        }}
                      >
                        {initialen}
                      </div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontStyle: isInactief ? "italic" : "normal",
                        }}
                      >
                        {staf.naam}
                      </span>
                      {staf.openMemoCount > 0 && (
                        <span
                          title={`${staf.openMemoCount} open memo${staf.openMemoCount !== 1 ? "'s" : ""}`}
                          style={{
                            fontSize: 10,
                            color: "var(--accent)",
                            fontWeight: 700,
                            marginLeft: 2,
                          }}
                        >
                          ▲
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.625rem 0.875rem",
                      position: "relative",
                      cursor: "pointer",
                    }}
                    title="Klik om team + rol te bewerken"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorStafId(editorStafId === staf.id ? null : staf.id);
                    }}
                  >
                    {teamsOmTeTonen.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {teamsOmTeTonen.map((t) => (
                          <div
                            key={t.teamId}
                            style={{ display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: KLEUR_DOT[t.kleur] ?? "#94a3b8",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--text-primary)",
                                fontWeight: 500,
                              }}
                            >
                              {t.teamNaam}
                            </span>
                            {t.doelType === "selectie" && (
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  padding: "0.08rem 0.3rem",
                                  borderRadius: 3,
                                  background: "rgba(59,130,246,0.15)",
                                  color: "#60a5fa",
                                  fontWeight: 700,
                                }}
                              >
                                SEL
                              </span>
                            )}
                            {t.rol && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-secondary)",
                                  background: "var(--surface-raised)",
                                  border: "1px solid var(--border-default)",
                                  borderRadius: 4,
                                  padding: "1px 6px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {t.rol}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span
                        aria-label={`Wijs ${staf.naam} toe aan team of selectie`}
                        title="Voeg team of selectie toe"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: "1px dashed var(--border-default)",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          fontSize: "0.95rem",
                          lineHeight: 1,
                          opacity: 0.7,
                          transition: "opacity 120ms, border-color 120ms, color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          const b = e.currentTarget as HTMLSpanElement;
                          b.style.opacity = "1";
                          b.style.borderColor = "var(--accent)";
                          b.style.color = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          const b = e.currentTarget as HTMLSpanElement;
                          b.style.opacity = "0.7";
                          b.style.borderColor = "var(--border-default)";
                          b.style.color = "var(--text-secondary)";
                        }}
                      >
                        +
                      </span>
                    )}
                    {editorStafId === staf.id && (
                      <TeamRolEditor
                        staf={staf}
                        alleDoelen={alleDoelen}
                        onClose={() => setEditorStafId(null)}
                      />
                    )}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", textAlign: "center" }}>
                    <ActiefToggle
                      actief={actief}
                      disabled={isPending}
                      onChange={(nieuw) => handleToggleActief(staf.id, nieuw)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <NieuweStafDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function TeamRolEditor({
  staf,
  alleDoelen,
  onClose,
}: {
  staf: BeheerStaf;
  alleDoelen: DoelOptie[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [nieuwDoelId, setNieuwDoelId] = useState<string>("");
  const [nieuwRol, setNieuwRol] = useState<string>("Trainer");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [onClose]);

  // Bepaal reeds-gekoppelde doelen (team-id of selectie-id via teamId legacy alias)
  const huidigeIds = new Set(staf.teams.map((t) => t.teamId));
  const beschikbareDoelen = alleDoelen.filter((d) => !huidigeIds.has(d.id));
  const losseTeams = beschikbareDoelen.filter((d) => d.type === "team");
  const selecties = beschikbareDoelen.filter((d) => d.type === "selectie");

  function resolveDoel(doelId: string): { id: string; type: "team" | "selectie" } | null {
    const d = alleDoelen.find((o) => o.id === doelId);
    return d ? { id: d.id, type: d.type } : null;
  }

  function handleVoegToe() {
    if (!nieuwDoelId || !nieuwRol.trim()) return;
    const doel = resolveDoel(nieuwDoelId);
    if (!doel) return;
    startTransition(async () => {
      await voegStafAanDoelToe(staf.id, doel, nieuwRol.trim());
      setNieuwDoelId("");
      setNieuwRol("Trainer");
    });
  }

  function handleVerwijder(doelId: string) {
    // Koppeling-info uit staf.teams vinden voor doelType
    const koppeling = staf.teams.find((t) => t.teamId === doelId);
    const doel = {
      id: doelId,
      type: koppeling?.doelType ?? "team",
    } as { id: string; type: "team" | "selectie" };
    startTransition(async () => {
      await verwijderStafUitDoel(staf.id, doel);
    });
  }

  function handleRolWijzig(doelId: string, rol: string) {
    const koppeling = staf.teams.find((t) => t.teamId === doelId);
    const doel = {
      id: doelId,
      type: koppeling?.doelType ?? "team",
    } as { id: string; type: "team" | "selectie" };
    startTransition(async () => {
      await updateStafRolOpDoel(staf.id, doel, rol);
    });
  }

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: 4,
        zIndex: 50,
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: 8,
        padding: "0.75rem",
        minWidth: 340,
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
        Teams &amp; selecties + rollen voor {staf.naam}
      </div>
      {staf.teams.length === 0 && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
          Nog geen koppelingen
        </div>
      )}
      {staf.teams.map((t) => {
        const isSelectie = t.doelType === "selectie";
        return (
          <div key={t.teamId} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.8125rem",
                color: "var(--text-primary)",
                fontWeight: 500,
                minWidth: 110,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: KLEUR_DOT[t.kleur] ?? "#94a3b8",
                  flexShrink: 0,
                }}
              />
              {t.teamNaam}
              {isSelectie && (
                <span
                  style={{
                    fontSize: "0.55rem",
                    padding: "0.1rem 0.3rem",
                    borderRadius: 3,
                    background: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                    fontWeight: 700,
                  }}
                >
                  SEL
                </span>
              )}
            </span>
            <input
              type="text"
              defaultValue={t.rol}
              disabled={isPending}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value.trim() !== t.rol) {
                  handleRolWijzig(t.teamId, e.target.value);
                }
              }}
              list={`rol-suggesties-${staf.id}`}
              style={{
                flex: 1,
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                padding: "0.25rem 0.5rem",
                color: "var(--text-primary)",
                fontSize: "0.75rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={() => handleVerwijder(t.teamId)}
              disabled={isPending}
              aria-label={`Verwijder ${staf.naam} uit ${t.teamNaam}`}
              title="Verwijder koppeling"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 5,
                border: "1px solid var(--border-default)",
                background: "var(--surface-sunken)",
                color: "var(--text-secondary)",
                cursor: isPending ? "not-allowed" : "pointer",
                fontSize: "0.75rem",
                padding: 0,
                lineHeight: 1,
                fontFamily: "inherit",
                transition: "background 120ms, color 120ms, border-color 120ms",
              }}
              onMouseEnter={(e) => {
                if (isPending) return;
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(239,68,68,0.15)";
                b.style.borderColor = "rgba(239,68,68,0.35)";
                b.style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "var(--surface-sunken)";
                b.style.borderColor = "var(--border-default)";
                b.style.color = "var(--text-secondary)";
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <datalist id={`rol-suggesties-${staf.id}`}>
        {ROL_SUGGESTIES.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <div
        style={{
          borderTop: "1px solid var(--border-default)",
          paddingTop: "0.5rem",
          marginTop: "0.25rem",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 5,
            border: "1px dashed var(--border-default)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          +
        </div>
        <select
          value={nieuwDoelId}
          onChange={(e) => setNieuwDoelId(e.target.value)}
          disabled={isPending || beschikbareDoelen.length === 0}
          style={{
            flex: 1,
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            padding: "0.25rem 0.5rem",
            color: "var(--text-primary)",
            fontSize: "0.75rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        >
          <option value="">Kies team of selectie…</option>
          {losseTeams.length > 0 && (
            <optgroup label="Teams">
              {losseTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.naam}
                </option>
              ))}
            </optgroup>
          )}
          {selecties.length > 0 && (
            <optgroup label="Selecties (gecombineerd)">
              {selecties.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.naam}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          type="text"
          value={nieuwRol}
          onChange={(e) => setNieuwRol(e.target.value)}
          disabled={isPending}
          list={`rol-suggesties-${staf.id}`}
          placeholder="Rol"
          style={{
            width: 110,
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            padding: "0.25rem 0.5rem",
            color: "var(--text-primary)",
            fontSize: "0.75rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={handleVoegToe}
          disabled={isPending || !nieuwDoelId || !nieuwRol.trim()}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: 6,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: isPending || !nieuwDoelId ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: isPending || !nieuwDoelId || !nieuwRol.trim() ? 0.6 : 1,
          }}
        >
          Voeg toe
        </button>
      </div>
    </div>
  );
}

function ActiefToggle({
  actief,
  disabled,
  onChange,
}: {
  actief: boolean;
  disabled: boolean;
  onChange: (nieuw: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actief}
      aria-label={actief ? "Zet inactief" : "Zet actief"}
      disabled={disabled}
      onClick={() => onChange(!actief)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        border: "none",
        padding: 0,
        position: "relative",
        background: actief ? "rgba(34,197,94,0.55)" : "rgba(148,163,184,0.35)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 150ms ease",
        flexShrink: 0,
        outline: "none",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: actief ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          transition: "left 150ms ease",
        }}
      />
    </button>
  );
}
