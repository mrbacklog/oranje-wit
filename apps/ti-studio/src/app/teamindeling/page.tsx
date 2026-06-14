import type { Metadata } from "next";
import { getPubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { PubliekeTeamindeling } from "./PubliekeTeamindeling";

export const metadata: Metadata = {
  title: "Teamindeling — c.k.v. Oranje Wit",
  description: "De officiële teamindeling van c.k.v. Oranje Wit",
};

export default async function PubliekeTeamindelingPage() {
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
