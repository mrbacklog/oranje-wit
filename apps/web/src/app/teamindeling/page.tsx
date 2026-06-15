import type { Metadata } from "next";
import { getPubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { PubliekeTeamindeling } from "./PubliekeTeamindeling";
import { checkWachtwoord, isGeldig } from "./wachtwoord-action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teamindeling — c.k.v. Oranje Wit",
  description: "De officiële teamindeling van c.k.v. Oranje Wit",
};

export default async function PubliekeTeamindelingPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const geldig = await isGeldig();

  if (!geldig) {
    const { fout } = await searchParams;
    return <WachtwoordScherm fout={fout === "1"} />;
  }

  const data = await getPubliekeTeamindelingData();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f9fafb",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#111827",
      }}
    >
      <PubliekeTeamindeling data={data} />
      <footer
        style={{
          background: "#111827",
          color: "#9ca3af",
          textAlign: "center",
          padding: "16px 24px",
          fontSize: 12,
        }}
      >
        <strong style={{ color: "white" }}>c.k.v. Oranje Wit</strong> · Dordrecht · Vragen?{" "}
        <strong style={{ color: "white" }}>tc@ckvoranjewit.nl</strong>
      </footer>
    </div>
  );
}

function WachtwoordScherm({ fout }: { fout: boolean }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #111827 0%, #1a0e00 100%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#ff6600",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            c.k.v. Oranje Wit
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
            Teamindeling
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>
            Voer het wachtwoord in om verder te gaan.
          </p>
        </div>

        <form action={checkWachtwoord}>
          <input
            name="wachtwoord"
            type="password"
            placeholder="Wachtwoord"
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: fout ? "2px solid #ef4444" : "1.5px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 15,
              outline: "none",
              color: "#111827",
              marginBottom: fout ? 6 : 16,
            }}
          />
          {fout && (
            <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 14px" }}>
              Onjuist wachtwoord, probeer opnieuw.
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#ff6600",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ga naar de teamindeling →
          </button>
        </form>
      </div>
    </div>
  );
}
