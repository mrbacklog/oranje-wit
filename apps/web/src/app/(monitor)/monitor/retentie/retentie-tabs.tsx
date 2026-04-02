"use client";

import { type ReactNode } from "react";
import { URLTabs } from "@/components/monitor/layout/url-tabs";

interface RetentieTabsProps {
  behoudContent: ReactNode;
  verloopContent: ReactNode;
  cohortenContent: ReactNode;
  prognoseContent: ReactNode;
}

export function RetentieTabs({
  behoudContent,
  verloopContent,
  cohortenContent,
  prognoseContent,
}: RetentieTabsProps) {
  return (
    <URLTabs
      tabs={[
        {
          id: "behoud",
          label: "Behoud",
          beschrijving:
            "Welk percentage leden keert seizoen na seizoen terug? De retentiecurve toont per leeftijd hoeveel spelers het volgende seizoen weer meedoen.",
          content: behoudContent,
        },
        {
          id: "verloop",
          label: "Verloop",
          beschrijving:
            "Instroom en uitstroom naast elkaar. Hoeveel nieuwe spelers komen erbij, hoeveel stoppen er — en waar zitten de patronen?",
          content: verloopContent,
        },
        {
          id: "cohorten",
          label: "Cohorten",
          beschrijving:
            "Hoe presteren instroom-jaargangen over de jaren? Volg elk cohort van binnenkomst tot nu — en zie welke jaargangen het best vasthouden.",
          content: cohortenContent,
        },
        {
          id: "prognose",
          label: "Prognose",
          beschrijving:
            "Waar staan we over 5 jaar? Doorstroomkansen, bevolkingspiramide en projecties voor U17 en senioren op basis van huidige cohorten.",
          content: prognoseContent,
        },
      ]}
    />
  );
}
