"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { StafRijData } from "@/components/personen/types";

interface HoverKaartStafProps {
  staflid: StafRijData;
  anchorRef: React.RefObject<HTMLElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function HoverKaartStaf({
  staflid,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}: HoverKaartStafProps) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const kaartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const kaartBreed = 220;
    let left = rect.right + 12;
    let top = rect.top - 40;

    if (left + kaartBreed > window.innerWidth - 12) {
      left = rect.left - kaartBreed - 12;
    }
    if (top + 400 > window.innerHeight - 12) {
      top = window.innerHeight - 400 - 12;
    }
    if (top < 12) top = 12;

    setPos({ top: top + window.scrollY, left: left + window.scrollX });
  }, [anchorRef]);

  const initialen = staflid.naam
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return createPortal(
    <div
      ref={kaartRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 220,
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(160deg, #1a1a1e 0%, #0c0c0f 55%, #121216 100%)",
        border: "2px solid rgba(255, 140, 0, .25)",
        boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 0 20px rgba(255, 140, 0, .08)",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Foto / initialen */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 160,
          overflow: "hidden",
        }}
      >
        {/* Initialen-groot */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 900,
            color: "rgba(255, 140, 0, .2)",
            background: "var(--bg-2)",
          }}
        >
          {initialen}
        </div>

        {/* Memo badge linksboven */}
        {staflid.heeftOpenMemo && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: staflid.memoBadge === "risico" ? "#ef4444" : "#eab308",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))",
            }}
          >
            ▲ {staflid.memoBadge}
          </div>
        )}

        {/* Gradient onderkant */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background: "linear-gradient(transparent, #0c0c0f)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Info */}
      <div style={{ position: "relative", zIndex: 1, padding: "12px 14px 14px" }}>
        {/* Naam */}
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--text-1)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          {staflid.naam}
        </div>

        {/* Primaire rol */}
        {staflid.rollen.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--staf-rol-text)",
              marginBottom: 10,
            }}
          >
            {staflid.rollen[0]}
          </div>
        )}

        {/* Koppelingen */}
        {staflid.teamKoppelingen.length > 0 && (
          <>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: 5,
              }}
            >
              Huidige koppelingen
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-0)",
              }}
            >
              {staflid.teamKoppelingen.map((k, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    color: "var(--text-1)",
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
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--text-3)",
                      marginLeft: "auto",
                    }}
                  >
                    {k.rol}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Email */}
        {staflid.email && (
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{staflid.email}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
