export { StatusEditor, STATUS_DOT, STATUS_LABELS } from "./StatusEditor";
export { IndelingEditor } from "./IndelingEditor";
export { GezienToggle } from "./GezienToggle";
export type { SpelerStatusWaarde } from "./StatusEditor";
export type { IndelingsDoel } from "./IndelingEditor";

/** Team-kleur → CSS kleur mapping (hoofd- en kleinletters). */
export const KLEUR_DOT: Record<string, string> = {
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};
