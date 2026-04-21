/** Lid uit Sportlink SearchMembers response */
export interface SportlinkLid {
  PublicPersonId: string;
  FullName: string | null;
  LastName: string | null;
  Infix: string | null;
  Initials: string | null;
  FirstName: string | null;
  NickName: string | null;
  DateOfBirth: string;
  GenderCode: "Male" | "Female";
  GenderDescription: string;
  MemberStatus: string;
  MemberStatusDescription: string;
  TypeOfMember: string;
  TypeOfMemberDescription: string;
  RelationStart: string;
  RelationEnd: string | null;
  MemberSince: string;
  Email: string | null;
  AgeClassDescription: string | null;
  ClubTeams: string | null;
  ClubGameActivities: string | null;
  KernelGameActivities: string | null;
  LastUpdate: string;
  Age: number;
  PersonImageDate: string | null;
}

/** Team uit UnionTeams response */
export interface SportlinkTeam {
  PublicTeamId: string;
  TeamCode: string;
  TeamName: string;
  GameActivityId: string;
  GameActivityIdTag: string;
  GameActivityDescription: string;
  GenderCode: string;
  Gender: string;
  TeamMemberCount: number;
  PlayerCount: number;
  IsClassified: boolean;
  IsUnionTeam: boolean;
}

/** Teamlid uit SearchTeams response */
export interface SportlinkTeamLid {
  PublicPersonId: string;
  FullName: string;
  FirstName: string;
  LastName: string;
  Infix: string | null;
  DateOfBirth: string;
  GenderCode: "Male" | "Female";
  MemberStatus: string;
  TypeOfTeam: string;
  TypeOfTeamDescription: string;
  TeamId: string;
  TeamName: string;
  TeamRoleDescription: string;
  TeamFunctionDescription: string | null;
  TeamPersonStartDate: string;
  TeamPersonEndDate: string | null;
  IsPlayer: boolean;
  IsOnMatchForm: boolean;
  GameTypeDescription: string;
  GameDayDescription: string;
  TeamAgeClassDescription: string | null;
  KernelGameActivities: string | null;
  ClubGameActivities: string | null;
  Status: string;
}

/** Notificatie uit Notifications response */
export interface SportlinkNotificatie {
  ReadStatus: string;
  TypeOfAction: "insert" | "update" | "delete";
  TypeOfActionDescription: string;
  Entity: "member" | "membership" | "player" | "clubfunction";
  Category: string;
  Description: string;
  ChangeVector: string | null;
  PublicActionId: string;
  ChangedBy: string;
  DateOfChange: string;
  PublicPersonId: string;
  PersonFullName: string;
  IsPhotoChange: boolean;
  IsClickAllowed: boolean;
}

/** Login resultaat */
export interface SportlinkToken {
  navajoToken: string;
  clubId: string;
  userName: string;
}

/** Enkele veld-wijziging binnen een lid */
export interface VeldWijziging {
  veld: string;
  oud: string | null;
  nieuw: string | null;
}

/** Wijziging op lid-niveau (nieuw of bestaande met één of meer veld-wijzigingen) */
export interface LidWijziging {
  relCode: string;
  naam: string;
  type: "nieuw" | "bijgewerkt";
  wijzigingen: VeldWijziging[];
}

/** Sync resultaat voor leden */
export interface LedenSyncResultaat {
  bijgewerkt: number;
  nieuw: number;
  ongewijzigd: number;
  totaalVergeleken: number;
  wijzigingen: LidWijziging[];
}

/** Team-sync dry run resultaat */
export interface TeamSyncDryRun {
  spelvorm: "Veld" | "Zaal";
  periode: string;
  teams: TeamSyncTeam[];
  nieuwInTeam: TeamSyncWijziging[];
  uitTeam: TeamSyncWijziging[];
  teamWissels: TeamSyncWijziging[];
  stafWijzigingen: TeamSyncWijziging[];
}

export interface TeamSyncTeam {
  teamCode: string;
  teamNaam: string;
  aantalSpelers: number;
  aantalStaf: number;
}

export interface TeamSyncWijziging {
  relCode: string;
  naam: string;
  vanTeam: string | null;
  naarTeam: string | null;
  rol: string;
  functie: string | null;
}

/** Selectie die de TC aanlevert bij het doorvoeren van de dry-run */
export interface TeamSyncSelectie {
  /** relCodes van nieuw-in-team items die aangemaakt moeten worden */
  nieuwRelCodes: string[];
  /** relCodes van uit-team items (alleen bron='sportlink') die verwijderd moeten worden */
  uitRelCodes: string[];
  /** relCodes van team-wissel items waarvan team bijgewerkt moet worden */
  wisselRelCodes: string[];
}
