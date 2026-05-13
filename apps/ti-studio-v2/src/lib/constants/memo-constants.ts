// apps/ti-studio-v2/src/lib/constants/memo-constants.ts

export type MemoEntiteitType = "SPELER" | "STAF" | "TEAM" | "BLAUWDRUK";

export type MemoStatus =
  | "OPEN"
  | "IN_BESPREKING"
  | "OPGELOST"
  | "GEACCEPTEERD_RISICO"
  | "GEARCHIVEERD";

export type MemoPrioriteit = "BLOCKER" | "HOOG" | "MIDDEL" | "LAAG" | "INFO";

export type MemoDoelgroep =
  | "KWEEKVIJVER"
  | "ONTWIKKELHART"
  | "TOP"
  | "WEDSTRIJDSPORT"
  | "KORFBALPLEZIER"
  | "ALLE";

export const KANBAN_KOLOMMEN = [
  {
    status: "OPEN" as MemoStatus,
    label: "Open",
    dotVariant: "open" as const,
    isDone: false,
  },
  {
    status: "IN_BESPREKING" as MemoStatus,
    label: "In bespreking",
    dotVariant: "bespreking" as const,
    isDone: false,
  },
  {
    status: "GEACCEPTEERD_RISICO" as MemoStatus,
    label: "Geaccepteerd risico",
    dotVariant: "risico" as const,
    isDone: true,
  },
  {
    status: "OPGELOST" as MemoStatus,
    label: "Opgelost",
    dotVariant: "opgelost" as const,
    isDone: true,
  },
] as const;

export const PRIO_LABEL: Record<MemoPrioriteit, string> = {
  BLOCKER: "!",
  HOOG: "H",
  MIDDEL: "M",
  LAAG: "L",
  INFO: "i",
};

export const PRIO_KLEUR: Record<MemoPrioriteit, string> = {
  BLOCKER: "#ef4444",
  HOOG: "#f97316",
  MIDDEL: "#eab308",
  LAAG: "#3b82f6",
  INFO: "#8b5cf6",
};

export const PRIO_VOLGORDE: Record<MemoPrioriteit, number> = {
  BLOCKER: 0,
  HOOG: 1,
  MIDDEL: 2,
  LAAG: 3,
  INFO: 4,
};
