"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { maakNieuweSpeler } from "@/app/(personen)/personen/actions";
import { logger } from "@oranje-wit/types";

interface NieuweSpelerDialogProps {
  onClose: () => void;
}

export function NieuweSpelerDialog({ onClose }: NieuweSpelerDialogProps) {
  const [roepnaam, setRoepnaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [geslacht, setGeslacht] = useState<"M" | "V">("M");
  const [geboortedatum, setGeboortedatum] = useState("");
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
    if (!roepnaam || !achternaam || !geboortedatum) {
      setFout("Vul alle verplichte velden in.");
      return;
    }
    startTransition(async () => {
      const result = await maakNieuweSpeler({
        roepnaam,
        achternaam,
        geslacht,
        geboortedatum,
        status: "NIEUW_POTENTIEEL",
      });
      if (result.ok) {
        onClose();
      } else {
        logger.warn("NieuweSpelerDialog: aanmaken mislukt:", result.error);
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

  const labelStijl: React.CSSProperties = {
    fontSize: 11,
    color: "var(--text-3)",
    display: "block",
    marginBottom: 4,
    fontWeight: 600,
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
        aria-label="Nieuwe speler aanmaken"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
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
            Nieuwe speler
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
              <label style={labelStijl}>Roepnaam *</label>
              <input
                ref={focusRef}
                type="text"
                value={roepnaam}
                onChange={(e) => setRoepnaam(e.target.value)}
                style={inputStijl}
                placeholder="Bijv. Jan"
                required
              />
            </div>
            <div>
              <label style={labelStijl}>Achternaam *</label>
              <input
                type="text"
                value={achternaam}
                onChange={(e) => setAchternaam(e.target.value)}
                style={inputStijl}
                placeholder="Bijv. de Vries"
                required
              />
            </div>
            <div>
              <label style={labelStijl}>Geslacht *</label>
              <select
                value={geslacht}
                onChange={(e) => setGeslacht(e.target.value as "M" | "V")}
                style={{ ...inputStijl, cursor: "pointer" }}
              >
                <option value="M">Heer (M)</option>
                <option value="V">Dame (V)</option>
              </select>
            </div>
            <div>
              <label style={labelStijl}>Geboortedatum *</label>
              <input
                type="date"
                value={geboortedatum}
                onChange={(e) => setGeboortedatum(e.target.value)}
                style={inputStijl}
                required
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
