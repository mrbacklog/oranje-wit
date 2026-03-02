"use client";

import { type ReactNode } from "react";
import { TabShell } from "@/components/layout/tab-shell";

interface RetentieTabsProps {
  behoudContent: ReactNode;
  instroomContent: ReactNode;
  uitstroomContent: ReactNode;
  cohortenContent: ReactNode;
}

export function RetentieTabs({
  behoudContent,
  instroomContent,
  uitstroomContent,
  cohortenContent,
}: RetentieTabsProps) {
  return (
    <TabShell
      tabs={[
        {
          label: "Behoud",
          beschrijving:
            "Welk percentage leden keert seizoen na seizoen terug? De retentiecurve toont per leeftijd hoeveel spelers het volgende seizoen weer meedoen.",
          content: behoudContent,
        },
        {
          label: "Instroom",
          beschrijving:
            "Hoeveel nieuwe spelers komen erbij? Instroom omvat zowel volledig nieuwe leden als herinschrijvers die na een onderbreking terugkeren.",
          content: instroomContent,
        },
        {
          label: "Uitstroom",
          beschrijving:
            "Hoeveel spelers stoppen er? Uitstroom laat per leeftijd zien wanneer leden de vereniging verlaten \u2014 en of dat bij jongens of meisjes vaker voorkomt.",
          content: uitstroomContent,
        },
        {
          label: "Cohorten",
          beschrijving:
            "Hoe presteren instroom-jaargangen over de jaren? Volg elk cohort van binnenkomst tot nu \u2014 en zie welke jaargangen het best vasthouden.",
          content: cohortenContent,
        },
      ]}
    />
  );
}
