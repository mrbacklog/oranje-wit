// apps/ti-studio/src/app/teamindeling/components/ToelichtingPagina.tsx
"use client";

import type {
  PubliekeTeamindelingData,
  BelangrijkeDatumItem,
  KennismakingItem,
} from "@/lib/teamindeling/publieke-presentatie";

const LOGO_URL = "https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp";

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
          color: "#FF6600",
          marginBottom: 5,
        }}
      >
        <span style={{ display: "inline-block", width: 12, height: 2, background: "#FF6600" }} />
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

function BelangrijkeDataBlok({ items }: { items: BelangrijkeDatumItem[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <SectieKop label="Planning" titel="Belangrijke data" />
      <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "8px 0",
              borderBottom: i < items.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#FF6600",
                flexShrink: 0,
                marginTop: 5,
              }}
            />
            <div>
              <span style={{ fontWeight: 700, color: "#111", fontSize: 14 }}>{item.datum}</span>
              <span style={{ fontSize: 14, color: "#444", marginLeft: 8 }}>
                {item.omschrijving}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KennismakingBlokToelichting({ items }: { items: KennismakingItem[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <SectieKop label="Kennismaking" titel="Kennismakingstrainingen" />
      <div
        style={{
          background: "rgba(255,102,0,0.06)",
          border: "1px solid rgba(255,102,0,0.2)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 13,
          color: "#555",
          margin: "10px 0 12px",
        }}
      >
        Alle nieuwe leden zijn welkom bij de kennismakingstraining van hun team.
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              padding: "10px 0",
              borderBottom: i < items.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
          >
            <div style={{ fontWeight: 700, color: "#111", fontSize: 14, marginBottom: 2 }}>
              {item.teamnaam}
            </div>
            <div style={{ fontSize: 13, color: "#555" }}>
              {item.datum} · {item.tijd}
              {item.locatie && <span style={{ color: "#888" }}> · {item.locatie}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToelichtingPagina({
  toelichting,
  onGaNaar,
}: {
  toelichting: PubliekeTeamindelingData["toelichting"];
  onGaNaar: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Hero — wit met oranje accenten */}
      <div
        className="pt-toel-hero"
        style={{
          background: "#fff",
          borderLeft: "5px solid #FF6600",
          padding: "40px 24px 32px",
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
            background: "#FF6600",
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            opacity: 0.1,
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Logo + seizoen */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  color: "#FF6600",
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
            {toelichting && <span style={{ color: "#FF6600" }}>{toelichting.seizoenLabel}</span>}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#888", fontWeight: 500 }}>
            c.k.v. Oranje Wit · Dordrecht
          </p>
        </div>
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

            {/* Belangrijke data */}
            <BelangrijkeDataBlok items={toelichting.belangrijkeData} />

            {/* Kennismakingstrainingen */}
            <KennismakingBlokToelichting items={toelichting.kennismakingstrainingen} />

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />

            {/* TC ondertekening */}
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
            background: "#FF6600",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "14px 28px",
            fontSize: 14,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          Bekijk de teamindeling →
        </button>
      </div>
    </div>
  );
}
