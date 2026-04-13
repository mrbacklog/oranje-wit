// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.ts

export type TijdlijnToelichting = {
  id: string;
  type: "toelichting";
  auteurNaam: string;
  auteurEmail: string;
  tekst: string;
  timestamp: string;
};

export type TijdlijnLog = {
  id: string;
  type: "log";
  auteurNaam: string;
  auteurEmail: string;
  actie: string;
  detail: string | null | undefined;
  timestamp: string;
};

export type TijdlijnItem = TijdlijnToelichting | TijdlijnLog;

export function mergeTijdlijn(
  toelichtingen: TijdlijnToelichting[],
  logItems: TijdlijnLog[]
): TijdlijnItem[] {
  return [...toelichtingen, ...logItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
