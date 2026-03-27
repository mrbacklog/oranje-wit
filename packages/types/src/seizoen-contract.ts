/**
 * Contracttypes voor seizoensstatus.
 *
 * Gedeeld contract voor alle apps die seizoensstatus nodig hebben.
 * Voorbereid op toekomstig gebruik (seizoensplanning, automatische overgang).
 */

/** Fase van een seizoen */
export type SeizoenStatusType = "VOORBEREIDING" | "ACTIEF" | "AFGEROND";

/** Seizoen met status zoals alle apps die verwachten */
export interface SeizoenContract {
  seizoen: string;
  status: SeizoenStatusType;
}
