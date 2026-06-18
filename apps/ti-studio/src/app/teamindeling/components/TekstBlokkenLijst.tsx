// Gedeelde renderer voor TekstBlok-lijsten op alle publieke tabs
import type { TekstBlok } from "@/lib/teamindeling/publieke-presentatie";

const ORANJE = "#FF6600";

export function SectieKop({ label, titel }: { label?: string; titel?: string }) {
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

export function TekstBlokkenLijst({
  blokken,
  leegLabel,
}: {
  blokken: TekstBlok[];
  leegLabel?: string;
}) {
  if (blokken.length === 0) {
    return leegLabel ? (
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{leegLabel}</p>
    ) : null;
  }

  return (
    <>
      {blokken.map((blok) => (
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
              marginTop: blok.subtitle || blok.label ? 12 : 0,
            }}
            /* Inhoud uit TC-beheerd admin-formulier — geen externe gebruikersinvoer */
            dangerouslySetInnerHTML={{ __html: blok.tekst }}
          />
        </div>
      ))}
    </>
  );
}
