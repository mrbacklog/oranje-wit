"use client";

import { useRef, useState } from "react";
import type { StafRijData } from "@/components/personen/types";
import { MemoCel } from "@/components/personen/spelers/MemoCel";
import { HoverKaartStaf } from "./HoverKaartStaf";

interface StafTabelRijProps {
  staflid: StafRijData;
  onOpenDialog: (id: string) => void;
}

export function StafTabelRij({ staflid, onOpenDialog }: StafTabelRijProps) {
  const naamRef = useRef<HTMLSpanElement>(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialen = staflid.naam
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleMouseEnterNaam = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoverOpen(true), 300);
  };

  const handleMouseLeaveNaam = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    closeTimerRef.current = setTimeout(() => setHoverOpen(false), 150);
  };

  return (
    <div
      className="staf-tabel-rij"
      style={{
        borderLeft: "3px solid rgba(255,140,0,.4)",
        borderBottom: "1px solid var(--border-0)",
        background: "transparent",
        transition: "background 100ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.02)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Naam + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div className="staf-av" style={{ width: 36, height: 36, flexShrink: 0 }}>
          <div className="initialen" style={{ fontSize: 12 }}>
            {initialen}
          </div>
        </div>
        <span
          ref={naamRef}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-1)",
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={handleMouseEnterNaam}
          onMouseLeave={handleMouseLeaveNaam}
          onClick={() => onOpenDialog(staflid.id)}
        >
          {staflid.naam}
        </span>
      </div>

      {/* Globale rollen */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          overflow: "hidden",
        }}
      >
        {staflid.rollen.length === 0 ? (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
        ) : (
          staflid.rollen.map((rol, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--staf-rol-text)",
                background: "rgba(255,140,0,.06)",
                border: "1px solid rgba(255,140,0,.15)",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              {rol}
            </span>
          ))
        )}
      </div>

      {/* Team-koppelingen */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, overflow: "hidden" }}>
        {staflid.teamKoppelingen.length === 0 ? (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
        ) : (
          staflid.teamKoppelingen.map((k, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--text-2)",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--staf-accent)",
                  flexShrink: 0,
                }}
              />
              {k.teamNaam}
              <span style={{ fontSize: 9, color: "var(--text-3)" }}>({k.rol})</span>
            </span>
          ))
        )}
      </div>

      {/* Memo */}
      <MemoCel badge={staflid.memoBadge} />

      {/* Actie */}
      <button
        onClick={() => onOpenDialog(staflid.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-3)",
          padding: "4px 6px",
          borderRadius: "var(--radius-sm)",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
        }}
        aria-label={`Bekijk ${staflid.naam}`}
      >
        ⋯
      </button>

      {/* HoverKaart */}
      {hoverOpen && (
        <HoverKaartStaf
          staflid={staflid}
          anchorRef={naamRef}
          onMouseEnter={() => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          }}
          onMouseLeave={() => {
            closeTimerRef.current = setTimeout(() => setHoverOpen(false), 150);
          }}
        />
      )}
    </div>
  );
}
