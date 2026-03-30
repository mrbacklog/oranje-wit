export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import {
  getBlauwdrukSpelers,
  getGezienVoortgang,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/gezien-actions";
import { getBesluitStats } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/besluit-actions";
import { BlauwdrukMobileOverzicht } from "@/components/teamindeling/mobile/blauwdruk/BlauwdrukMobileOverzicht";
import { PEILJAAR } from "@oranje-wit/types";

/** Map huidig.kleur / huidig.a_categorie naar een categorie-sleutel */
function bepaalCategorie(
  huidig: { kleur?: string; a_categorie?: string } | null,
  geboortejaar: number
): string {
  if (!huidig) return "ONBEKEND";
  if (huidig.a_categorie) return huidig.a_categorie.toUpperCase();
  if (huidig.kleur) return huidig.kleur.toUpperCase();
  // Fallback op leeftijd
  const leeftijd = PEILJAAR - geboortejaar;
  if (leeftijd >= 19) return "SENIOREN_A";
  return "ONBEKEND";
}

export default async function BlauwdrukMobilePage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);

  const [spelerRecords, voortgang, besluitStats, users] = await Promise.all([
    getBlauwdrukSpelers(blauwdruk.id),
    getGezienVoortgang(blauwdruk.id),
    getBesluitStats(blauwdruk.id),
    prisma.user.findMany({
      select: { id: true, naam: true },
      orderBy: { naam: "asc" },
    }),
  ]);

  // Groepeer spelers per categorie
  const categorieMap = new Map<string, { totaal: number; gezien: number; signaleringen: number }>();

  for (const record of spelerRecords) {
    const speler = record.speler;
    const cat = bepaalCategorie(
      speler.huidig as { kleur?: string; a_categorie?: string } | null,
      speler.geboortejaar
    );

    const entry = categorieMap.get(cat) ?? {
      totaal: 0,
      gezien: 0,
      signaleringen: 0,
    };
    entry.totaal++;
    if (record.gezienStatus !== "ONGEZIEN") entry.gezien++;
    if (record.signalering) entry.signaleringen++;
    categorieMap.set(cat, entry);
  }

  const categorieStats = Array.from(categorieMap.entries()).map(([sleutel, stats]) => ({
    sleutel,
    ...stats,
  }));

  // Serialize records voor de client component
  const serializedRecords = spelerRecords.map((r) => ({
    id: r.id,
    spelerId: r.spelerId,
    gezienStatus: r.gezienStatus,
    notitie: r.notitie,
    signalering: r.signalering,
    speler: {
      id: r.speler.id,
      roepnaam: r.speler.roepnaam,
      achternaam: r.speler.achternaam,
      geboortejaar: r.speler.geboortejaar,
      geslacht: r.speler.geslacht,
      huidig: r.speler.huidig as {
        team?: string;
        kleur?: string;
        a_categorie?: string;
      } | null,
      status: r.speler.status,
    },
    actiepunt: r.actiepunt
      ? {
          id: r.actiepunt.id,
          beschrijving: r.actiepunt.beschrijving,
          status: r.actiepunt.status,
          deadline: r.actiepunt.deadline?.toISOString() ?? null,
          toegewezenAan: r.actiepunt.toegewezenAan,
        }
      : null,
    gezienDoor: r.gezienDoor,
  }));

  return (
    <BlauwdrukMobileOverzicht
      blauwdrukId={blauwdruk.id}
      seizoen={seizoen}
      voortgang={voortgang}
      categorieStats={categorieStats}
      besluitStats={besluitStats}
      records={serializedRecords}
      users={users}
    />
  );
}
