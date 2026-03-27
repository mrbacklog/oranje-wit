"use client";

import { type ReactNode } from "react";
import { URLTabs } from "@/components/monitor/layout/url-tabs";

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
    <URLTabs
      tabs={[
        {
          id: "overzicht",
          label: "Overzicht",
          beschrijving: "Samenvatting van alle signaleringen en strategisch advies per thema.",
          content: overzichtContent,
        },
        {
          id: "werving",
          label: "Werving",
          beschrijving: "Signaleringen over instroom en de vulgraad van de jeugdpijplijn.",
          content: wervingContent,
        },
        {
          id: "retentie",
          label: "Retentie",
          beschrijving: "Signaleringen over ledenbehoud en trendbreuken.",
          content: retentieContent,
        },
        {
          id: "pijplijn",
          label: "Pijplijn",
          beschrijving: "Signaleringen over doorstroom naar senioren en genderbalans.",
          content: pijplijnContent,
        },
      ]}
    />
  );
}
