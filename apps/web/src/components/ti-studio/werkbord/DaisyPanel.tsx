// apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx
"use client";
import { useState } from "react";
import "./tokens.css";

export function DaisyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          display: open ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          cursor: "pointer",
          border: "none",
          boxShadow: "0 4px 16px rgba(255,107,0,.45)",
          zIndex: 30,
          fontFamily: "inherit",
        }}
      >
        ✦
      </button>

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: "var(--daisy-w)",
          height: 420,
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.15)",
          zIndex: 30,
          overflow: "hidden",
          transform: open ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "bottom right",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-0)",
            flexShrink: 0,
            background: "linear-gradient(90deg, rgba(255,107,0,.08) 0%, transparent 60%)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #FF8533)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(255,107,0,.3)",
              position: "relative",
            }}
          >
            ✦
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--ok)",
                position: "absolute",
                bottom: 0,
                right: 0,
                border: "2px solid var(--bg-1)",
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Daisy</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>AI-assistent · Teamindeling</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              marginLeft: "auto",
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
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Berichten */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                flexShrink: 0,
                background: "linear-gradient(135deg, var(--accent), #FF8533)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              ✦
            </div>
            <div>
              <div
                style={{
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-1)",
                  borderBottomLeftRadius: 4,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Hoi! Ik ben Daisy. Ik help je met de teamindeling. Wat wil je weten?
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4 }}>Nu</div>
            </div>
          </div>
        </div>

        {/* Quick prompts */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "6px 12px 0",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          {["Welk team heeft ruimte?", "Leeftijdsbalans?", "Validatiefouten?"].map((p) => (
            <button
              key={p}
              style={{
                padding: "4px 9px",
                borderRadius: 6,
                whiteSpace: "nowrap",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(255,107,0,.2)",
                fontFamily: "inherit",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--border-0)",
            display: "flex",
            gap: 6,
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <textarea
            placeholder="Vraag Daisy iets..."
            rows={1}
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--border-1)",
              borderRadius: 10,
              color: "var(--text-1)",
              fontSize: 12,
              fontFamily: "inherit",
              padding: "8px 12px",
              outline: "none",
              resize: "none",
              minHeight: 36,
              maxHeight: 80,
              lineHeight: 1.4,
            }}
          />
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}
