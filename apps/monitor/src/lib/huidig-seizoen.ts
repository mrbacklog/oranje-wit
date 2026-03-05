import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export { HUIDIG_SEIZOEN };

/** Geeft true als het opgegeven seizoen het huidige (lopende) seizoen is */
export function isLopendSeizoen(seizoen: string): boolean {
  return seizoen === HUIDIG_SEIZOEN;
}
