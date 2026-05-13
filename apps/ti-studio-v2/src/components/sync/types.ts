export type SyncFresheid = "ok" | "stale" | "onbekend";

export interface SyncKaartData {
  id: "leden" | "competitie" | "historie";
  titel: string;
  laatstGesyncOp: Date | null;
  aantalRecords: number | null;
  fresheid: SyncFresheid;
}

export interface SyncStatus {
  leden: SyncKaartData;
  competitie: SyncKaartData;
  historie: SyncKaartData;
}

export interface SportlinkNotificatieRij {
  id: number;
  relCode: string;
  datum: Date;
  actie: string;
  entiteit: string;
  beschrijving: string;
  categorie: string;
  gewijzigdDoor: string;
  gesyncOp: Date;
}
