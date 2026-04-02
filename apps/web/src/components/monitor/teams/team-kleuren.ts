export type TeamKleurConfig = {
  gradient: string;
  textOnGradient: string;
  tintBg: string;
  borderColor: string;
  glowColor: string;
  topBorder?: string;
};

const KNKV_BAND: Record<string, TeamKleurConfig> = {
  Blauw: {
    gradient: "linear-gradient(135deg, var(--knkv-blauw-600), var(--knkv-blauw-400))",
    textOnGradient: "#ffffff",
    tintBg: "color-mix(in srgb, var(--knkv-blauw-500) 8%, var(--surface-card))",
    borderColor: "color-mix(in srgb, var(--knkv-blauw-500) 25%, var(--border-default))",
    glowColor: "color-mix(in srgb, var(--knkv-blauw-500) 20%, transparent)",
  },
  Groen: {
    gradient: "linear-gradient(135deg, var(--knkv-groen-600), var(--knkv-groen-400))",
    textOnGradient: "#ffffff",
    tintBg: "color-mix(in srgb, var(--knkv-groen-500) 8%, var(--surface-card))",
    borderColor: "color-mix(in srgb, var(--knkv-groen-500) 25%, var(--border-default))",
    glowColor: "color-mix(in srgb, var(--knkv-groen-500) 20%, transparent)",
  },
  Geel: {
    gradient: "linear-gradient(135deg, var(--knkv-geel-600), var(--knkv-geel-400))",
    textOnGradient: "#422006",
    tintBg: "color-mix(in srgb, var(--knkv-geel-500) 8%, var(--surface-card))",
    borderColor: "color-mix(in srgb, var(--knkv-geel-500) 25%, var(--border-default))",
    glowColor: "color-mix(in srgb, var(--knkv-geel-500) 20%, transparent)",
  },
  Oranje: {
    gradient: "linear-gradient(135deg, var(--knkv-oranje-600), var(--knkv-oranje-400))",
    textOnGradient: "#ffffff",
    tintBg: "color-mix(in srgb, var(--knkv-oranje-500) 8%, var(--surface-card))",
    borderColor: "color-mix(in srgb, var(--knkv-oranje-500) 25%, var(--border-default))",
    glowColor: "color-mix(in srgb, var(--knkv-oranje-500) 20%, transparent)",
  },
  Rood: {
    gradient: "linear-gradient(135deg, var(--knkv-rood-600), var(--knkv-rood-400))",
    textOnGradient: "#ffffff",
    tintBg: "color-mix(in srgb, var(--knkv-rood-500) 8%, var(--surface-card))",
    borderColor: "color-mix(in srgb, var(--knkv-rood-500) 25%, var(--border-default))",
    glowColor: "color-mix(in srgb, var(--knkv-rood-500) 20%, transparent)",
  },
};

const U_LEEFTIJD_MAP: Record<string, number> = {
  U15: 14,
  U17: 17,
  U19: 17,
};

function getAgeGradientConfig(age: number): TeamKleurConfig {
  return {
    gradient: `var(--age-${age}-gradient)`,
    textOnGradient: `var(--age-${age}-text)`,
    tintBg: `var(--age-${age}-bg)`,
    borderColor: "var(--border-default)",
    glowColor: `color-mix(in srgb, var(--age-${age}-solid) 20%, transparent)`,
  };
}

const SENIOREN_CONFIG: TeamKleurConfig = {
  gradient: "linear-gradient(135deg, var(--surface-raised), var(--surface-card))",
  textOnGradient: "var(--text-primary)",
  tintBg: "var(--surface-card)",
  borderColor: "var(--border-default)",
  glowColor: "color-mix(in srgb, var(--ow-oranje-500) 15%, transparent)",
  topBorder: "var(--ow-oranje-500)",
};

const OVERIG_CONFIG: TeamKleurConfig = {
  gradient:
    "linear-gradient(135deg, var(--surface-raised), color-mix(in srgb, var(--ow-oranje-500) 6%, var(--surface-raised)))",
  textOnGradient: "var(--text-primary)",
  tintBg: "var(--surface-card)",
  borderColor: "var(--border-default)",
  glowColor: "color-mix(in srgb, var(--ow-oranje-500) 10%, transparent)",
};

export function getTeamKleurConfig(team: {
  kleur?: string | null;
  leeftijdsgroep?: string | null;
  ow_code: string;
}): TeamKleurConfig {
  if (team.kleur && KNKV_BAND[team.kleur]) {
    return KNKV_BAND[team.kleur];
  }

  if (team.ow_code.startsWith("U")) {
    const prefix = team.ow_code.split("-")[0];
    const age = U_LEEFTIJD_MAP[prefix];
    if (age) return getAgeGradientConfig(age);
  }

  if (/^\d+$/.test(team.ow_code) || team.ow_code.startsWith("MW")) {
    return SENIOREN_CONFIG;
  }

  return OVERIG_CONFIG;
}
