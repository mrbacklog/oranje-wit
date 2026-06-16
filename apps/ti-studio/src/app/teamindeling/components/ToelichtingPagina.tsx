// apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
"use client";

import { useState } from "react";
import type {
  PubliekeTeamindelingData,
  BelangrijkeDatumItem,
  KennismakingItem,
} from "@/lib/teamindeling/publieke-presentatie";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

// --- Gedeelde stijlen ---
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

// --- Kennismakingstraining modal inhoud ---
function KennismakingInhoud({ items }: { items: KennismakingItem[] }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🏐</span>
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
          Kennismakingstrainingen
        </h3>
      </div>
      <p
        style={{
          background: "rgba(255,102,0,0.1)",
          border: "1px solid rgba(255,102,0,0.2)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 12,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 14,
        }}
      >
        Alle nieuwe leden zijn welkom bij de kennismakingstraining van hun team.
      </p>
      {items.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          Nog geen trainingen ingepland.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                padding: "10px 0",
                borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 2 }}>
                {item.teamnaam}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                {item.datum} · {item.tijd}
                {item.locatie && (
                  <span style={{ color: "rgba(255,255,255,0.35)" }}> · {item.locatie}</span>
                )}
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
        style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1.1 }}
      >
        {titel}
      </h2>
    </div>
  );
}

// --- Hoofd component ---
export function ToelichtingPagina({
  toelichting,
  onGaNaar,
}: {
  toelichting: PubliekeTeamindelingData["toelichting"];
  onGaNaar: () => void;
}) {
  const [openModal, setOpenModal] = useState<null | "startdata" | "kennismaking">(null);

  const belangrijkeData = toelichting?.belangrijkeData ?? [];
  const kennismakingstrainingen = toelichting?.kennismakingstrainingen ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Top-bar met switch-knop */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,102,0,0.12)",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: ORANJE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 7,
              fontWeight: 900,
              color: "#fff",
              textAlign: "center",
              lineHeight: 1.15,
              flexShrink: 0,
            }}
          >
            OW
            <br />
            100
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: ORANJE,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Toelichting
          </span>
        </div>
        <button
          onClick={onGaNaar}
          style={{
            background: ORANJE,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            boxShadow: "0 2px 8px rgba(255,102,0,0.35)",
          }}
        >
          Teamindeling →
        </button>
      </div>

      {/* Hero — wit met oranje accenten */}
      <div
        className="pt-toel-hero"
        style={{
          background: "#fff",
          borderLeft: "5px solid #FF6600",
          padding: "32px 24px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Hoek-driehoek decoratie */}
        <div
          style={{
            position: "absolute",
            bottom: -30,
            right: -30,
            width: 160,
            height: 160,
            background: ORANJE,
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            opacity: 0.1,
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Logo + seizoen */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <img
              src={LOGO_URL}
              alt="c.k.v. Oranje Wit 100 jaar"
              style={{ height: 48, width: "auto", display: "block" }}
            />
            {toelichting && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: ORANJE,
                }}
              >
                {toelichting.seizoenLabel}
              </span>
            )}
          </div>
          {/* Titel */}
          <h1
            className="pt-toel-titel"
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              color: "#111",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            Voorlopige
            <br />
            teamindeling{" "}
            {toelichting && <span style={{ color: ORANJE }}>{toelichting.seizoenLabel}</span>}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#888", fontWeight: 500 }}>
            c.k.v. Oranje Wit · Dordrecht
          </p>
        </div>
      </div>

      {/* Quick-access pills */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "14px 24px",
          background: "#fafafa",
          borderBottom: "1px solid #f0f0f0",
          flexWrap: "wrap",
        }}
      >
        <button style={pillBtnStyle} onClick={() => setOpenModal("startdata")}>
          📅 Startdata &amp; planning
        </button>
        <button style={pillBtnStyle} onClick={() => setOpenModal("kennismaking")}>
          🏐 Kennismakingstraining
        </button>
      </div>

      {/* Inhoud */}
      <div
        className="pt-toel-body"
        style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 60px" }}
      >
        {toelichting ? (
          <>
            {/* Voorwoord */}
            <div style={{ marginBottom: 24 }}>
              <SectieKop label="Voorwoord" titel="Beste leden, ouders en betrokkenen" />
              <div
                className="pt-toel-tekst"
                style={{ fontSize: 15, lineHeight: 1.75, color: "#333", marginTop: 12 }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{ __html: toelichting.introTekst }}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />

            {/* Voorlopige teamindeling banner */}
            <div
              style={{
                background: "rgba(255,102,0,0.06)",
                borderLeft: "3px solid #FF6600",
                padding: "10px 14px",
                marginBottom: 24,
                fontSize: 13,
                color: "#555",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#333" }}>Voorlopige indeling</strong> — Samenstelling kan nog
              wijzigen tijdens de voorbereiding en selectiedagen. De definitieve indeling volgt voor
              aanvang van het seizoen.
            </div>

            {/* TC tekst */}
            <div style={{ marginBottom: 24 }}>
              <SectieKop label="Totstandkoming" titel="Hoe zijn de teams samengesteld?" />
              <div
                className="pt-toel-tekst"
                style={{ fontSize: 15, lineHeight: 1.75, color: "#333", marginTop: 12 }}
                /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
                dangerouslySetInnerHTML={{ __html: toelichting.tcTekst }}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />

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
                            ? "1px solid #f0f0f0"
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
                        <span style={{ fontWeight: 700, color: "#111", fontSize: 14 }}>
                          {item.datum}
                        </span>
                        <span style={{ fontSize: 14, color: "#444", marginLeft: 8 }}>
                          {item.omschrijving}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
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

            {/* Kennismakingstrainingen inline blok */}
            {kennismakingstrainingen.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <SectieKop label="Kennismaking" titel="Kennismakingstrainingen" />
                  <button
                    style={{ ...pillBtnStyle, fontSize: 11 }}
                    onClick={() => setOpenModal("kennismaking")}
                  >
                    🏐 Bekijk alles
                  </button>
                </div>
                <div
                  style={{
                    background: "rgba(255,102,0,0.06)",
                    border: "1px solid rgba(255,102,0,0.2)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "#555",
                    marginBottom: 12,
                  }}
                >
                  Alle nieuwe leden zijn welkom bij de kennismakingstraining van hun team.
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {kennismakingstrainingen.slice(0, 3).map((item, i) => (
                    <li
                      key={i}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          i < Math.min(kennismakingstrainingen.length, 3) - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                      }}
                    >
                      <div
                        style={{ fontWeight: 700, color: "#111", fontSize: 14, marginBottom: 2 }}
                      >
                        {item.teamnaam}
                      </div>
                      <div style={{ fontSize: 13, color: "#555" }}>
                        {item.datum} · {item.tijd}
                        {item.locatie && <span style={{ color: "#888" }}> · {item.locatie}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
                {kennismakingstrainingen.length > 3 && (
                  <button
                    style={{ ...pillBtnStyle, marginTop: 10, fontSize: 11 }}
                    onClick={() => setOpenModal("kennismaking")}
                  >
                    +{kennismakingstrainingen.length - 3} meer teams →
                  </button>
                )}
              </div>
            )}

            {/* TC ondertekening */}
            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />
            <div
              style={{
                borderLeft: "3px solid #FF6600",
                paddingLeft: 14,
                fontSize: 14,
                color: "#666",
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
          <p style={{ fontSize: 15, color: "#999", marginBottom: 28 }}>
            De toelichting is nog niet beschikbaar.
          </p>
        )}

        {/* CTA */}
        <button
          onClick={onGaNaar}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: ORANJE,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "14px 28px",
            fontSize: 14,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(255,102,0,0.35)",
          }}
        >
          Bekijk de teamindeling →
        </button>
      </div>

      {/* Modals */}
      <InfoModal open={openModal === "startdata"} onSluit={() => setOpenModal(null)}>
        <StartdataInhoud items={belangrijkeData} />
      </InfoModal>
      <InfoModal open={openModal === "kennismaking"} onSluit={() => setOpenModal(null)}>
        <KennismakingInhoud items={kennismakingstrainingen} />
      </InfoModal>
    </div>
  );
}
