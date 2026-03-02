"use client";

import { type ReactNode } from "react";
import { TabShell } from "@/components/layout/tab-shell";

interface SignaleringTabsProps {
  overzichtContent: ReactNode;
  wervingContent: ReactNode;
  retentieContent: ReactNode;
  pijplijnContent: ReactNode;
}

export function SignaleringTabs({
  overzichtContent,
  wervingContent,
  retentieContent,
  pijplijnContent,
}: SignaleringTabsProps) {
  return (
    <TabShell
      tabs={[
        {
          label: "Overzicht",
          beschrijving: "Samenvatting van alle signaleringen en strategisch advies per thema.",
          content: overzichtContent,
        },
        {
          label: "Werving",
          beschrijving: "Signaleringen over instroom en de vulgraad van de jeugdpijplijn.",
          content: wervingContent,
        },
        {
          label: "Retentie",
          beschrijving: "Signaleringen over ledenbehoud en trendbreuken.",
          content: retentieContent,
        },
        {
          label: "Pijplijn",
          beschrijving: "Signaleringen over doorstroom naar senioren en genderbalans.",
          content: pijplijnContent,
        },
      ]}
    />
  );
}
