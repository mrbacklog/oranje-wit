export const dynamic = "force-dynamic";

import { getTeamsVoorPresentatie } from "./actions";
import { PresentatieCarousel } from "./_components/PresentatieCarousel";
import { getPublicatieInstellingen } from "./publicatie-actions";

export default async function PresentatiePage() {
  const [result, publicatieResult] = await Promise.all([
    getTeamsVoorPresentatie(),
    getPublicatieInstellingen(),
  ]);

  if (!result.ok || !publicatieResult.ok) {
    let error = "Onbekende fout";
    if (!result.ok) error = result.error;
    if (!publicatieResult.ok) error = publicatieResult.error;
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
          {error}
        </p>
      </div>
    );
  }

  const { teams, peildatum } = result.data;

  return (
    <PresentatieCarousel
      teams={teams}
      peildatum={peildatum}
      publicatieInstellingen={publicatieResult.data}
    />
  );
}
