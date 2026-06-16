"use client";

import { useEffect, useRef, useState } from "react";
import type { PubliekeSpeler, PubliekTeam } from "@/lib/teamindeling/publieke-presentatie";

function volleNaam(sp: PubliekeSpeler): string {
  return [sp.roepnaam, sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(" ");
}

type ZoekResultaat = {
  naam: string;
  teamnaam: string;
  teamIdx: number;
};

export function ZoekOverlay({
  teams,
  onSluit,
  onKiesTeam,
}: {
  teams: PubliekTeam[];
  onSluit: () => void;
  onKiesTeam: (idx: number) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const resultaten: ZoekResultaat[] = [];

  if (q.length >= 1) {
    teams.forEach((team, teamIdx) => {
      const directe = [...team.dames, ...team.heren];
      directe.forEach((sp) => {
        const naam = volleNaam(sp);
        if (naam.toLowerCase().includes(q)) resultaten.push({ naam, teamnaam: team.naam, teamIdx });
      });
      team.subteams.forEach((sub) => {
        [...sub.dames, ...sub.heren].forEach((sp) => {
          const naam = volleNaam(sp);
          if (naam.toLowerCase().includes(q))
            resultaten.push({ naam, teamnaam: `${team.naam} → ${sub.naam}`, teamIdx });
        });
      });
    });
  }

  const gezien = new Set<string>();
  const uniek = resultaten.filter((r) => {
    const key = `${r.naam}__${r.teamIdx}`;
    if (gezien.has(key)) return false;
    gezien.add(key);
    return true;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 60,
      }}
      onClick={onSluit}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          width: "min(480px, calc(100vw - 32px))",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 30px rgba(255,102,0,0.08)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "14px 14px 0" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op naam…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)",
              border: "2px solid #FF6600",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 16,
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "6px 0" }}>
          {q.length === 0 && (
            <div
              style={{
                padding: "20px 14px",
                color: "rgba(255,255,255,0.35)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Typ een naam om te zoeken · <kbd style={{ fontSize: 11, opacity: 0.6 }}>Ctrl+K</kbd>
            </div>
          )}
          {q.length > 0 && uniek.length === 0 && (
            <div
              style={{
                padding: "20px 14px",
                color: "rgba(255,255,255,0.35)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Geen resultaten
            </div>
          )}
          {uniek.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onKiesTeam(r.teamIdx);
                onSluit();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#FF6600",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
                  {r.naam}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                  {r.teamnaam}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div
          style={{
            padding: "10px 14px",
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          Tap of klik buiten dit venster om te sluiten
        </div>
      </div>
    </div>
  );
}
