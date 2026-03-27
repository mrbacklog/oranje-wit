import type { Rol, BesluitStatus, Doelgroep } from "@oranje-wit/database";

interface BesluitData {
  status: BesluitStatus;
  niveau: string;
  doelgroep: Doelgroep | null;
}

/**
 * Bepaalt of een gebruiker met een bepaalde rol een besluit mag zien.
 * EDITOR ziet alles; COORDINATOR ziet eigen doelgroep + ALLE;
 * REVIEWER ziet alleen DEFINITIEF van eigen doelgroep;
 * VIEWER ziet alleen DEFINITIEF + doelgroep ALLE.
 */
export function magBesluitZien(
  userRol: Rol,
  userDoelgroepen: Doelgroep[],
  besluit: BesluitData
): boolean {
  // EDITOR ziet alles
  if (userRol === "EDITOR") return true;

  const doelgroepMatch =
    !besluit.doelgroep ||
    besluit.doelgroep === "ALLE" ||
    userDoelgroepen.includes(besluit.doelgroep);

  // COORDINATOR ziet eigen doelgroep (alle statussen)
  if (userRol === "COORDINATOR") {
    return doelgroepMatch;
  }

  // REVIEWER ziet alleen DEFINITIEF van eigen doelgroep
  if (userRol === "REVIEWER") {
    return besluit.status === "DEFINITIEF" && doelgroepMatch;
  }

  // VIEWER ziet alleen DEFINITIEF + doelgroep ALLE
  if (userRol === "VIEWER") {
    return besluit.status === "DEFINITIEF" && (!besluit.doelgroep || besluit.doelgroep === "ALLE");
  }

  return false;
}

/**
 * Bepaalt of een gebruiker een actiepunt mag zien.
 * EDITOR ziet alles; rest ziet alleen eigen toegewezen actiepunten.
 */
export function magActiepuntZien(
  userRol: Rol,
  userEmail: string,
  actiepuntToegewezenEmail: string
): boolean {
  if (userRol === "EDITOR") return true;
  return userEmail === actiepuntToegewezenEmail;
}
