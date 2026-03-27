import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { bepaalLeeftijdsgroep } from "@/lib/scouting/leeftijdsgroep";
import { SCOUTING_CONFIG } from "@/lib/scouting/vragen";
import { VerzoekRapportWizard } from "./verzoek-rapport-wizard";

interface PageProps {
  params: Promise<{ id: string; relCode: string }>;
}

export default async function BeoordeelPage({ params }: PageProps) {
  const { id: verzoekId, relCode } = await params;

  // Haal speler op
  const speler = (await (prisma.speler as any).findUnique({
    where: { id: relCode },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      huidig: true,
      seizoenenActief: true,
    },
  })) as {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string;
    huidig: unknown;
    seizoenenActief: number | null;
  } | null;

  if (!speler) notFound();

  // Haal verzoek op voor context
  const verzoek = (await (prisma as any).scoutingVerzoek.findUnique({
    where: { id: verzoekId },
    select: {
      id: true,
      type: true,
      doel: true,
      toelichting: true,
      deadline: true,
    },
  })) as {
    id: string;
    type: string;
    doel: string;
    toelichting: string | null;
    deadline: Date | null;
  } | null;

  if (!verzoek) notFound();

  // Foto check
  const heeftFoto = (await prisma.lidFoto.count({ where: { relCode } })) > 0;

  // Tussenvoegsel
  const lid = (await (prisma.lid as any).findUnique({
    where: { relCode },
    select: { tussenvoegsel: true },
  })) as { tussenvoegsel: string | null } | null;

  const groep = bepaalLeeftijdsgroep(speler);
  const config = SCOUTING_CONFIG[groep];

  return (
    <VerzoekRapportWizard
      verzoekId={verzoekId}
      verzoek={{
        type: verzoek.type,
        doel: verzoek.doel,
        toelichting: verzoek.toelichting,
        deadline: verzoek.deadline?.toISOString() ?? null,
      }}
      speler={{
        id: speler.id,
        roepnaam: speler.roepnaam,
        achternaam: speler.achternaam,
        tussenvoegsel: lid?.tussenvoegsel ?? null,
        geboortejaar: speler.geboortejaar,
        geslacht: speler.geslacht as "M" | "V",
        seizoenenActief: speler.seizoenenActief,
        heeftFoto,
      }}
      leeftijdsgroep={groep}
      schaalType={config.schaalType}
      maxScore={config.maxScore}
      vragen={config.vragen}
    />
  );
}
