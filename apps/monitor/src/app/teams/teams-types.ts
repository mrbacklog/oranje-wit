import type { TeamRegisterEntry, TeamSpeler, TeamSpelerTelling } from "@/lib/queries/teams";
import type { StafLid } from "@/lib/queries/staf";
import type { TeamUitslagen } from "@/lib/queries/uitslagen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TeamData = TeamRegisterEntry & { displayNaam: string };
export type ChipGroep = { label: string; codes: string[] };

export type Props = {
  seizoen: string;
  seizoenen: string[];
  teams: TeamData[];
  chipGroepen: ChipGroep[];
  stafPerTeam: Record<string, StafLid[]>;
  uitslagenPerTeam: Record<string, TeamUitslagen>;
  spelersPerTeam: Record<string, TeamSpeler[]>;
  tellingPerTeam: Record<string, TeamSpelerTelling>;
  selectieGroepen: Record<string, { naam: string; teamCodes: string[] }>;
};

export type Tab = "team" | "resultaten";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BAND_DOT: Record<string, string> = {
  Blauw: "bg-band-blauw",
  Groen: "bg-band-groen",
  Geel: "bg-band-geel",
  Oranje: "bg-band-oranje",
  Rood: "bg-band-rood",
};

export const PERIODE_LABELS: Record<string, string> = {
  veld_najaar: "Veld najaar",
  zaal: "Zaal",
  veld_voorjaar: "Veld voorjaar",
};

export const PERIODE_VOLGORDE = ["veld_najaar", "zaal", "veld_voorjaar"];

export const STAF_ROL_VOLGORDE: Record<string, number> = {
  "Trainer/Coach": 1,
  Teammanager: 2,
  Fysio: 3,
  Analist: 4,
  Verzorger: 5,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PERIODE_PRIO_ZAAL = ["zaal_deel1", "zaal_deel2", "veld_najaar", "veld_voorjaar"] as const;
const PERIODE_PRIO_VELD = ["veld_najaar", "veld_voorjaar", "zaal_deel1", "zaal_deel2"] as const;

export function getJCode(team: TeamData): string | null {
  const prio = team.ow_code.startsWith("MW") ? PERIODE_PRIO_VELD : PERIODE_PRIO_ZAAL;
  for (const p of prio) {
    const pd = team.periodes[p];
    if (pd?.j_nummer) return pd.j_nummer;
  }
  return null;
}
