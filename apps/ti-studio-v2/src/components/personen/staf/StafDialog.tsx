"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { StafRijData } from "@/components/personen/types";

interface StafDialogProps {
  staflid: StafRijData;
  onClose: () => void;
}

export function StafDialog({ staflid, onClose }: StafDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          zIndex: 10000,
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Staflid: ${staflid.naam}`}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 440,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--bg-2)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-1)",
          boxShadow: "0 24px 64px rgba(0,0,0,.8)",
          zIndex: 10001,
          outline: "none",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>
              {staflid.naam}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{staflid.id}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              fontSize: 20,
            }}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Rollen
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {staflid.rollen.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Geen rollen</span>
            ) : (
              staflid.rollen.map((rol, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--staf-rol-text)",
                    background: "rgba(255,140,0,.06)",
                    border: "1px solid rgba(255,140,0,.15)",
                    borderRadius: 4,
                    padding: "2px 8px",
                  }}
                >
                  {rol}
                </span>
              ))
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Team-koppelingen
          </div>
          {staflid.teamKoppelingen.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>Geen koppelingen</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {staflid.teamKoppelingen.map((k, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--text-2)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--staf-accent)",
                      flexShrink: 0,
                    }}
                  />
                  {k.teamNaam}
                  <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: "auto" }}>
                    {k.rol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "1px solid var(--border-1)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
