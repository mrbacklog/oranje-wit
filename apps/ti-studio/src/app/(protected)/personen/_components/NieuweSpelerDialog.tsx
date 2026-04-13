"use client";

import { useState, useTransition } from "react";
import { maakHandmatigeSpelerAan } from "../actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-sunken)",
  border: "1px solid var(--border-default)",
  borderRadius: 7,
  color: "var(--text-primary)",
  fontSize: 13,
  padding: "7px 10px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
  display: "block",
};

export function NieuweSpelerDialog({ open, onClose }: Props) {
  const [roepnaam, setRoepnaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [geslacht, setGeslacht] = useState<"M" | "V">("M");
  const [geboortedatum, setGeboortedatum] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setRoepnaam("");
    setAchternaam("");
    setGeslacht("M");
    setGeboortedatum("");
    setFout(null);
  }

  function handleSluiten() {
    reset();
    onClose();
  }

  function handleAanmaken() {
    if (!roepnaam.trim() || !achternaam.trim() || !geboortedatum) {
      setFout("Vul alle verplichte velden in.");
      return;
    }
    setFout(null);
    startTransition(async () => {
      const result = await maakHandmatigeSpelerAan({
        roepnaam: roepnaam.trim(),
        achternaam: achternaam.trim(),
        geslacht,
        geboortedatum,
      });
      if (result.ok) {
        reset();
        onClose();
      } else {
        setFout(result.error);
      }
    });
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleSluiten}
    >
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 12,
          padding: 24,
          width: 360,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          Nieuwe speler aanmaken
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Roepnaam *</label>
            <input
              value={roepnaam}
              onChange={(e) => setRoepnaam(e.target.value)}
              style={inputStyle}
              placeholder="Jan"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Achternaam *</label>
            <input
              value={achternaam}
              onChange={(e) => setAchternaam(e.target.value)}
              style={inputStyle}
              placeholder="de Vries"
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Geslacht *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["M", "V"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGeslacht(g)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 7,
                  border:
                    geslacht === g
                      ? "1.5px solid var(--accent)"
                      : "1px solid var(--border-default)",
                  background: geslacht === g ? "rgba(255,107,0,0.12)" : "var(--surface-sunken)",
                  color: geslacht === g ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {g === "M" ? "Man" : "Vrouw"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Geboortedatum *</label>
          <input
            type="date"
            value={geboortedatum}
            onChange={(e) => setGeboortedatum(e.target.value)}
            style={inputStyle}
          />
        </div>
        {fout && (
          <div
            style={{
              fontSize: 12,
              color: "#ef4444",
              background: "rgba(239,68,68,.1)",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            {fout}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSluiten}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: 7,
              border: "1px solid var(--border-default)",
              background: "var(--surface-sunken)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleAanmaken}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: 7,
              border: "none",
              background: isPending ? "var(--surface-raised)" : "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: isPending ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {isPending ? "Aanmaken..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}
