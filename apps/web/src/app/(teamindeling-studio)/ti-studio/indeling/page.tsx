export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getWerkindelingVoorSeizoen } from "./actions";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getSpelerBasisData } from "@/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions";
import NieuwScenarioWizard from "@/components/teamindeling/scenarios/NieuwScenarioWizard";

export default async function IndelingPage() {
  const werkindeling = await getWerkindelingVoorSeizoen();

  // Als er een werkindeling is, ga direct naar de editor
  if (werkindeling) {
    redirect(`/ti-studio/scenarios/${werkindeling.id}`);
  }

  // Geen werkindeling — toon onboarding
  const seizoen = await getActiefSeizoen();
  const [blauwdruk, spelers] = await Promise.all([getBlauwdruk(seizoen), getSpelerBasisData()]);

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
          Nog geen werkindeling
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
          }}
        >
          Start de werkindeling vanuit de blauwdruk. Dit wordt de teamindeling waar het hele seizoen
          aan gewerkt wordt.
        </p>
        <NieuwScenarioWizard blauwdrukId={blauwdruk.id} spelers={spelers} bestaandeScenarios={[]} />
      </div>
    </div>
  );
}
