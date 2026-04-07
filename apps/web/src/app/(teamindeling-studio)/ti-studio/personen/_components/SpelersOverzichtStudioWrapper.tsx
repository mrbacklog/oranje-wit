"use client";

import { useState } from "react";
import SpelersOverzichtStudio from "./SpelersOverzichtStudio";
import { SpelerProfielDialog, DaisyWidget } from "@/components/ti-studio";
import type { StudioSpeler } from "../actions";

interface Props {
  spelers: StudioSpeler[];
}

export default function SpelersOverzichtStudioWrapper({ spelers }: Props) {
  const [profielId, setProfielId] = useState<string | null>(null);

  return (
    <>
      <SpelersOverzichtStudio spelers={spelers} onRowClick={setProfielId} />
      <SpelerProfielDialog
        spelerId={profielId}
        open={!!profielId}
        onClose={() => setProfielId(null)}
      />
      <DaisyWidget />
    </>
  );
}
