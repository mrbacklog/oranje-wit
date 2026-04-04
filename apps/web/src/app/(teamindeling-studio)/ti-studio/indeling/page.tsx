export const dynamic = "force-dynamic";

import { getOfMaakWerkindelingVoorSeizoen } from "./actions";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

export default async function IndelingPage() {
  const werkindeling = await getOfMaakWerkindelingVoorSeizoen("systeem");

  if (werkindeling) {
    // Werkindeling gevonden of aangemaakt — toon basisinfo
    // In Task 4 wordt hier de volledige editor getoond
    return (
      <div
        style={{
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          {werkindeling.naam}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Seizoen {werkindeling.blauwdruk?.seizoen} &middot; Status: {werkindeling.status}
        </p>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "var(--text-tertiary)",
          }}
        >
          Editor wordt geladen in Task 4.
        </p>
      </div>
    );
  }

  // Geen blauwdruk — toon melding
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen).catch(() => null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          padding: "2rem",
          borderRadius: "var(--radius-xl, 16px)",
          backgroundColor: "var(--surface-raised)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Geen blauwdruk gevonden
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          Maak eerst een blauwdruk aan voor seizoen {seizoen} via het beheer-paneel.
          {blauwdruk && ` (blauwdruk ID: ${blauwdruk.id})`}
        </p>
      </div>
    </div>
  );
}
