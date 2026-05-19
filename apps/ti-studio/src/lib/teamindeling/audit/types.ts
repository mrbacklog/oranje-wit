import { z } from "zod";

export const WerkbordMutatieType = z.enum([
  "speler_verplaatst",
  "speler_naar_pool",
  "team_positie",
  "selectie_speler_toegevoegd",
  "selectie_speler_verwijderd",
  "selectie_bundeling_toggle",
  "speler_indeling_gezet",
  "speler_handmatig_aangemaakt",
]);
export type WerkbordMutatieType = z.infer<typeof WerkbordMutatieType>;

export interface LogInput {
  versieId: string;
  type: WerkbordMutatieType;
  doorId: string;
  payload: Record<string, unknown>;
  inverse?: Record<string, unknown> | null;
  spelerId?: string | null;
  vanTeamId?: string | null;
  naarTeamId?: string | null;
  selectieGroepId?: string | null;
  sessionId?: string | null;
}
