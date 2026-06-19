"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import type { BeheerStaf } from "../staf-actions";
import { setStafActief, hernoemStaf, verwijderStaf } from "../staf-actions";
import { NieuweStafDialog } from "./NieuweStafDialog";
import { StafKoppelEditor } from "@/components/staf/StafKoppelEditor";
import { KLEUR_DOT, toonRol, type StafKoppelDoel } from "@/components/staf/staf-koppel-types";

type DoelOptie = StafKoppelDoel;

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
  const [hernoemId, setHernoemId] = useState<string | null>(null);
  const [hernoemWaarde, setHernoemWaarde] = useState("");
  const [verwijderBevestigId, setVerwijderBevestigId] = useState<string | null>(null);
  const hernoemInputRef = useRef<HTMLInputElement>(null);
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

  function startHernoem(staf: BeheerStaf) {
    setHernoemId(staf.id);
    setHernoemWaarde(staf.naam);
    setTimeout(() => hernoemInputRef.current?.select(), 30);
  }

  function handleHernoemOpslaan(stafId: string) {
    startTransition(async () => {
      await hernoemStaf(stafId, hernoemWaarde);
      setHernoemId(null);
    });
  }

  function handleVerwijder(stafId: string) {
    startTransition(async () => {
      await verwijderStaf(stafId);
      setVerwijderBevestigId(null);
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
                    {hernoemId === staf.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <input
                          ref={hernoemInputRef}
                          value={hernoemWaarde}
                          onChange={(e) => setHernoemWaarde(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleHernoemOpslaan(staf.id);
                            if (e.key === "Escape") setHernoemId(null);
                          }}
                          style={{
                            background: "var(--surface-sunken)",
                            border: "1px solid var(--ow-oranje-500)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            color: "var(--text-primary)",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            outline: "none",
                            fontFamily: "inherit",
                            width: 180,
                          }}
                        />
                        <button
                          onClick={() => handleHernoemOpslaan(staf.id)}
                          disabled={isPending}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--ow-oranje-500)",
                            fontSize: "0.875rem",
                            padding: "2px 4px",
                          }}
                          title="Opslaan"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setHernoemId(null)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            fontSize: "0.875rem",
                            padding: "2px 4px",
                          }}
                          title="Annuleren"
                        >
                          ✕
                        </button>
                      </div>
                    ) : verwijderBevestigId === staf.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ fontSize: "0.8125rem", color: "#ef4444" }}>
                          Verwijder {staf.naam}?
                        </span>
                        <button
                          onClick={() => handleVerwijder(staf.id)}
                          disabled={isPending}
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.4)",
                            borderRadius: 5,
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            fontFamily: "inherit",
                          }}
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setVerwijderBevestigId(null)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-default)",
                            borderRadius: 5,
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            fontFamily: "inherit",
                          }}
                        >
                          Nee
                        </button>
                      </div>
                    ) : (
                      <div
                        className="staf-naamrij"
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        onMouseEnter={(e) => {
                          const acties = e.currentTarget.querySelector(
                            ".staf-acties"
                          ) as HTMLElement | null;
                          if (acties) acties.style.display = "flex";
                        }}
                        onMouseLeave={(e) => {
                          const acties = e.currentTarget.querySelector(
                            ".staf-acties"
                          ) as HTMLElement | null;
                          if (acties) acties.style.display = "none";
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: isInactief
                              ? "rgba(148,163,184,0.15)"
                              : "rgba(255,107,0,.15)",
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
                        <span
                          className="staf-acties"
                          style={{ display: "none", marginLeft: "auto", gap: "0.25rem" }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startHernoem(staf);
                            }}
                            title="Naam wijzigen"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-secondary)",
                              fontSize: "0.8rem",
                              padding: "2px 5px",
                              borderRadius: 4,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--text-primary)";
                              e.currentTarget.style.background = "var(--surface-raised)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-secondary)";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerwijderBevestigId(staf.id);
                            }}
                            title="Staflid verwijderen"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-secondary)",
                              fontSize: "0.8rem",
                              padding: "2px 5px",
                              borderRadius: 4,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-secondary)";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            🗑
                          </button>
                        </span>
                      </div>
                    )}
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
                            {toonRol(t) && (
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
                                {toonRol(t)}
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
                      <StafKoppelEditor
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
