/** OW Design System — Kleuren voor programmatisch gebruik (charts, Framer Motion, etc.) */

export const colors = {
  ow: {
    oranje: "#ff6b00",
    oranjeLight: "#ff8c33",
    oranjeDark: "#c24e00",
  },
  knkv: {
    paars: "#a855f7",
    blauw: "#3b82f6",
    groen: "#22c55e",
    geel: "#eab308",
    oranje: "#f97316",
    rood: "#ef4444",
  },
  tier: {
    brons: "#cd7f32",
    zilver: "#a8a9ad",
    goud: "#d4a017",
  },
  signal: {
    groen: "#22c55e",
    geel: "#f59e0b",
    rood: "#ef4444",
  },
  semantic: {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  surface: {
    dark: {
      page: "#0f1115",
      card: "#1a1d23",
      raised: "#22262e",
      sunken: "#0a0c0f",
    },
    light: {
      page: "#ffffff",
      card: "#ffffff",
      raised: "#ffffff",
      sunken: "#f9fafb",
    },
  },
  text: {
    dark: {
      primary: "#f3f4f6",
      secondary: "#9ca3af",
      muted: "#6b7280",
    },
    light: {
      primary: "#111827",
      secondary: "#6b7280",
      muted: "#9ca3af",
    },
  },
  /** Legacy compat — gebruik liever knkv.* */
  band: {
    blauw: "#3b82f6",
    groen: "#22c55e",
    geel: "#eab308",
    oranje: "#f97316",
    rood: "#ef4444",
  },
} as const;

/** Leeftijdsgradiënten voor programmatisch gebruik */
export const ageGradients: Record<
  number,
  { from: string; to: string; solid: string; text: string }
> = {
  5: { from: "#a855f7", to: "#818cf8", solid: "#a855f7", text: "#ffffff" },
  6: { from: "#3b82f6", to: "#60a5fa", solid: "#3b82f6", text: "#ffffff" },
  7: { from: "#3b82f6", to: "#6dd5a3", solid: "#3b82f6", text: "#ffffff" },
  8: { from: "#22c55e", to: "#4ade80", solid: "#22c55e", text: "#ffffff" },
  9: { from: "#22c55e", to: "#bef264", solid: "#22c55e", text: "#ffffff" },
  10: { from: "#eab308", to: "#bef264", solid: "#eab308", text: "#422006" },
  11: { from: "#eab308", to: "#facc15", solid: "#eab308", text: "#422006" },
  12: { from: "#eab308", to: "#fdba74", solid: "#eab308", text: "#422006" },
  13: { from: "#f97316", to: "#fde047", solid: "#f97316", text: "#ffffff" },
  14: { from: "#f97316", to: "#fb923c", solid: "#f97316", text: "#ffffff" },
  15: { from: "#f97316", to: "#fca5a5", solid: "#f97316", text: "#ffffff" },
  16: { from: "#ef4444", to: "#fdba74", solid: "#ef4444", text: "#ffffff" },
  17: { from: "#ef4444", to: "#f87171", solid: "#ef4444", text: "#ffffff" },
  18: { from: "#b91c1c", to: "#991b1b", solid: "#b91c1c", text: "#ffffff" },
};

/** KNKV leeftijdsgroep naar kleur mapping */
export const ageGroupColor: Record<string, string> = {
  paars: "#a855f7",
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
};
