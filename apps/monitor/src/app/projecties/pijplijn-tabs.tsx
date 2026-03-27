"use client";

import { type ReactNode } from "react";
import { URLTabs } from "@/components/layout/url-tabs";

interface PijplijnTabsProps {
  pijplijnContent: ReactNode;
  projectieContent: ReactNode;
}

export function PijplijnTabs({ pijplijnContent, projectieContent }: PijplijnTabsProps) {
  return (
    <URLTabs
      tabs={[
        {
          id: "pijplijn",
          label: "Pijplijn",
          beschrijving:
            "Hoeveel spelers hebben we per leeftijd? Waar zitten de gaten en knelpunten ten opzichte van het streefmodel?",
          content: pijplijnContent,
        },
        {
          id: "projectie",
          label: "Projectie",
          beschrijving:
            "Hoe stromen spelers door naar senioren? Projectie op basis van historische doorstroompercentages.",
          content: projectieContent,
        },
      ]}
    />
  );
}
