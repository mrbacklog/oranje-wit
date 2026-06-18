import type { Metadata } from "next";
import { getPubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { PubliekeTeamindeling } from "./PubliekeTeamindeling";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teamindeling — c.k.v. Oranje Wit",
  description: "Voorlopige teamindeling 2026-2027 van c.k.v. Oranje Wit",
  openGraph: {
    title: "Teamindeling — c.k.v. Oranje Wit",
    description: "Voorlopige teamindeling 2026-2027 van c.k.v. Oranje Wit",
    siteName: "c.k.v. Oranje Wit",
  },
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
    </div>
  );
}
