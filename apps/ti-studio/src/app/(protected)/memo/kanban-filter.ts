// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.ts
export type FilterType = "alles" | "team" | "speler" | "doelgroep" | "tc-algemeen";

export interface FilterbaarWerkitem {
  teamId: string | null;
  spelerId: string | null;
  doelgroep: string | null;
}

export function filterWerkitems<T extends FilterbaarWerkitem>(items: T[], filter: FilterType): T[] {
  switch (filter) {
    case "alles":
      return items;
    case "team":
      return items.filter((i) => i.teamId !== null);
    case "speler":
      return items.filter((i) => i.spelerId !== null);
    case "doelgroep":
      return items.filter((i) => i.doelgroep !== null && i.doelgroep !== "ALLE");
    case "tc-algemeen":
      return items.filter((i) => i.doelgroep === "ALLE");
  }
}
