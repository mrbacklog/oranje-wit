// apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
"use client";

import Image from "next/image";
import type { PubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import type { AppPagina } from "./AppFooter";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

const ORANJE = "#FF6600";

// --- Sectie kop ---
function SectieKop({ label, titel }: { label?: string; titel?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: ORANJE,
            marginBottom: 5,
          }}
        >
          <span style={{ display: "inline-block", width: 12, height: 2, background: ORANJE }} />
          {label}
        </div>
      )}
      {titel && (
        <h2
          className="pt-sectie-titel"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}
        >
          {titel}
        </h2>
      )}
    </div>
  );
}

// --- Hoofd component ---
const TAB_LINKS: Record<string, string> = {
  "/info": "toelichting",
  "/teams": "indeling",
  "/kennismaking": "kennismaking",
  "/kalender": "kalender",
  "/oproep": "tcoproep",
  "/vragen": "vragen",
};

export function ToelichtingPagina({
  toelichting,
  onTabNavigeer,
}: {
  toelichting: PubliekeTeamindelingData["toelichting"];
  onTabNavigeer?: (tab: AppPagina) => void;
}) {
  const blokken = toelichting?.toelichtingBlokken ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      {/* Hero — sticky, dark oranje */}
      <div
        className="pt-toel-hero"
        style={{
          background: "#FF6600",
          padding: "16px 24px 44px",
          clipPath: "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          overflow: "hidden",
        }}
      >
        {/* Shimmer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Inhoud gecentreerd op max 720px */}
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          {/* OW-logo watermerk rechtsboven */}
          <Image
            src={LOGO_URL}
            alt=""
            aria-hidden={true}
            unoptimized
            width={90}
            height={90}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 90,
              height: "auto",
              opacity: 0.18,
              pointerEvents: "none",
              userSelect: "none",
              objectFit: "contain",
            }}
          />

          {/* Titel */}
          <h1
            className="pt-toel-titel"
            style={{ margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                fontStyle: "normal",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 4,
              }}
            >
              Voorlopige teamindeling
            </span>
            <span
              style={{
                display: "block",
                fontSize: 48,
                fontWeight: 900,
                fontStyle: "italic",
                textTransform: "uppercase",
                color: "#fff",
                lineHeight: 0.9,
              }}
            >
              {toelichting?.seizoenLabel ?? "2026–2027"}
            </span>
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 500,
            }}
          >
            c.k.v. Oranje Wit · Dordrecht
          </p>
        </div>
      </div>

      {/* Inhoud */}
      <div
        className="pt-toel-body"
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "28px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {toelichting ? (
          <>
            {/* Statusbanner (configureerbaar in presentatieteksten) */}
            {toelichting.statusBanner && (
              <div
                style={{
                  background: "rgba(255,102,0,0.08)",
                  borderLeft: "3px solid #FF6600",
                  padding: "10px 14px",
                  marginBottom: 24,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.6,
                }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{
                  __html: toelichting.statusBanner.replace(
                    /\*\*(.+?)\*\*/g,
                    '<strong style="color:rgba(255,255,255,0.88)">$1</strong>'
                  ),
                }}
              />
            )}

            {/* Toelichting blokken */}
            {blokken.map((blok, i) => (
              <div key={blok.id} style={{ marginBottom: 24 }}>
                {(blok.subtitle || blok.label) && (
                  <SectieKop label={blok.label || undefined} titel={blok.subtitle} />
                )}
                <div
                  className="pt-toel-tekst"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: blok.subtitle ? 12 : 0,
                  }}
                  /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                  onClick={(e) => {
                    const a = (e.target as HTMLElement).closest("a");
                    if (!a) return;
                    const tab = TAB_LINKS[a.getAttribute("href") ?? ""] as AppPagina | undefined;
                    if (tab && onTabNavigeer) {
                      e.preventDefault();
                      onTabNavigeer(tab);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: blok.tekst }}
                />
                {i < blokken.length - 1 && (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      margin: "24px 0 0",
                    }}
                  />
                )}
              </div>
            ))}

            {/* TC ondertekening (configureerbaar in presentatieteksten) */}
            {toelichting.tcOndertekening && (
              <>
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    margin: "24px 0",
                  }}
                />
                <div
                  style={{
                    borderLeft: "3px solid #FF6600",
                    paddingLeft: 14,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.45)",
                    fontStyle: "italic",
                    lineHeight: 1.6,
                    marginBottom: 28,
                    whiteSpace: "pre-line",
                  }}
                >
                  {toelichting.tcOndertekening}
                </div>
              </>
            )}
          </>
        ) : (
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>
            De toelichting is nog niet beschikbaar.
          </p>
        )}
      </div>
    </div>
  );
}
