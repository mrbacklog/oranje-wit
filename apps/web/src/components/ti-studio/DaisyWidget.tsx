"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { logger } from "@oranje-wit/types";

// ── Types ──────────────────────────────────────────────────────────

type DaisyAnimatorContextValue = {
  triggerAnimation: (bronEl: HTMLElement, doelEl: HTMLElement, label: string) => void;
};

// ── Context ────────────────────────────────────────────────────────

const DaisyAnimatorContext = createContext<DaisyAnimatorContextValue | null>(null);

export function useDaisyAnimator(): DaisyAnimatorContextValue {
  const ctx = useContext(DaisyAnimatorContext);
  if (!ctx) {
    return {
      triggerAnimation: (bronEl, doelEl, label) => {
        logger.warn("useDaisyAnimator: geen DaisyWidget in tree. label:", label);
      },
    };
  }
  return ctx;
}

// ── Suggestie type ─────────────────────────────────────────────────

type DaisySuggestie = {
  id: number;
  tekst: string;
};

const DEMO_SUGGESTIES: DaisySuggestie[] = [
  {
    id: 1,
    tekst: "Sen-A heeft 3 open plekken. Ik stel voor Emma de Vries en Laura Bakker toe te voegen.",
  },
  {
    id: 2,
    tekst: "U17 heeft teveel mannen (7/6 max). Overweeg Kevin Smit naar U19 te verplaatsen?",
  },
  {
    id: 3,
    tekst: "Heer 1e selectie mist nog een dame. Sara Jansen is beschikbaar.",
  },
];

// ── Toast ──────────────────────────────────────────────────────────

function Toast({ tekst, onVerberg }: { tekst: string; onVerberg: () => void }) {
  useEffect(() => {
    const t = setTimeout(onVerberg, 3000);
    return () => clearTimeout(t);
  }, [onVerberg]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "5.5rem",
        right: "1.5rem",
        zIndex: 9997,
        background: "var(--surface-raised)",
        border: "1px solid var(--border-default)",
        borderRadius: 10,
        padding: "0.625rem 1rem",
        fontSize: "0.8125rem",
        color: "var(--text-primary)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        maxWidth: 280,
        animation: "fadeIn 200ms ease forwards",
      }}
    >
      {tekst}
    </div>
  );
}

// ── Cursor animator ────────────────────────────────────────────────

type DaisyCursorRef = {
  triggerAnimation: (bronEl: HTMLElement, doelEl: HTMLElement, label: string) => void;
};

function DaisyCursorAnimator({
  animatorRef,
}: {
  animatorRef: React.MutableRefObject<DaisyCursorRef | null>;
}) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [zichtbaar, setZichtbaar] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");
  const [cursorStyle, setCursorStyle] = useState<React.CSSProperties>({});

  const triggerAnimation = useCallback(
    (bronEl: HTMLElement, doelEl: HTMLElement, label: string) => {
      const bron = bronEl.getBoundingClientRect();
      const doel = doelEl.getBoundingClientRect();

      setCursorLabel(label);
      setCursorStyle({
        left: bron.left + bron.width / 2,
        top: bron.top + bron.height / 2,
        transition: "none",
        opacity: 1,
      });
      setZichtbaar(true);

      // Bron glow
      bronEl.style.boxShadow = "0 0 0 3px rgba(255,107,0,0.5), 0 0 20px rgba(255,107,0,0.3)";
      bronEl.style.transition = "box-shadow 300ms ease";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCursorStyle({
            left: doel.left + doel.width / 2,
            top: doel.top + doel.height / 2,
            transition: "left 1.5s ease, top 1.5s ease",
            opacity: 1,
          });
        });
      });

      setTimeout(() => {
        // Drop animatie
        setCursorStyle((prev) => ({ ...prev, opacity: 0, transition: "opacity 300ms ease" }));
        bronEl.style.boxShadow = "";
        doelEl.style.boxShadow = "0 0 0 3px rgba(255,107,0,0.8), 0 0 30px rgba(255,107,0,0.4)";
        setTimeout(() => {
          setZichtbaar(false);
          doelEl.style.boxShadow = "";
        }, 400);
      }, 1700);
    },
    []
  );

  // Expose via ref
  animatorRef.current = { triggerAnimation };

  if (!zichtbaar) return null;

  return (
    <span
      ref={cursorRef}
      id="daisy-cursor"
      aria-hidden="true"
      style={{
        position: "fixed",
        zIndex: 9999,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "linear-gradient(135deg, var(--ow-oranje-500, #ff6b00), #9333ea)",
        borderRadius: 99,
        padding: "0.25rem 0.625rem",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#fff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        ...cursorStyle,
      }}
    >
      <span>✨</span>
      <span>{cursorLabel || "Daisy"}</span>
    </span>
  );
}

// ── Hoofd component ────────────────────────────────────────────────

export default function DaisyWidget() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const animatorRef = useRef<DaisyCursorRef | null>(null);

  const triggerAnimation = useCallback(
    (bronEl: HTMLElement, doelEl: HTMLElement, label: string) => {
      animatorRef.current?.triggerAnimation(bronEl, doelEl, label);
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function voerActieUit(suggestieId: number) {
    logger.info("DaisyWidget: demo actie uitgevoerd voor suggestie", suggestieId);
    setToast("Daisy voert actie uit...");
  }

  return (
    <DaisyAnimatorContext.Provider value={{ triggerAnimation }}>
      {/* Cursor animator */}
      <DaisyCursorAnimator animatorRef={animatorRef} />

      {/* Toast */}
      {toast && <Toast tekst={toast} onVerberg={() => setToast(null)} />}

      {/* Chat panel (boven de button) */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Daisy AI assistent"
          style={{
            position: "fixed",
            bottom: "5rem",
            right: "1.5rem",
            zIndex: 9998,
            width: 300,
            maxHeight: 384,
            background: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1rem",
              borderBottom: "1px solid var(--border-default)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "1rem" }}>✨</span>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                flex: 1,
              }}
            >
              Daisy AI
            </span>
            <span
              style={{
                background: "rgba(255,107,0,0.12)",
                color: "var(--ow-oranje-500, #ff6b00)",
                borderRadius: 99,
                padding: "0.15rem 0.5rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              TC-lid
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Daisy sluiten"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "1.125rem",
                lineHeight: 1,
                padding: "0.125rem 0.25rem",
                borderRadius: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* Suggestie cards */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {DEMO_SUGGESTIES.map((suggestie) => (
              <div
                key={suggestie.id}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  padding: "0.625rem 0.75rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0.5rem",
                    fontSize: "0.8125rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.45,
                  }}
                >
                  {suggestie.tekst}
                </p>
                <button
                  onClick={() => voerActieUit(suggestie.id)}
                  style={{
                    background: "linear-gradient(135deg, var(--ow-oranje-500, #ff6b00), #9333ea)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <span>▶</span>
                  <span>Uitvoeren</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Daisy sluiten" : "Daisy openen"}
        aria-expanded={open}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9998,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--ow-oranje-500, #ff6b00), #9333ea)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.25rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
          color: "#fff",
          transition: "transform 200ms ease, box-shadow 200ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)";
        }}
      >
        ✨
      </button>
    </DaisyAnimatorContext.Provider>
  );
}
