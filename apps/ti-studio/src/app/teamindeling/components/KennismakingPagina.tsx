"use client";

import Image from "next/image";
import type { KennismakingItem, TekstBlok } from "@/lib/teamindeling/publieke-presentatie";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

export function KennismakingPagina({
  kennismakingstrainingen,
  kennismakingBlokken,
  seizoenLabel,
}: {
  kennismakingstrainingen: KennismakingItem[];
  kennismakingBlokken: TekstBlok[];
  seizoenLabel?: string;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f" }}>
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
              Nieuw seizoen
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
              Kennismakingstrainingen
            </span>
          </h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
        {/* Intro blokken */}
        {kennismakingBlokken.map((blok) => (
          <div key={blok.id} style={{ marginBottom: 20 }}>
            {blok.subtitle && (
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {blok.subtitle}
              </h3>
            )}
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.75)",
              }}
              /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
              dangerouslySetInnerHTML={{ __html: blok.tekst }}
            />
          </div>
        ))}

        {kennismakingBlokken.length === 0 && (
          <div
            style={{
              background: "rgba(255,102,0,0.06)",
              border: "1px solid rgba(255,102,0,0.2)",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 20,
            }}
          >
            Alle nieuwe leden zijn welkom bij de kennismakingstraining van hun team.
          </div>
        )}

        {kennismakingstrainingen.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Nog geen trainingen ingepland.
          </p>
        ) : (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {kennismakingstrainingen.map((item, i) => (
                <li
                  key={i}
                  style={{
                    padding: "10px 0",
                    borderBottom:
                      i < kennismakingstrainingen.length - 1
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "none",
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
          </div>
        )}
      </div>
    </div>
  );
}
