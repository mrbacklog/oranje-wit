// apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Megaphone, HelpCircle } from "lucide-react";
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

const footerBtnStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "8px 6px",
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

// --- TC Oproep modal inhoud ---
function TcOproepInhoud() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Megaphone size={20} color="#FF6600" />
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
          Oproep van de TC
        </h3>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        Tekst volgt. De TC heeft een belangrijke oproep voor alle leden.
      </p>
    </div>
  );
}

// --- Vragen modal inhoud ---
function VragenInhoud() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <HelpCircle size={20} color="#FF6600" />
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
          Veelgestelde vragen
        </h3>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        Tekst volgt. Heb je vragen over de teamindeling? Neem contact op met de TC.
      </p>
    </div>
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
  const [openModal, setOpenModal] = useState<
    null | "startdata" | "kennismaking" | "tcoproep" | "vragen"
  >(null);

  const belangrijkeData = toelichting?.belangrijkeData ?? [];
  const kennismakingstrainingen = toelichting?.kennismakingstrainingen ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Achtergrond watermerk — fixed over gehele pagina */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: 340,
          height: "auto",
          opacity: 0.06,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        <Image
          src={LOGO_URL}
          alt=""
          aria-hidden
          unoptimized
          width={340}
          height={340}
          style={{ width: "100%", height: "auto", objectFit: "contain" }}
        />
      </div>

      {/* Hero — sticky, licht grijs met oranje accenten + switch-knop */}
      <div
        className="pt-toel-hero"
        style={{
          background: "#f5f5f5",
          borderLeft: "5px solid #FF6600",
          padding: "12px 20px 20px",
          position: "sticky",
          top: 0,
          zIndex: 30,
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
          {/* Seizoen label + switch-knop */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {toelichting?.seizoenLabel ?? ""}
            </span>
            <button
              onClick={onGaNaar}
              style={{
                background: ORANJE,
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Teamindeling →
            </button>
          </div>
          {/* Titel */}
          <h1
            className="pt-toel-titel"
            style={{ margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            <span
              style={{
                display: "block",
                fontSize: 15,
                fontWeight: 700,
                fontStyle: "normal",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#888",
                marginBottom: 6,
              }}
            >
              Voorlopige
            </span>
            <span
              style={{
                display: "block",
                fontSize: 52,
                fontWeight: 900,
                fontStyle: "italic",
                textTransform: "uppercase",
                color: "#111",
                lineHeight: 0.88,
                textShadow: "none",
              }}
            >
              Teamindeling
            </span>
            {toelichting && (
              <span
                style={{
                  display: "block",
                  fontSize: 18,
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: ORANJE,
                  marginTop: 6,
                }}
              >
                {toelichting.seizoenLabel}
              </span>
            )}
          </h1>
          {/* Snelkoppeling pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <button style={pillBtnStyle} onClick={() => setOpenModal("startdata")}>
              📅 Startdata
            </button>
            <button style={pillBtnStyle} onClick={() => setOpenModal("kennismaking")}>
              🏐 Kennismakingstraining
            </button>
            <button style={pillBtnStyle} onClick={() => setOpenModal("tcoproep")}>
              <Megaphone size={13} /> TC Oproep
            </button>
            <button style={pillBtnStyle} onClick={() => setOpenModal("vragen")}>
              <HelpCircle size={13} /> Vragen
            </button>
          </div>
        </div>
      </div>

      {/* Inhoud */}
      <div
        className="pt-toel-body"
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "28px 24px 100px",
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
      </div>

      {/* Sticky footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,102,0,0.15)",
          display: "flex",
          alignItems: "stretch",
          padding: "8px 0 env(safe-area-inset-bottom, 8px)",
        }}
      >
        <button style={footerBtnStyle} onClick={() => setOpenModal("startdata")}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>📅</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#555",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Data
          </span>
        </button>
        <button style={footerBtnStyle} onClick={() => setOpenModal("kennismaking")}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🏐</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#555",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Kennismaking
          </span>
        </button>
        <div
          style={{
            width: 1,
            background: "rgba(0,0,0,0.08)",
            margin: "6px 0",
            flexShrink: 0,
          }}
        />
        <button
          onClick={onGaNaar}
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>🏅</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: ORANJE,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Teamindeling →
          </span>
        </button>
      </div>

      {/* Modals */}
      <InfoModal open={openModal === "startdata"} onSluit={() => setOpenModal(null)}>
        <StartdataInhoud items={belangrijkeData} />
      </InfoModal>
      <InfoModal open={openModal === "kennismaking"} onSluit={() => setOpenModal(null)}>
        <KennismakingInhoud items={kennismakingstrainingen} />
      </InfoModal>
      <InfoModal open={openModal === "tcoproep"} onSluit={() => setOpenModal(null)}>
        <TcOproepInhoud />
      </InfoModal>
      <InfoModal open={openModal === "vragen"} onSluit={() => setOpenModal(null)}>
        <VragenInhoud />
      </InfoModal>
    </div>
  );
}
