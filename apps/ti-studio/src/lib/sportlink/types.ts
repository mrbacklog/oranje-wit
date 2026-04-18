/** Lid uit Sportlink SearchMembers response */
export interface SportlinkLid {
  PublicPersonId: string;
  FirstName: string | null;
  LastName: string | null;
  FullName: string | null;
  Infix: string | null;
  DateOfBirth: string;
  GenderCode: "Male" | "Female";
  MemberStatus: string;
  RelationStart: string;
  RelationEnd: string | null;
  AgeClassDescription: string;
  ClubTeams: string | null;
  KernelGameActivities: string | null;
  Email: string | null;
  Mobile: string | null;
}

/** Resultaat van de diff engine */
export interface SyncDiff {
  nieuwe: NieuwLid[];
  afgemeld: AfgemeldLid[];
  fuzzyMatches: FuzzyMatch[];
}

export interface NieuwLid {
  lid: SportlinkLid;
  isNieuwLid: boolean;
}

export type AfmeldReden = "afmelddatum" | "niet-actief" | "niet-spelend" | "verdwenen";

export interface AfgemeldLid {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
  reden: AfmeldReden;
}

export interface FuzzyMatch {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
}

export interface SyncRequest {
  email: string;
  password: string;
}

export interface ApplyRequest {
  nieuwe: string[];
  afgemeld: string[];
  koppelingen: string[];
}
