"use client";

import { useEffect, useState } from "react";

/* ================================================================
   iOS Install Instructie
   ================================================================
   Stapsgewijze instructie voor het toevoegen aan het beginscherm
   op iOS Safari. Toont een overlay met 3 stappen en dot indicators.
   ================================================================ */

export function IOSInstallInstructie({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
      style={{ backgroundColor: "var(--surface-scrim)" }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-modal)",
          animation: "iosSlideUp 300ms var(--ease-spring) forwards",
        }}
      >
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Zo werkt het op iPhone:
          </h3>
        </div>

        <div className="space-y-4 px-6 py-4">
          <IOSStep
            nummer={1}
            active={step === 0}
            tekst={
              <>
                Tik op{" "}
                <span className="inline-flex translate-y-0.5">
                  <ShareIcon size={16} />
                </span>{" "}
                (Delen) onderaan Safari
              </>
            }
          />
          <IOSStep nummer={2} active={step === 1} tekst="Scroll naar beneden in het menu" />
          <IOSStep
            nummer={3}
            active={step === 2}
            tekst={
              <>
                Tik op{" "}
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  &quot;Zet op beginscherm&quot;
                </span>
              </>
            }
          />
        </div>

        <div className="mx-6 mb-4 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: step === i ? "20px" : "6px",
                backgroundColor: step === i ? "var(--ow-oranje-500)" : "var(--border-default)",
                transition:
                  "width 300ms var(--ease-default), background-color 300ms var(--ease-default)",
              }}
            />
          ))}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
              boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
            }}
          >
            Begrepen
          </button>
        </div>
      </div>

      <style>{`
        @keyframes iosSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function IOSStep({
  nummer,
  active,
  tekst,
}: {
  nummer: number;
  active: boolean;
  tekst: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-2 transition-all"
      style={{
        backgroundColor: active ? "rgba(255, 107, 0, 0.06)" : "transparent",
        borderLeft: active ? "2px solid var(--ow-oranje-500)" : "2px solid transparent",
        transition:
          "background-color 300ms var(--ease-default), border-color 300ms var(--ease-default)",
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{
          backgroundColor: active ? "rgba(255, 107, 0, 0.15)" : "rgba(107, 114, 128, 0.1)",
          color: active ? "var(--ow-oranje-500)" : "var(--text-tertiary)",
          transition: "background-color 300ms, color 300ms",
        }}
      >
        {nummer}
      </span>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {tekst}
      </p>
    </div>
  );
}

function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
