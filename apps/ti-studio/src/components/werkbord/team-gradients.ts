// Gedeelde gradient- en kleurband-definitie voor team-categorie kleuren
// Gebruikt in TeamDialog en TeamDrawer hero-sectie

export const KLEUR_GRADIENT: Record<string, string> = {
  blauw: "linear-gradient(135deg, rgba(59,130,246,.3) 0%, rgba(59,130,246,.05) 100%)",
  groen: "linear-gradient(135deg, rgba(34,197,94,.3) 0%, rgba(34,197,94,.05) 100%)",
  geel: "linear-gradient(135deg, rgba(234,179,8,.3) 0%, rgba(234,179,8,.05) 100%)",
  oranje: "linear-gradient(135deg, rgba(249,115,22,.3) 0%, rgba(249,115,22,.05) 100%)",
  rood: "linear-gradient(135deg, rgba(239,68,68,.3) 0%, rgba(239,68,68,.05) 100%)",
  senior: "linear-gradient(135deg, rgba(129,140,248,.3) 0%, rgba(129,140,248,.05) 100%)",
};

export const KLEUR_BAND: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#818cf8",
};

// Hero gradient: subtiele verticale fade (180deg) conform prototype
export const KLEUR_HERO_GRADIENT: Record<string, string> = {
  blauw: "linear-gradient(180deg, rgba(59,130,246,.12) 0%, transparent 100%)",
  groen: "linear-gradient(180deg, rgba(34,197,94,.12) 0%, transparent 100%)",
  geel: "linear-gradient(180deg, rgba(234,179,8,.12) 0%, transparent 100%)",
  oranje: "linear-gradient(180deg, rgba(249,115,22,.12) 0%, transparent 100%)",
  rood: "linear-gradient(180deg, rgba(220,38,38,.12) 0%, transparent 100%)",
  senior: "linear-gradient(180deg, rgba(129,140,248,.12) 0%, transparent 100%)",
};
