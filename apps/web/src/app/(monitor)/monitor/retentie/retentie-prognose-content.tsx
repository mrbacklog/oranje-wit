import type { ProjectieResult } from "@/lib/monitor/queries/samenstelling";
import { DoorstroomTable } from "../projecties/doorstroom-table";
import { ProjectiePiramide } from "../projecties/projectie-piramide";
import { U17ProjectionTable } from "../projecties/u17-projection-table";
import { SeniorenTable } from "../projecties/senioren-table";

export function PrognoseContent({
  projectie,
  piramideData,
}: {
  projectie: ProjectieResult;
  piramideData: {
    leeftijd: number;
    band: string;
    huidige_m: number;
    huidige_v: number;
    streef_m: number;
    streef_v: number;
  }[];
}) {
  return (
    <>
      <DoorstroomTable />
      <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
        <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
          Huidig vs. benodigd
        </h3>
        <p className="text-text-muted mb-4 text-xs">
          Bevolkingspiramide: huidige bezetting (solid) vs. streefaantallen (transparant) per
          leeftijd. Jongens links, meisjes rechts.
        </p>
        <ProjectiePiramide data={piramideData} />
      </div>
      <U17ProjectionTable u17={projectie.u17} />
      <SeniorenTable senioren={projectie.senioren} />
    </>
  );
}
