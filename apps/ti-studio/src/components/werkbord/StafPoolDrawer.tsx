// apps/web/src/components/ti-studio/werkbord/StafPoolDrawer.tsx
"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./tokens.css";
import type { WerkbordStaf, WerkbordStafTeamrol, StafKoppelDoel } from "./types";
import type { StafKoppelingView } from "@/components/staf/staf-koppel-types";
import { StafKaart } from "./StafKaart";
import { StafKoppelEditor } from "@/components/staf/StafKoppelEditor";
import { NieuweStafDialog } from "@/app/(protected)/personen/_components/NieuweStafDialog";

type StafFilter = "alle" | "zonder_team" | "ingedeeld";

interface StafPoolDrawerProps {
  open: boolean;
  staf: WerkbordStaf[];
  alleDoelen: StafKoppelDoel[];
  onClose: () => void;
  onStafClick?: (stafId: string) => void;
  /** Optimistische sync naar de kaart-footer na een koppelwijziging. */
  onKoppelingGewijzigd?: (stafId: string, naam: string, nieuweTeams: WerkbordStafTeamrol[]) => void;
  /** Aangeroepen na het aanmaken van een nieuw staflid (host ververst de lijst). */
  onNieuwStaflid?: () => void;
}

export function StafPoolDrawer({
  open,
  staf,
  alleDoelen,
  onClose,
  onStafClick,
  onKoppelingGewijzigd,
  onNieuwStaflid,
}: StafPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<StafFilter>("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  // Lokale kopie voor optimistische koppel-updates; herseed bij verse props.
  const [lokaleStaf, setLokaleStaf] = useState<WerkbordStaf[]>(staf);
  useEffect(() => {
    setLokaleStaf(staf);
  }, [staf]);
  // Welke staf-popover open is + waar (fixed coords, buiten de smalle drawer).
  const [editor, setEditor] = useState<{ stafId: string; x: number; y: number } | null>(null);

  function pasKoppelingenAan(stafId: string, nieuw: StafKoppelingView[]) {
    const genormaliseerd: WerkbordStafTeamrol[] = nieuw.map((k) => ({
      ...k,
      kleur: k.kleur ?? "",
    }));
    setLokaleStaf((prev) =>
      prev.map((s) => (s.id === stafId ? { ...s, teams: genormaliseerd } : s))
    );
    const naam = lokaleStaf.find((s) => s.id === stafId)?.naam ?? "";
    onKoppelingGewijzigd?.(stafId, naam, genormaliseerd);
  }

  const gefilterd = lokaleStaf
    .filter((s) => {
      if (zoek && !s.naam.toLowerCase().includes(zoek.toLowerCase())) return false;
      if (filter === "zonder_team" && s.teams.length > 0) return false;
      if (filter === "ingedeeld" && s.teams.length === 0) return false;
      return true;
    })
    .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));

  const editorStaf = editor ? lokaleStaf.find((s) => s.id === editor.stafId) : null;

  return (
    <aside
      style={{
        width: open ? "var(--pool-w)" : 0,
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease, opacity 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 12px 8px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".7px",
            color: "var(--text-3)",
          }}
        >
          Stafleden
        </div>
        <IconBtn onClick={onClose} title="Sluiten">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconBtn>
      </div>

      {/* Zoekbalk */}
      <div
        style={{
          padding: "8px 10px",
          position: "relative",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        <svg
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-3)",
          }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Zoek staflid..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          style={{
            width: "100%",
            background: "var(--bg-0)",
            border: "1px solid var(--border-1)",
            borderRadius: 7,
            color: "var(--text-1)",
            fontSize: 12,
            fontFamily: "inherit",
            padding: "6px 10px 6px 28px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Filter chips */}
      <div
        style={{
          padding: "7px 10px 6px",
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {(["alle", "zonder_team", "ingedeeld"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "3px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              background: filter === f ? "var(--accent-dim)" : "var(--bg-2)",
              color: filter === f ? "var(--accent)" : "var(--text-3)",
              border: `1px solid ${filter === f ? "rgba(255,107,0,.3)" : "var(--border-1)"}`,
            }}
          >
            {{ alle: "Alle", zonder_team: "Geen team", ingedeeld: "Ingedeeld" }[f]}
          </button>
        ))}
      </div>

      {/* Nieuw staflid */}
      <div
        style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-0)", flexShrink: 0 }}
      >
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            width: "100%",
            padding: "7px 10px",
            borderRadius: 7,
            border: "1px dashed var(--border-1)",
            background: "var(--bg-2)",
            color: "var(--text-2)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Nieuw staflid
        </button>
      </div>

      {/* Staflijst */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: "10px 10px 4px",
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: "var(--text-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Staf</span>
          <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{gefilterd.length}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 8px 12px" }}>
          {gefilterd.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
              <div
                onClick={() => onStafClick?.(s.id)}
                style={{ flex: 1, minWidth: 0, cursor: onStafClick ? "pointer" : "default" }}
              >
                <StafKaart staf={s} />
              </div>
              <button
                title="Koppel aan team of selectie"
                aria-label={`Koppel ${s.naam} aan team of selectie`}
                onClick={(e) => {
                  e.stopPropagation();
                  const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setEditor(
                    editor?.stafId === s.id ? null : { stafId: s.id, x: r.right + 8, y: r.top }
                  );
                }}
                style={{
                  flexShrink: 0,
                  width: 26,
                  alignSelf: "center",
                  height: 26,
                  borderRadius: 6,
                  border: `1px solid ${editor?.stafId === s.id ? "var(--accent)" : "var(--border-1)"}`,
                  background: editor?.stafId === s.id ? "var(--accent-dim)" : "var(--bg-2)",
                  color: editor?.stafId === s.id ? "var(--accent)" : "var(--text-3)",
                  cursor: "pointer",
                  fontSize: 15,
                  lineHeight: 1,
                  fontFamily: "inherit",
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>

        {gefilterd.length === 0 && (
          <div
            style={{
              padding: "20px 12px",
              fontSize: 12,
              color: "var(--text-3)",
              textAlign: "center",
            }}
          >
            Geen stafleden gevonden
          </div>
        )}
      </div>

      {/* Koppel-popover — via portal + fixed positie zodat hij niet door de
          smalle drawer (overflow:hidden) wordt geclipt. */}
      {editor &&
        editorStaf &&
        createPortal(
          <div style={{ position: "fixed", left: editor.x, top: editor.y, zIndex: 1000 }}>
            <StafKoppelEditor
              staf={{ id: editorStaf.id, naam: editorStaf.naam, teams: editorStaf.teams }}
              alleDoelen={alleDoelen}
              onClose={() => setEditor(null)}
              onGewijzigd={(nieuw) => pasKoppelingenAan(editorStaf.id, nieuw)}
            />
          </div>,
          document.body
        )}

      <NieuweStafDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAangemaakt={() => onNieuwStaflid?.()}
      />
    </aside>
  );
}

function IconBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-3)",
      }}
    >
      {children}
    </button>
  );
}
