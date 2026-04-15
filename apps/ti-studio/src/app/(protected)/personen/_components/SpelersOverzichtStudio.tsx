"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { StudioSpeler } from "../actions";
import { updateSpelerStatus } from "../../indeling/werkindeling-actions";
import { setGezienStatus, zetSpelerIndeling } from "../speler-edit-actions";

type IndelingsDoel = {
  id: string;
  naam: string;
  kleur: string | null;
  type: "team" | "selectie";
};
type SpelerStatusWaarde =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GEBLESSEERD"
  | "GAAT_STOPPEN"
  | "NIEUW_POTENTIEEL"
  | "NIEUW_DEFINITIEF"
  | "ALGEMEEN_RESERVE";

const SPELER_STATUS_OPTIES: { value: SpelerStatusWaarde; label: string }[] = [
  { value: "BESCHIKBAAR", label: "Beschikbaar" },
  { value: "TWIJFELT", label: "Twijfelt" },
  { value: "GEBLESSEERD", label: "Geblesseerd" },
  { value: "GAAT_STOPPEN", label: "Gaat stoppen" },
  { value: "NIEUW_POTENTIEEL", label: "Nieuw potentieel" },
  { value: "NIEUW_DEFINITIEF", label: "Nieuw definitief" },
  { value: "ALGEMEEN_RESERVE", label: "Reserve" },
];

type SortKey =
  | "achternaam"
  | "geboortejaar"
  | "status"
  | "gezienStatus"
  | "huidigTeam"
  | "indeling"
  | "memo";
type SortDir = "asc" | "desc";
type StatusFilter =
  | "allen"
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GAAT_STOPPEN"
  | "NIEUW"
  | "ALGEMEEN_RESERVE";

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GEBLESSEERD: "Geblesseerd",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
  ALGEMEEN_RESERVE: "Reserve",
};

const STATUS_DOT: Record<string, string> = {
  BESCHIKBAAR: "#22c55e",
  TWIJFELT: "#f59e0b",
  GEBLESSEERD: "#f97316",
  GAAT_STOPPEN: "#ef4444",
  NIEUW_POTENTIEEL: "#3b82f6",
  NIEUW_DEFINITIEF: "#3b82f6",
  ALGEMEEN_RESERVE: "#6b7280",
};

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
};

function matchesStatusFilter(speler: StudioSpeler, filter: StatusFilter): boolean {
  if (filter === "allen") return true;
  if (filter === "NIEUW")
    return speler.status === "NIEUW_POTENTIEEL" || speler.status === "NIEUW_DEFINITIEF";
  return speler.status === filter;
}

interface Props {
  spelers: StudioSpeler[];
  onOpenProfiel: (spelerId: string) => void;
  kadersId: string | null;
  versieId: string | null;
  versieDoelen: IndelingsDoel[];
}

export default function SpelersOverzichtStudio({
  spelers,
  onOpenProfiel,
  kadersId,
  versieId,
  versieDoelen,
}: Props) {
  const router = useRouter();
  const [editorCel, setEditorCel] = useState<{
    spelerId: string;
    kolom: "status" | "gezien" | "indeling";
  } | null>(null);
  const [optimistischIndeling, setOptimistischIndeling] = useState<
    Record<string, { naam: string; kleur: string | null } | null>
  >({});
  const [optimistischStatus, setOptimistischStatus] = useState<Record<string, string>>({});
  const [optimistischGezien, setOptimistischGezien] = useState<
    Record<string, "ONGEZIEN" | "GROEN">
  >({});
  const [foutMelding, setFoutMelding] = useState<string | null>(null);
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("allen");
  const [huidigTeamFilter, setHuidigTeamFilter] = useState("allen");
  const [indelingFilter, setIndelingFilter] = useState("allen");
  const [memoFilter, setMemoFilter] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("achternaam");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const huidigeTeams = useMemo(
    () => [...new Set(spelers.map((s) => s.huidigTeamNaam).filter(Boolean))].sort() as string[],
    [spelers]
  );
  const indelingTeams = useMemo(
    () =>
      [
        ...new Set(spelers.map((s) => s.huidigIndelingTeam?.naam).filter(Boolean)),
      ].sort() as string[],
    [spelers]
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const gefilterd = useMemo(() => {
    let result = spelers;
    if (zoekterm.trim()) {
      const q = zoekterm.trim().toLowerCase();
      result = result.filter(
        (s) => s.roepnaam.toLowerCase().includes(q) || s.achternaam.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "allen")
      result = result.filter((s) => matchesStatusFilter(s, statusFilter));
    if (huidigTeamFilter !== "allen")
      result = result.filter((s) => s.huidigTeamNaam === huidigTeamFilter);
    if (indelingFilter !== "allen")
      result = result.filter((s) => s.huidigIndelingTeam?.naam === indelingFilter);
    if (memoFilter) result = result.filter((s) => s.heeftActiefMemo);

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "achternaam":
          cmp = a.achternaam.localeCompare(b.achternaam, "nl");
          break;
        case "geboortejaar":
          cmp = (a.geboortejaar ?? 0) - (b.geboortejaar ?? 0);
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "", "nl");
          break;
        case "gezienStatus": {
          const v = ["ROOD", "ORANJE", "GEEL", "GROEN", "ONGEZIEN"];
          cmp = v.indexOf(a.gezienStatus) - v.indexOf(b.gezienStatus);
          break;
        }
        case "huidigTeam":
          cmp = (a.huidigTeamNaam ?? "zzz").localeCompare(b.huidigTeamNaam ?? "zzz", "nl");
          break;
        case "indeling":
          cmp = (a.huidigIndelingTeam?.naam ?? "zzz").localeCompare(
            b.huidigIndelingTeam?.naam ?? "zzz",
            "nl"
          );
          break;
        case "memo":
          cmp = Number(b.heeftActiefMemo) - Number(a.heeftActiefMemo);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    spelers,
    zoekterm,
    statusFilter,
    huidigTeamFilter,
    indelingFilter,
    memoFilter,
    sortKey,
    sortDir,
  ]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return (
      <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}>
        {" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const chipStyle = (actief: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.625rem",
    borderRadius: 99,
    border: actief ? "1px solid var(--ow-oranje-500)" : "1px solid var(--border-default)",
    background: actief ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
    color: actief ? "var(--ow-oranje-500)" : "var(--text-secondary)",
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

  const thStyle = (sortable: boolean): React.CSSProperties => ({
    padding: "0.625rem 0.875rem",
    textAlign: "left",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    cursor: sortable ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {foutMelding && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#f87171",
            fontSize: "0.8125rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <span>⚠ {foutMelding}</span>
          <button
            type="button"
            onClick={() => setFoutMelding(null)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "1rem",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
      {/* Filterbar */}
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
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {(
            [
              { value: "allen", label: "Allen" },
              { value: "BESCHIKBAAR", label: "Beschikbaar" },
              { value: "TWIJFELT", label: "Twijfelt" },
              { value: "GAAT_STOPPEN", label: "Gaat stoppen" },
              { value: "NIEUW", label: "Nieuw" },
              { value: "ALGEMEEN_RESERVE", label: "Reserve" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={chipStyle(statusFilter === value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={huidigTeamFilter}
          onChange={(e) => setHuidigTeamFilter(e.target.value)}
          style={dropdownStyle}
        >
          <option value="allen">Huidig team: Allen</option>
          {huidigeTeams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={indelingFilter}
          onChange={(e) => setIndelingFilter(e.target.value)}
          style={dropdownStyle}
        >
          <option value="allen">Indeling: Allen</option>
          {indelingTeams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button onClick={() => setMemoFilter((v) => !v)} style={chipStyle(memoFilter)}>
          ▲ Memo
        </button>
        <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          {gefilterd.length} speler{gefilterd.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabel */}
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
              <th onClick={() => handleSort("achternaam")} style={thStyle(true)}>
                Naam
                <SortIcon col="achternaam" />
              </th>
              <th onClick={() => handleSort("geboortejaar")} style={thStyle(true)}>
                Jaar
                <SortIcon col="geboortejaar" />
              </th>
              <th onClick={() => handleSort("status")} style={thStyle(true)}>
                Status
                <SortIcon col="status" />
              </th>
              <th onClick={() => handleSort("gezienStatus")} style={thStyle(true)}>
                Gezien
                <SortIcon col="gezienStatus" />
              </th>
              <th onClick={() => handleSort("huidigTeam")} style={thStyle(true)}>
                Huidig team
                <SortIcon col="huidigTeam" />
              </th>
              <th onClick={() => handleSort("indeling")} style={thStyle(true)}>
                Indeling
                <SortIcon col="indeling" />
              </th>
              <th
                onClick={() => handleSort("memo")}
                style={{ ...thStyle(true), textAlign: "center" }}
              >
                ▲
                <SortIcon col="memo" />
              </th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Geen spelers gevonden
                </td>
              </tr>
            )}
            {gefilterd.map((speler, i) => {
              const init =
                `${speler.roepnaam.charAt(0)}${(speler.achternaam.split(" ").at(-1) ?? speler.achternaam).charAt(0)}`.toUpperCase();
              const geslachtKleur = speler.geslacht === "V" ? "#f9a8d4" : "#93c5fd";
              const geslachtBg =
                speler.geslacht === "V" ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)";
              const statusEffectief = optimistischStatus[speler.id] ?? speler.status;
              const statusDot = STATUS_DOT[statusEffectief] ?? "#6b7280";
              // Gezien is vereenvoudigd tot ONGEZIEN/GROEN. Legacy waarden
              // (GEEL/ORANJE/ROOD) worden als "gezien" behandeld.
              const gezienServer = speler.gezienStatus === "ONGEZIEN" ? "ONGEZIEN" : "GROEN";
              const gezienEffectief: "ONGEZIEN" | "GROEN" =
                optimistischGezien[speler.id] ?? gezienServer;
              const huidigKleur =
                KLEUR_DOT[speler.huidigTeamKleur?.toLowerCase() ?? ""] ??
                KLEUR_DOT[speler.huidigTeamKleur ?? ""] ??
                "#6b7280";
              // Gebruik optimistische indeling als die bestaat, anders de server-waarde
              const indelingTeam =
                speler.id in optimistischIndeling
                  ? optimistischIndeling[speler.id]
                  : speler.huidigIndelingTeam;
              const indelingKleur =
                KLEUR_DOT[indelingTeam?.kleur?.toLowerCase() ?? ""] ??
                KLEUR_DOT[indelingTeam?.kleur ?? ""] ??
                "#6b7280";

              return (
                <tr
                  key={speler.id}
                  style={{
                    borderBottom:
                      i < gefilterd.length - 1 ? "1px solid var(--border-default)" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  {/* Naam + avatar — klik opent profiel */}
                  <td
                    style={{ padding: "0.625rem 0.875rem", cursor: "pointer" }}
                    onClick={() => onOpenProfiel(speler.id)}
                    title="Open spelerprofiel"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: geslachtBg,
                          border: `1.5px solid ${geslachtKleur}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          color: geslachtKleur,
                          flexShrink: 0,
                        }}
                      >
                        {init}
                      </div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {speler.roepnaam} {speler.achternaam}
                      </span>
                    </div>
                  </td>

                  {/* Jaar */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {speler.geboortejaar} ·{" "}
                      {new Date().getFullYear() - (speler.geboortejaar ?? 0)}
                    </span>
                  </td>

                  {/* Status — inline bewerkbaar */}
                  <td style={{ padding: "0.625rem 0.875rem", position: "relative" }}>
                    <button
                      type="button"
                      disabled={!kadersId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditorCel(
                          editorCel?.spelerId === speler.id && editorCel.kolom === "status"
                            ? null
                            : { spelerId: speler.id, kolom: "status" }
                        );
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8125rem",
                        color: "var(--text-primary)",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: kadersId ? "pointer" : "default",
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: statusDot,
                          flexShrink: 0,
                        }}
                      />
                      {STATUS_LABELS[statusEffectief] ?? statusEffectief}
                    </button>
                    {editorCel?.spelerId === speler.id &&
                      editorCel.kolom === "status" &&
                      kadersId && (
                        <StatusDropdown
                          huidig={statusEffectief as SpelerStatusWaarde}
                          onKies={async (nieuw) => {
                            setOptimistischStatus((prev) => ({ ...prev, [speler.id]: nieuw }));
                            setEditorCel(null);
                            try {
                              await updateSpelerStatus(kadersId, speler.id, nieuw);
                              router.refresh();
                            } catch (err) {
                              setOptimistischStatus((prev) => {
                                const kopie = { ...prev };
                                delete kopie[speler.id];
                                return kopie;
                              });
                              setFoutMelding(
                                err instanceof Error ? err.message : "Kon status niet bijwerken"
                              );
                            }
                          }}
                          onClose={() => setEditorCel(null)}
                        />
                      )}
                  </td>

                  {/* Gezien — toggle groen/grijs */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <button
                      type="button"
                      disabled={!kadersId}
                      title={gezienEffectief === "GROEN" ? "Gezien" : "Niet gezien"}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!kadersId) return;
                        const nieuw = gezienEffectief === "GROEN" ? "ONGEZIEN" : "GROEN";
                        setOptimistischGezien((prev) => ({ ...prev, [speler.id]: nieuw }));
                        const resultaat = await setGezienStatus(kadersId, speler.id, nieuw);
                        if (resultaat.ok) {
                          router.refresh();
                        } else {
                          setOptimistischGezien((prev) => {
                            const kopie = { ...prev };
                            delete kopie[speler.id];
                            return kopie;
                          });
                          setFoutMelding(resultaat.error);
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "2px 4px",
                        cursor: kadersId ? "pointer" : "default",
                        fontSize: "0.95rem",
                        color: gezienEffectief === "GROEN" ? "#22c55e" : "#4b5563",
                        opacity: gezienEffectief === "GROEN" ? 1 : 0.35,
                        fontFamily: "inherit",
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </button>
                  </td>

                  {/* Huidig team */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {speler.huidigTeamNaam ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "var(--surface-raised)",
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
                            background: huidigKleur,
                          }}
                        />
                        {speler.huidigTeamNaam}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                        —
                      </span>
                    )}
                  </td>

                  {/* Indelingsteam — inline bewerkbaar met [+] of chip + [x] */}
                  <td style={{ padding: "0.625rem 0.875rem", position: "relative" }}>
                    {indelingTeam ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 6,
                          padding: "0.15rem 0.15rem 0.15rem 0.5rem",
                          fontSize: "0.75rem",
                          color: "#4ade80",
                          fontWeight: 500,
                        }}
                      >
                        <button
                          type="button"
                          disabled={!versieId}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditorCel(
                              editorCel?.spelerId === speler.id && editorCel.kolom === "indeling"
                                ? null
                                : { spelerId: speler.id, kolom: "indeling" }
                            );
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            background: "none",
                            border: "none",
                            padding: "0.05rem 0.15rem",
                            margin: 0,
                            cursor: versieId ? "pointer" : "default",
                            color: "inherit",
                            fontFamily: "inherit",
                            fontSize: "inherit",
                            fontWeight: "inherit",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: indelingKleur,
                              flexShrink: 0,
                            }}
                          />
                          {indelingTeam.naam}
                        </button>
                        <button
                          type="button"
                          disabled={!versieId}
                          aria-label={`Haal ${speler.roepnaam} uit ${indelingTeam.naam}`}
                          title="Verwijder indeling"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!versieId) return;
                            setOptimistischIndeling((prev) => ({ ...prev, [speler.id]: null }));
                            const resultaat = await zetSpelerIndeling(versieId, speler.id, null);
                            if (resultaat.ok) {
                              router.refresh();
                            } else {
                              setOptimistischIndeling((prev) => {
                                const kopie = { ...prev };
                                delete kopie[speler.id];
                                return kopie;
                              });
                              setFoutMelding(resultaat.error);
                            }
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: "none",
                            background: "rgba(34,197,94,0.18)",
                            color: "#4ade80",
                            cursor: versieId ? "pointer" : "default",
                            padding: 0,
                            fontFamily: "inherit",
                            lineHeight: 1,
                            fontSize: "0.75rem",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(239,68,68,0.25)";
                            (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(34,197,94,0.18)";
                            (e.currentTarget as HTMLButtonElement).style.color = "#4ade80";
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!versieId}
                        aria-label={`Wijs ${speler.roepnaam} toe aan team of selectie`}
                        title="Voeg indeling toe"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditorCel(
                            editorCel?.spelerId === speler.id && editorCel.kolom === "indeling"
                              ? null
                              : { spelerId: speler.id, kolom: "indeling" }
                          );
                        }}
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
                          cursor: versieId ? "pointer" : "default",
                          padding: 0,
                          fontFamily: "inherit",
                          fontSize: "0.95rem",
                          lineHeight: 1,
                          opacity: versieId ? 0.7 : 0.35,
                          transition: "opacity 120ms, border-color 120ms, color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          if (!versieId) return;
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.opacity = "1";
                          b.style.borderColor = "var(--accent)";
                          b.style.color = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.opacity = versieId ? "0.7" : "0.35";
                          b.style.borderColor = "var(--border-default)";
                          b.style.color = "var(--text-secondary)";
                        }}
                      >
                        +
                      </button>
                    )}
                    {editorCel?.spelerId === speler.id &&
                      editorCel.kolom === "indeling" &&
                      versieId && (
                        <IndelingDropdown
                          teams={versieDoelen}
                          huidigId={
                            versieDoelen.find((t) => t.naam === indelingTeam?.naam)?.id ?? null
                          }
                          onKies={async (doel) => {
                            const nieuwDoel = doel
                              ? (versieDoelen.find((t) => t.id === doel.id) ?? null)
                              : null;
                            setOptimistischIndeling((prev) => ({
                              ...prev,
                              [speler.id]: nieuwDoel
                                ? { naam: nieuwDoel.naam, kleur: nieuwDoel.kleur }
                                : null,
                            }));
                            setEditorCel(null);
                            const resultaat = await zetSpelerIndeling(versieId, speler.id, doel);
                            if (resultaat.ok) {
                              router.refresh();
                            } else {
                              setOptimistischIndeling((prev) => {
                                const kopie = { ...prev };
                                delete kopie[speler.id];
                                return kopie;
                              });
                              setFoutMelding(resultaat.error);
                            }
                          }}
                          onClose={() => setEditorCel(null)}
                        />
                      )}
                  </td>

                  {/* Memo indicator */}
                  <td style={{ padding: "0.625rem 0.875rem", textAlign: "center" }}>
                    {speler.heeftActiefMemo && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--ow-oranje-500)",
                          fontWeight: 700,
                        }}
                      >
                        ▲
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inline dropdown helpers ────────────────────────────────────────────────

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  zIndex: 50,
  background: "var(--surface-card)",
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "0.375rem",
  minWidth: 180,
  maxHeight: 260,
  overflowY: "auto",
  boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const popoverItemStyle = (actief: boolean): React.CSSProperties => ({
  padding: "0.375rem 0.5rem",
  borderRadius: 6,
  background: actief ? "rgba(255,107,0,0.12)" : "transparent",
  color: actief ? "var(--ow-oranje-500)" : "var(--text-primary)",
  fontSize: "0.8125rem",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 6,
});

function StatusDropdown({
  huidig,
  onKies,
  onClose,
}: {
  huidig: SpelerStatusWaarde;
  onKies: (nieuw: string) => void;
  onClose: () => void;
}) {
  const [, startTransition] = useTransition();
  const ref = useClickOutside(onClose);
  return (
    <div ref={ref} style={popoverStyle} onClick={(e) => e.stopPropagation()}>
      {SPELER_STATUS_OPTIES.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => startTransition(() => onKies(opt.value))}
          style={popoverItemStyle(opt.value === huidig)}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: STATUS_DOT[opt.value] ?? "#6b7280",
              flexShrink: 0,
            }}
          />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function IndelingDropdown({
  teams,
  huidigId,
  onKies,
  onClose,
}: {
  teams: IndelingsDoel[];
  huidigId: string | null;
  onKies: (doel: { id: string; type: "team" | "selectie" } | null) => Promise<void> | void;
  onClose: () => void;
}) {
  const ref = useClickOutside(onClose);
  // Groepeer: losse teams eerst, dan gebundelde selecties
  const losseTeams = teams.filter((t) => t.type === "team");
  const selecties = teams.filter((t) => t.type === "selectie");
  return (
    <div ref={ref} style={popoverStyle} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => {
          void onKies(null);
        }}
        style={popoverItemStyle(huidigId === null)}
      >
        <span style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
          — geen indeling —
        </span>
      </button>
      {teams.length === 0 && (
        <div
          style={{
            padding: "0.375rem 0.5rem",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            fontStyle: "italic",
          }}
        >
          Geen teams in versie
        </div>
      )}
      {losseTeams.map((t) => {
        const kleur =
          KLEUR_DOT[(t.kleur ?? "").toLowerCase()] ?? KLEUR_DOT[t.kleur ?? ""] ?? "#6b7280";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              void onKies({ id: t.id, type: "team" });
            }}
            style={popoverItemStyle(t.id === huidigId)}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: kleur,
                flexShrink: 0,
              }}
            />
            {t.naam}
          </button>
        );
      })}
      {selecties.length > 0 && (
        <>
          <div
            style={{
              fontSize: "0.625rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-secondary)",
              padding: "0.375rem 0.5rem 0.2rem",
              marginTop: losseTeams.length > 0 ? "0.25rem" : 0,
              borderTop: losseTeams.length > 0 ? "1px solid var(--border-default)" : "none",
            }}
          >
            Selecties (gecombineerd)
          </div>
          {selecties.map((t) => {
            const kleur =
              KLEUR_DOT[(t.kleur ?? "").toLowerCase()] ?? KLEUR_DOT[t.kleur ?? ""] ?? "#6b7280";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  void onKies({ id: t.id, type: "selectie" });
                }}
                style={popoverItemStyle(t.id === huidigId)}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: kleur,
                    flexShrink: 0,
                  }}
                />
                {t.naam}
                <span
                  style={{
                    fontSize: "0.6rem",
                    padding: "0.1rem 0.35rem",
                    borderRadius: 4,
                    background: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                    fontWeight: 700,
                    marginLeft: "auto",
                  }}
                >
                  SEL
                </span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
