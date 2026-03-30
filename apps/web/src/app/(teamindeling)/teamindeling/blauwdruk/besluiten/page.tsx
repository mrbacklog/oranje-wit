export const dynamic = "force-dynamic";

import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getBesluiten } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/besluit-actions";
import { BesluitenMobileOverzicht } from "@/components/teamindeling/mobile/blauwdruk/BesluitenMobileOverzicht";

export default async function BesluitenMobilePage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);
  const besluiten = await getBesluiten(blauwdruk.id);

  // Serialize dates voor client component
  const serialized = besluiten.map((b) => ({
    id: b.id,
    vraag: b.vraag,
    isStandaard: b.isStandaard,
    standaardCode: b.standaardCode,
    groep: b.groep,
    antwoord: b.antwoord,
    toelichting: b.toelichting,
    status: b.status,
    niveau: b.niveau,
    doelgroep: b.doelgroep,
    auteur: b.auteur,
    actiepunten: b.actiepunten.map(
      (a: {
        id: string;
        beschrijving: string;
        status: string;
        deadline: Date | null;
        toegewezenAan: { naam: string };
      }) => ({
        ...a,
        deadline: a.deadline?.toISOString() ?? null,
      })
    ),
  }));

  return (
    <BesluitenMobileOverzicht blauwdrukId={blauwdruk.id} seizoen={seizoen} besluiten={serialized} />
  );
}
