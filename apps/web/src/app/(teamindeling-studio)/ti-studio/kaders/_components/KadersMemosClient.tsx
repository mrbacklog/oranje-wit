"use client";

import { useState } from "react";
import { logger } from "@oranje-wit/types";
import { MemoPanel } from "@/components/ti-studio/MemoPanel";
import type { MemoData } from "@/components/ti-studio/werkbord/types";
import { updateKadersMemo, type KadersMemosleutel } from "../memo-actions";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

interface KadersMemo extends MemoData {
  sleutel: KadersMemosleutel;
  label: string;
}

export interface KadersMemosData {
  kweekvijver?: Partial<MemoData>;
  opleidingshart?: Partial<MemoData>;
  korfbalplezier?: Partial<MemoData>;
  wedstrijdsport?: Partial<MemoData>;
  topsport?: Partial<MemoData>;
  tc?: Partial<MemoData>;
}

interface KadersMemosClientProps {
  kadersId: string;
  initialeMemos: KadersMemosData;
}

// ──────────────────────────────────────────────────────────
// Doelgroep definitie
// ──────────────────────────────────────────────────────────

const DOELGROEPEN: { sleutel: KadersMemosleutel; label: string; sublabel: string }[] = [
  { sleutel: "kweekvijver", label: "Kweekvijver", sublabel: "5-9 · Blauw + Groen" },
  { sleutel: "opleidingshart", label: "Opleidingshart", sublabel: "10-15 · Geel + Oranje" },
  {
    sleutel: "korfbalplezier",
    label: "Korfbalplezier",
    sublabel: "Rood B · B-senioren · Midweek",
  },
  { sleutel: "wedstrijdsport", label: "Wedstrijdsport", sublabel: "Senioren A-categorie" },
  { sleutel: "topsport", label: "Topsport", sublabel: "U15-1 t/m U19-1 · Sen 1-2" },
];

// ──────────────────────────────────────────────────────────
// Hulpfunctie
// ──────────────────────────────────────────────────────────

function leegMemo(sleutel: KadersMemosleutel, label: string): KadersMemo {
  return { sleutel, label, tekst: "", memoStatus: "gesloten", besluit: null };
}

function hydrateerMemo(
  sleutel: KadersMemosleutel,
  label: string,
  data?: Partial<MemoData>
): KadersMemo {
  return {
    sleutel,
    label,
    tekst: data?.tekst ?? "",
    memoStatus: data?.memoStatus ?? "gesloten",
    besluit: data?.besluit ?? null,
  };
}

// ──────────────────────────────────────────────────────────
// KadersMemosClient
// ──────────────────────────────────────────────────────────

export default function KadersMemosClient({ kadersId, initialeMemos }: KadersMemosClientProps) {
  const [memos, setMemos] = useState<KadersMemo[]>(() => [
    ...DOELGROEPEN.map((d) => hydrateerMemo(d.sleutel, d.label, initialeMemos[d.sleutel])),
    hydrateerMemo("tc", "TC algemeen", initialeMemos.tc),
  ]);

  const [openSleutel, setOpenSleutel] = useState<KadersMemosleutel | null>(null);
  const [bezig, setBezig] = useState<KadersMemosleutel | null>(null);

  async function handleSave(sleutel: KadersMemosleutel, data: MemoData) {
    setBezig(sleutel);
    try {
      const result = await updateKadersMemo(kadersId, sleutel, data);
      if (result.ok) {
        setMemos((prev) => prev.map((m) => (m.sleutel === sleutel ? { ...m, ...data } : m)));
      } else {
        logger.warn("KadersMemosClient: memo opslaan mislukt", result.error);
      }
    } catch (err) {
      logger.error("KadersMemosClient: fout bij opslaan memo", err);
    } finally {
      setBezig(null);
    }
  }

  const doelgroepMemos = memos.filter((m) => m.sleutel !== "tc");
  const tcMemo = memos.find((m) => m.sleutel === "tc") ?? leegMemo("tc", "TC algemeen");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Doelgroep memos */}
      {doelgroepMemos.map((memo) => {
        const doelgroepInfo = DOELGROEPEN.find((d) => d.sleutel === memo.sleutel);
        const isUitgeklapt = openSleutel === memo.sleutel;

        return (
          <div
            key={memo.sleutel}
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* Klikbare header-rij */}
            <button
              onClick={() => setOpenSleutel(isUitgeklapt ? null : memo.sleutel)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}
              >
                {memo.label}
                {memo.memoStatus === "open" && (
                  <span
                    style={{ fontSize: 9, color: "var(--accent)", marginLeft: 6 }}
                    title="Open memo"
                  >
                    ▲
                  </span>
                )}
              </span>
              {doelgroepInfo && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {doelgroepInfo.sublabel}
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {isUitgeklapt ? "▲" : "▼"}
              </span>
            </button>

            {/* Uitklapbaar memo panel */}
            {isUitgeklapt && (
              <div
                style={{
                  padding: "0 16px 16px",
                  borderTop: "1px solid var(--border-default)",
                }}
              >
                <div style={{ paddingTop: 12 }}>
                  <MemoPanel
                    memo={memo}
                    onSave={(data) => handleSave(memo.sleutel, data)}
                    opslaanBezig={bezig === memo.sleutel}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* TC-memo (altijd zichtbaar) */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "16px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          TC algemeen
          {tcMemo.memoStatus === "open" && (
            <span style={{ fontSize: 9, color: "var(--accent)" }} title="Open memo">
              ▲
            </span>
          )}
        </div>
        <MemoPanel
          memo={tcMemo}
          onSave={(data) => handleSave("tc", data)}
          opslaanBezig={bezig === "tc"}
        />
      </div>
    </div>
  );
}
