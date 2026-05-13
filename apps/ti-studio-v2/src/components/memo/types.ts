// apps/ti-studio-v2/src/components/memo/types.ts

import type {
  MemoEntiteitType,
  MemoStatus,
  MemoPrioriteit,
  MemoDoelgroep,
} from "@/lib/constants/memo-constants";

export type { MemoEntiteitType, MemoStatus, MemoPrioriteit, MemoDoelgroep };

export interface MemoKaartData {
  id: string;
  titel: string | null;
  beschrijving: string;
  prioriteit: MemoPrioriteit;
  status: MemoStatus;
  doelgroep: MemoDoelgroep | null;
  entiteit: MemoEntiteitType | null;
  entiteitLabel: string | null;
  aantalToelichtingen: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TijdlijnItem {
  id: string;
  type: "toelichting" | "log";
  auteurNaam: string;
  timestamp: Date;
  tekst?: string;
  actie?: "AANGEMAAKT" | "BEWERKT" | "STATUS_GEWIJZIGD" | "VERWIJDERD";
  detail?: string | null;
}

export interface MemoDetailData extends MemoKaartData {
  tijdlijn: TijdlijnItem[];
}
