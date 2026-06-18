"use client";

import Image from "next/image";
import type { TekstBlok, BelangrijkeDatumItem } from "@/lib/teamindeling/publieke-presentatie";
import { TekstBlokkenLijst } from "./TekstBlokkenLijst";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";
const ORANJE = "#FF6600";

export function KalenderPagina({
  kalenderBlokken,
  belangrijkeData,
  seizoenLabel,
}: {
  kalenderBlokken: TekstBlok[];
  belangrijkeData: BelangrijkeDatumItem[];
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
              Seizoensplanning
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
              Kalender &amp; Planning
            </span>
          </h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
        {/* Tekst blokken */}
        <TekstBlokkenLijst blokken={kalenderBlokken} />

        {/* Belangrijke data tabel */}
        {belangrijkeData.length > 0 && (
          <div style={{ marginTop: kalenderBlokken.length > 0 ? 8 : 0 }}>
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
                marginBottom: 12,
              }}
            >
              <span style={{ display: "inline-block", width: 12, height: 2, background: ORANJE }} />
              Startdata &amp; belangrijke data
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
                {belangrijkeData.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      padding: "10px 0",
                      borderBottom:
                        i < belangrijkeData.length - 1
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
                        boxShadow: `0 0 6px rgba(255,102,0,0.5)`,
                      }}
                    />
                    <div>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                        {item.datum}
                      </span>
                      <span
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginLeft: 10 }}
                      >
                        {item.omschrijving}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {kalenderBlokken.length === 0 && belangrijkeData.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Nog geen kalenderinformatie beschikbaar.
          </p>
        )}
      </div>
    </div>
  );
}
