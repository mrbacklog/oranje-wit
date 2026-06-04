export const dynamic = "force-dynamic";

import { getTeamsVoorPresentatie } from "./actions";
import { PresentatieCarousel } from "./_components/PresentatieCarousel";

export default async function PresentatiePage() {
  const result = await getTeamsVoorPresentatie();

  if (!result.ok) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "60vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p style={{ fontSize: 14, color: "var(--text-2)", textAlign: "center" }}>
          Kon presentatiedata niet laden.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            fontFamily: "monospace",
            background: "var(--bg-1)",
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid var(--border-0)",
          }}
        >
          {result.error}
        </p>
      </div>
    );
  }

  const { teams, peildatum } = result.data;

  return <PresentatieCarousel teams={teams} peildatum={peildatum} />;
}
