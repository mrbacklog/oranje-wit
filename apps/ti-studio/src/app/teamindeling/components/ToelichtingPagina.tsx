// apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type {
  PubliekeTeamindelingData,
  BelangrijkeDatumItem,
} from "@/lib/teamindeling/publieke-presentatie";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

const ORANJE = "#FF6600";

const pillBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(255,102,0,0.08)",
  border: `1px solid rgba(255,102,0,0.25)`,
  borderRadius: 20,
  padding: "7px 14px",
  fontSize: 12,
  fontWeight: 700,
  color: ORANJE,
  cursor: "pointer",
  letterSpacing: "0.03em",
};

// --- Modal ---
function InfoModal({
  open,
  onSluit,
  children,
}: {
  open: boolean;
  onSluit: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onSluit}
    >
      <div
        style={{
          background: "#111",
          borderRadius: "16px 16px 0 0",
          padding: "24px 22px 36px",
          width: "100%",
          maxWidth: 540,
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onSluit}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 20,
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            padding: "4px 10px",
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// --- Startdata modal inhoud ---
function StartdataInhoud({ items }: { items: BelangrijkeDatumItem[] }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📅</span>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 900,
            fontStyle: "italic",
            textTransform: "uppercase",
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          Startdata &amp; Planning
        </h3>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Nog geen data beschikbaar.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "10px 0",
                borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: ORANJE,
                  flexShrink: 0,
                  marginTop: 5,
                  boxShadow: `0 0 6px rgba(255,102,0,0.5)`,
                }}
              />
              <div>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{item.datum}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginLeft: 10 }}>
                  {item.omschrijving}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// --- Sectie kop ---
function SectieKop({ label, titel }: { label: string; titel: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
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
      <h2
        className="pt-sectie-titel"
        style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}
      >
        {titel}
      </h2>
    </div>
  );
}

// --- Hoofd component ---
export function ToelichtingPagina({
  toelichting,
}: {
  toelichting: PubliekeTeamindelingData["toelichting"];
}) {
  const [openModal, setOpenModal] = useState<null | "startdata">(null);

  const belangrijkeData = toelichting?.belangrijkeData ?? [];

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
          paddingBottom: 120,
          position: "relative",
          zIndex: 1,
        }}
      >
        {toelichting ? (
          <>
            {/* Voorwoord */}
            <div style={{ marginBottom: 24 }}>
              <SectieKop label="Voorwoord" titel="Beste leden, ouders en betrokkenen" />
              <div
                className="pt-toel-tekst"
                style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 12,
                }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{ __html: toelichting.introTekst }}
              />
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                margin: "24px 0",
              }}
            />

            {/* Voorlopige teamindeling banner */}
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
            >
              <strong style={{ color: "rgba(255,255,255,0.88)" }}>Voorlopige indeling</strong> —
              Samenstelling kan nog wijzigen tijdens de voorbereiding en selectiedagen. De
              definitieve indeling volgt voor aanvang van het seizoen.
            </div>

            {/* TC tekst */}
            <div style={{ marginBottom: 24 }}>
              <SectieKop label="Totstandkoming" titel="Hoe zijn de teams samengesteld?" />
              <div
                className="pt-toel-tekst"
                style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 12,
                }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{ __html: toelichting.tcTekst }}
              />
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                margin: "24px 0",
              }}
            />

            {/* Startdata inline blok */}
            {belangrijkeData.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <SectieKop label="Planning" titel="Startdata &amp; belangrijke data" />
                  <button
                    style={{ ...pillBtnStyle, fontSize: 11 }}
                    onClick={() => setOpenModal("startdata")}
                  >
                    📅 Bekijk alles
                  </button>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {belangrijkeData.slice(0, 3).map((item, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                          padding: "8px 0",
                          borderBottom:
                            i < Math.min(belangrijkeData.length, 3) - 1
                              ? "1px solid rgba(255,255,255,0.07)"
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: ORANJE,
                            flexShrink: 0,
                            marginTop: 5,
                          }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                            {item.datum}
                          </span>
                          <span
                            style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginLeft: 8 }}
                          >
                            {item.omschrijving}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {belangrijkeData.length > 3 && (
                  <button
                    style={{ ...pillBtnStyle, marginTop: 10, fontSize: 11 }}
                    onClick={() => setOpenModal("startdata")}
                  >
                    +{belangrijkeData.length - 3} meer data →
                  </button>
                )}
              </div>
            )}

            {/* TC ondertekening */}
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
              }}
            >
              Wij wensen alle teams een fantastisch seizoen toe.
              <br />— De Technische Commissie, c.k.v. Oranje Wit
            </div>
          </>
        ) : (
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>
            De toelichting is nog niet beschikbaar.
          </p>
        )}
      </div>

      {/* Modal */}
      <InfoModal open={openModal === "startdata"} onSluit={() => setOpenModal(null)}>
        <StartdataInhoud items={belangrijkeData} />
      </InfoModal>
    </div>
  );
}
