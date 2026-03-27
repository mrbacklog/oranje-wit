import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { RapportWizard } from "./rapport-wizard";
import { bepaalLeeftijdsgroep } from "@/lib/scouting/leeftijdsgroep";
import { getScoutingConfigV3 } from "@/lib/scouting/vragen";

interface PageProps {
  params: Promise<{ relCode: string }>;
}

export default async function NieuwRapportPage({ params }: PageProps) {
  const { relCode } = await params;

  const speler = (await (prisma.speler as any).findUnique({
    where: { id: relCode },
  })) as {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    huidig: unknown;
  } | null;

  if (!speler) {
    notFound();
  }

  const groep = bepaalLeeftijdsgroep(speler);
  const config = getScoutingConfigV3(groep);

  return (
    <RapportWizard
      speler={{
        id: speler.id,
        roepnaam: speler.roepnaam,
        achternaam: speler.achternaam,
        geboortejaar: speler.geboortejaar,
      }}
      leeftijdsgroep={groep}
      config={config}
    />
  );
}
