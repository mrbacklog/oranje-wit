"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { maakNieuweStaf } from "@/app/(personen)/personen/actions";
import { logger } from "@oranje-wit/types";

interface NieuweStafDialogProps {
  onClose: () => void;
}

export function NieuweStafDialog({ onClose }: NieuweStafDialogProps) {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const focusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    focusRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFout(null);
    if (!naam) {
      setFout("Naam is verplicht.");
      return;
    }
    startTransition(async () => {
      const result = await maakNieuweStaf({
        naam,
        email: email || undefined,
        rollen: [],
      });
      if (result.ok) {
        onClose();
      } else {
        logger.warn("NieuweStafDialog: aanmaken mislukt:", result.error);
        setFout(result.error);
      }
    });
  };

  const inputStijl: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 10px",
    color: "var(--text-1)",
    fontSize: 13,
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
  };

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
        role="dialog"
        aria-modal="true"
        aria-label="Nieuw staflid aanmaken"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--bg-2)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-1)",
          boxShadow: "0 24px 64px rgba(0,0,0,.8)",
          zIndex: 10001,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
            Nieuw staflid
          </h2>
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Naam *
              </label>
              <input
                ref={focusRef}
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                style={inputStijl}
                placeholder="Bijv. Jan Janssen"
                required
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStijl}
                placeholder="Optioneel"
              />
            </div>

            {fout && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(239,68,68,.1)",
                  border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "#ef4444",
                  fontSize: 12,
                }}
              >
                {fout}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <button
              type="button"
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
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "8px 16px",
                background: isPending ? "rgba(255,107,0,.5)" : "var(--ow-accent)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {isPending ? "Aanmaken..." : "Aanmaken"}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
