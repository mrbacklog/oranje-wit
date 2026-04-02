export const dynamic = "force-dynamic";

import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getCoordinatorTeamsMetSpelers } from "./actions";
import { CoordinatorGezienOverzicht } from "@/components/teamindeling/mobile/gezien/CoordinatorGezienOverzicht";

export default async function CoordinatorGezienPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);
  const { coordinator, teams } = await getCoordinatorTeamsMetSpelers(blauwdruk.id);

  // Serialiseer dates voor client
  const geserialiseerdeTeams = teams.map((team) => ({
    ...team,
    spelers: team.spelers.map((bs) => ({
      id: bs.id,
      spelerId: bs.spelerId,
      blauwdrukId: bs.blauwdrukId,
      gezienStatus: bs.gezienStatus,
      gezienStatusVoorgesteld: bs.gezienStatusVoorgesteld,
      gezienVoorgesteldDoor: bs.gezienVoorgesteldDoor,
      notitie: bs.notitie,
      signalering: bs.signalering,
      gezienDoor: bs.gezienDoor,
      actiepunt: bs.actiepunt
        ? {
            ...bs.actiepunt,
            deadline: bs.actiepunt.deadline ? bs.actiepunt.deadline.toISOString() : null,
          }
        : null,
      speler: {
        id: bs.speler.id,
        roepnaam: bs.speler.roepnaam,
        achternaam: bs.speler.achternaam,
        geboortejaar: bs.speler.geboortejaar,
        geslacht: bs.speler.geslacht,
        huidig: bs.speler.huidig as { team?: string; kleur?: string; a_categorie?: string } | null,
      },
    })),
  }));

  return (
    <CoordinatorGezienOverzicht
      coordinator={coordinator}
      teams={geserialiseerdeTeams}
      seizoen={seizoen}
    />
  );
}
