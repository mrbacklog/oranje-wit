"use client";

import { type ReactNode } from "react";
import { TabShell } from "@/components/layout/tab-shell";

interface PijplijnTabsProps {
  pijplijnContent: ReactNode;
  projectieContent: ReactNode;
}

export function PijplijnTabs({ pijplijnContent, projectieContent }: PijplijnTabsProps) {
  return (
    <TabShell
      tabs={[
        {
          label: "Pijplijn",
          beschrijving:
            "Hoeveel spelers hebben we per leeftijd? Waar zitten de gaten en knelpunten ten opzichte van het streefmodel?",
          content: pijplijnContent,
        },
        {
          label: "Projectie",
          beschrijving:
            "Hoe stromen spelers door naar senioren? Projectie op basis van historische doorstroompercentages.",
          content: projectieContent,
        },
      ]}
    />
  );
}
