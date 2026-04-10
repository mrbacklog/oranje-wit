"use client";

import { useState } from "react";
import type { MemoData } from "@/components/ti-studio/werkbord/types";

// ──────────────────────────────────────────────────────────
// Design tokens
// ──────────────────────────────────────────────────────────

const T = {
  bg2: "#1e1e1e",
  bg3: "#262626",
  accent: "#ff6b00",
  accentDim: "rgba(255,107,0,.12)",
  accentBorder: "rgba(255,107,0,.4)",
  accentHover: "#ff8533",
  text1: "#fafafa",
  text2: "#a3a3a3",
  text3: "#666666",
  border0: "#262626",
  border1: "#3a3a3a",
  ok: "#22c55e",
  okDim: "rgba(34,197,94,.12)",
  okBorder: "rgba(34,197,94,.3)",
};

// ──────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────

export interface MemoPanelProps {
  memo: MemoData;
  onSave: (data: MemoData) => Promise<void>;
  opslaanBezig?: boolean;
}

// ──────────────────────────────────────────────────────────
// MemoPanel
// ──────────────────────────────────────────────────────────

export function MemoPanel({ memo, onSave, opslaanBezig = false }: MemoPanelProps) {
  const [tekst, setTekst] = useState(memo.tekst);
  const [besluit, setBesluit] = useState(memo.besluit ?? "");
  const [sluitenFlow, setSluitenFlow] = useState(false);
  const [bezig, setBezig] = useState(false);

  const isBusy = opslaanBezig || bezig;

  async function opslaan(data: MemoData) {
    setBezig(true);
    try {
      await onSave(data);
    } finally {
      setBezig(false);
    }
  }

  async function handleOpslaan() {
    await opslaan({ tekst, memoStatus: memo.memoStatus, besluit: memo.besluit });
  }

  async function handleSluiten() {
    if (!sluitenFlow) {
      setSluitenFlow(true);
      return;
    }
    await opslaan({ tekst, memoStatus: "gesloten", besluit: besluit || null });
    setSluitenFlow(false);
  }

  async function handleHeropenen() {
    setBesluit("");
    await opslaan({ tekst, memoStatus: "open", besluit: null });
  }

  const isOpen = memo.memoStatus === "open";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 8,
          background: isOpen ? T.accentDim : T.bg3,
          border: `1px solid ${isOpen ? T.accentBorder : T.border1}`,
        }}
      >
        <span style={{ fontSize: 13, color: isOpen ? T.accent : T.text2 }}>
          {isOpen ? "▲ Open — actie vereist" : "▲ Gesloten — besluit genomen"}
        </span>
        <span style={{ flex: 1 }} />
        {isOpen ? (
          <button onClick={handleSluiten} disabled={isBusy} style={btnStyle(T.ok, T.okDim, isBusy)}>
            {sluitenFlow ? "Bevestig sluiten" : "✓ Sluiten met besluit"}
          </button>
        ) : (
          <button
            onClick={handleHeropenen}
            disabled={isBusy}
            style={btnStyle(T.text2, T.bg3, isBusy)}
          >
            ↩ Heropenen
          </button>
        )}
      </div>

      {/* Memo tekstveld */}
      <textarea
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        readOnly={!isOpen}
        placeholder="Schrijf een memo…"
        rows={4}
        style={{
          width: "100%",
          background: isOpen ? T.bg2 : T.bg3,
          border: `1px ${isOpen ? "dashed" : "solid"} ${T.border1}`,
          borderRadius: 9,
          padding: "10px 12px",
          color: isOpen ? T.text1 : T.text2,
          fontSize: 12,
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.55,
          resize: "none",
          outline: "none",
          boxSizing: "border-box",
          cursor: isOpen ? "text" : "default",
        }}
      />

      {/* Besluit-invulveld (alleen bij sluiten flow) */}
      {sluitenFlow && isOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{ fontSize: 11, fontWeight: 600, color: T.text3, textTransform: "uppercase" }}
          >
            Besluit
          </label>
          <textarea
            value={besluit}
            onChange={(e) => setBesluit(e.target.value)}
            placeholder="Noteer het besluit…"
            rows={3}
            style={{
              width: "100%",
              background: T.bg2,
              border: `1px dashed ${T.okBorder}`,
              borderRadius: 9,
              padding: "10px 12px",
              color: T.text1,
              fontSize: 12,
              fontFamily: "Inter, system-ui, sans-serif",
              lineHeight: 1.55,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Besluit weergave (gesloten) */}
      {!isOpen && memo.besluit && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 9,
            background: T.okDim,
            border: `1px solid ${T.okBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              color: T.ok,
              marginBottom: 4,
            }}
          >
            Besluit
          </div>
          <div style={{ fontSize: 12, color: T.text1, lineHeight: 1.55 }}>{memo.besluit}</div>
        </div>
      )}

      {/* Opslaan (alleen als open en geen sluiten-flow) */}
      {isOpen && !sluitenFlow && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleOpslaan}
            disabled={isBusy}
            style={btnStyle(T.accent, T.accentDim, isBusy)}
          >
            {isBusy ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Hulpfunctie
// ──────────────────────────────────────────────────────────

function btnStyle(kleur: string, bg: string, disabled: boolean): React.CSSProperties {
  return {
    background: bg,
    color: kleur,
    border: `1px solid ${kleur}`,
    borderRadius: 7,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    fontFamily: "Inter, system-ui, sans-serif",
    whiteSpace: "nowrap",
  };
}
