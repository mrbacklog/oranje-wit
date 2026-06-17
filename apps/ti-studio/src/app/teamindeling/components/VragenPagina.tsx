"use client";

import Image from "next/image";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

export function VragenPagina({
  contactTekst,
  seizoenLabel,
}: {
  contactTekst: string;
  seizoenLabel?: string;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", paddingBottom: 120 }}>
      {/* Hero */}
      <div
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
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
          {seizoenLabel && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 8,
              }}
            >
              {seizoenLabel}
            </div>
          )}
          <h1 style={{ margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 4,
              }}
            >
              Hulp &amp; Contact
            </span>
            <span
              style={{
                display: "block",
                fontSize: 40,
                fontWeight: 900,
                fontStyle: "italic",
                textTransform: "uppercase",
                color: "#fff",
                lineHeight: 0.9,
              }}
            >
              Veelgestelde vragen
            </span>
          </h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
        {contactTekst && (
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 20,
            }}
            /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
            dangerouslySetInnerHTML={{ __html: contactTekst }}
          />
        )}
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
          Heb je vragen over de teamindeling? Neem contact op met de TC.
        </p>
      </div>
    </div>
  );
}
