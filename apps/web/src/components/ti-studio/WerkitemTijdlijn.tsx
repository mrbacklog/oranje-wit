// apps/web/src/components/ti-studio/WerkitemTijdlijn.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import { createToelichting } from "@/app/(teamindeling-studio)/ti-studio/indeling/toelichting-actions";
import { mergeTijdlijn } from "@/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils";
import type {
  TijdlijnToelichting,
  TijdlijnLog,
} from "@/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils";

const LOG_ACTIE_LABEL: Record<string, string> = {
  AANGEMAAKT: "maakte aan",
  BEWERKT: "bewerkte",
  STATUS_GEWIJZIGD: "→",
  VERWIJDERD: "verwijderde",
};

function initials(naam: string): string {
  return naam
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

function korteTijd(iso: string): string {
  const d = new Date(iso);
  const nu = new Date();
  const diffMs = nu.getTime() - d.getTime();
  const diffUur = diffMs / 3600000;
  if (diffUur < 24 && d.getDate() === nu.getDate()) {
    return `vandaag ${d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const gisteren = new Date(nu);
  gisteren.setDate(nu.getDate() - 1);
  if (d.getDate() === gisteren.getDate()) {
    return `gisteren ${d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return (
    d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
  );
}

interface WerkitemTijdlijnProps {
  werkitemId: string;
  initieleToelichtingen: TijdlijnToelichting[];
  initieleLog: TijdlijnLog[];
  huidigeGebruikerNaam: string;
}

export function WerkitemTijdlijn({
  werkitemId,
  initieleToelichtingen,
  initieleLog,
  huidigeGebruikerNaam,
}: WerkitemTijdlijnProps) {
  const [toelichtingen, setToelichtingen] = useState<TijdlijnToelichting[]>(initieleToelichtingen);
  const [tekst, setTekst] = useState("");
  const [bezig, setBezig] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tijdlijn = mergeTijdlijn(toelichtingen, initieleLog);

  async function verstuur() {
    const t = tekst.trim();
    if (!t || bezig) return;
    setBezig(true);

    // Optimistisch toevoegen
    const optimistisch: TijdlijnToelichting = {
      id: `optimistisch-${Date.now()}`,
      type: "toelichting",
      auteurNaam: huidigeGebruikerNaam,
      auteurEmail: "",
      tekst: t,
      timestamp: new Date().toISOString(),
    };
    setToelichtingen((prev) => [optimistisch, ...prev]);
    setTekst("");

    try {
      const result = await createToelichting(werkitemId, t);
      if (result.ok) {
        setToelichtingen((prev) =>
          prev.map((item) =>
            item.id === optimistisch.id
              ? { ...item, id: result.data!.id, auteurEmail: result.data!.auteurEmail }
              : item
          )
        );
      } else {
        // Rollback
        setToelichtingen((prev) => prev.filter((item) => item.id !== optimistisch.id));
        setTekst(t);
        logger.warn("createToelichting mislukt:", result.error);
      }
    } catch (err) {
      setToelichtingen((prev) => prev.filter((item) => item.id !== optimistisch.id));
      setTekst(t);
      logger.error("WerkitemTijdlijn verstuur fout:", err);
    } finally {
      setBezig(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      verstuur();
    }
  }

  // Auto-groei textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [tekst]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".6px",
          color: "var(--text-3)",
        }}
      >
        Tijdlijn
      </div>

      {/* Invoer */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#2a1a0a",
            border: "1px solid rgba(255,107,0,.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            color: "var(--accent)",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(huidigeGebruikerNaam)}
        </div>
        <div
          style={{
            flex: 1,
            background: "var(--bg-0)",
            border: "1px solid var(--border-0)",
            borderRadius: 8,
            padding: "7px 10px",
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <textarea
            ref={textareaRef}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Voeg een toelichting toe... (Enter = verzenden)"
            rows={1}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "var(--text-1)",
              fontSize: 12,
              resize: "none",
              fontFamily: "Inter, system-ui, sans-serif",
              outline: "none",
              lineHeight: 1.4,
              maxHeight: 80,
              overflowY: "auto",
            }}
          />
          <button
            onClick={verstuur}
            disabled={bezig || !tekst.trim()}
            style={{
              background: bezig || !tekst.trim() ? "var(--bg-2)" : "var(--accent)",
              border: "none",
              borderRadius: 5,
              color: bezig || !tekst.trim() ? "var(--text-3)" : "#fff",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              cursor: bezig || !tekst.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Tijdlijn — vaste hoogte, scrollbaar, nieuwste bovenaan */}
      <div
        style={{
          height: 220,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          paddingRight: 4,
        }}
      >
        {tijdlijn.length === 0 && (
          <div
            style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", paddingTop: 24 }}
          >
            Nog geen berichten
          </div>
        )}
        {tijdlijn.map((item) => {
          if (item.type === "toelichting") {
            return (
              <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#1e2533",
                    border: "1px solid var(--border-0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    color: "var(--accent)",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {initials(item.auteurNaam)}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-0)",
                    borderRadius: "0 8px 8px 8px",
                    padding: "8px 10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-1)",
                      marginBottom: 3,
                    }}
                  >
                    {item.auteurNaam}{" "}
                    <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 10 }}>
                      · {korteTijd(item.timestamp)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-2)",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.tekst}
                  </div>
                </div>
              </div>
            );
          }
          // Log-item
          const statusKleur: Record<string, string> = {
            STATUS_GEWIJZIGD: "var(--text-2)",
            AANGEMAAKT: "var(--text-3)",
            BEWERKT: "var(--text-3)",
            VERWIJDERD: "#ef4444",
          };
          return (
            <div
              key={item.id}
              style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.55 }}
            >
              <div style={{ height: 1, flex: 1, background: "var(--border-0)" }} />
              <span
                style={{
                  fontSize: 10,
                  color: statusKleur[item.actie] ?? "var(--text-3)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.auteurNaam} {LOG_ACTIE_LABEL[item.actie] ?? item.actie}
                {item.detail ? ` ${item.detail}` : ""}
                {" · "}
                {korteTijd(item.timestamp)}
              </span>
              <div style={{ height: 1, flex: 1, background: "var(--border-0)" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
