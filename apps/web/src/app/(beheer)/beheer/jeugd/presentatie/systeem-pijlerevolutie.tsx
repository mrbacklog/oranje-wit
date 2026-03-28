"use client";

import { motion } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*  Animation variants (gedeeld)                                              */
/* -------------------------------------------------------------------------- */

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

export const pillPop = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

/* -------------------------------------------------------------------------- */
/*  Inline SVG icons                                                          */
/* -------------------------------------------------------------------------- */

export function ArrowDown({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "var(--text-tertiary)"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

export function ArrowRight({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "var(--text-tertiary)"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pill component                                                            */
/* -------------------------------------------------------------------------- */

interface PillProps {
  label: string;
  color: string;
  badge?: string;
}

export function Pill({ label, color, badge }: PillProps) {
  return (
    <motion.span
      variants={pillPop}
      className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      {label}
      {badge && (
        <span
          className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] leading-none font-bold uppercase"
          style={{ color: "var(--surface-page)", backgroundColor: color }}
        >
          {badge}
        </span>
      )}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Data-constanten                                                           */
/* -------------------------------------------------------------------------- */

export const BLAUW = "var(--knkv-blauw-500)";
export const GEEL = "var(--knkv-geel-500)";
export const ORANJE = "var(--knkv-oranje-500)";
export const ROOD = "var(--knkv-rood-500)";
export const GROEN = "var(--knkv-groen-500)";

export interface LeeftijdsRij {
  leeftijd: string;
  color: string;
  pijlers: { label: string; badge?: string }[];
}

export const evolutieRijen: LeeftijdsRij[] = [
  {
    leeftijd: "5 – 9 jaar",
    color: BLAUW,
    pijlers: [
      { label: "BAL" },
      { label: "BEWEGEN" },
      { label: "SPEL" },
      { label: "SAMEN" },
      { label: "IK" },
    ],
  },
  {
    leeftijd: "10 – 12 jaar",
    color: GEEL,
    pijlers: [
      { label: "AANVALLEN" },
      { label: "VERDEDIGEN" },
      { label: "TECHNIEK" },
      { label: "TACTIEK" },
      { label: "MENTAAL" },
      { label: "FYSIEK" },
    ],
  },
  {
    leeftijd: "13 – 15 jaar",
    color: ORANJE,
    pijlers: [
      { label: "AANVALLEN" },
      { label: "VERDEDIGEN" },
      { label: "TECHNIEK" },
      { label: "TACTIEK" },
      { label: "MENTAAL" },
      { label: "FYSIEK" },
      { label: "SOCIAAL", badge: "NIEUW" },
    ],
  },
  {
    leeftijd: "16 – 18 jaar",
    color: ROOD,
    pijlers: [
      { label: "AANVALLEN" },
      { label: "VERDEDIGEN" },
      { label: "TECHNIEK" },
      { label: "TACTIEK" },
      { label: "MENTAAL" },
      { label: "FYSIEK" },
      { label: "SOCIAAL" },
      { label: "SCOREN", badge: "NIEUW" },
      { label: "SPELINTELLIGENTIE", badge: "NIEUW" },
    ],
  },
];

export interface TransformatieRij {
  van: string;
  naar: string[];
}

export const transformatieRijen: TransformatieRij[] = [
  { van: "BAL", naar: ["AANVALLEN", "TECHNIEK"] },
  { van: "BEWEGEN", naar: ["FYSIEK", "AANVALLEN", "VERDEDIGEN"] },
  { van: "SPEL", naar: ["VERDEDIGEN", "TACTIEK"] },
  { van: "SAMEN", naar: ["TACTIEK", "MENTAAL"] },
  { van: "IK", naar: ["MENTAAL"] },
];

export interface KnkvActie {
  label: string;
}

export const aanvallendeActies: KnkvActie[] = [
  { label: "Opzetten van de aanval" },
  { label: "Doorbreken in de aanval" },
  { label: "Scoren in de aanval" },
  { label: "Herstart na doelpunt/overtreding" },
];

export const verdedigendeActies: KnkvActie[] = [
  { label: "Druk zetten" },
  { label: "Onderscheppen" },
  { label: "Voorkomen van een doelpunt" },
  { label: "Herstart na balverlies" },
];

export interface KaartLaag {
  titel: string;
  subtitel: string;
  pijlers: string[];
  color: string;
}

export const kaartLagen: KaartLaag[] = [
  { titel: "Korfbalacties", subtitel: "WAT", pijlers: ["AANVALLEN", "VERDEDIGEN"], color: GROEN },
  { titel: "Spelerskwaliteiten", subtitel: "HOE", pijlers: ["TECHNIEK", "TACTIEK"], color: GEEL },
  {
    titel: "Persoonlijk",
    subtitel: "WIE",
    pijlers: ["MENTAAL", "SOCIAAL", "FYSIEK"],
    color: ORANJE,
  },
];

export interface Methode {
  emoji: string;
  titel: string;
  duur: string;
  beschrijving: string;
}

export const scoutingsMethoden: Methode[] = [
  {
    emoji: "\u{1F465}",
    titel: "Team",
    duur: "~1 min",
    beschrijving:
      "Snelle impressie van het hele team. Elke speler krijgt een score per pijler op basis van een teamobservatie.",
  },
  {
    emoji: "\u{1F50D}",
    titel: "Individueel",
    duur: "~5-10 min",
    beschrijving:
      "Diepgaande analyse van een individuele speler. Per pijler worden specifieke observaties en scores vastgelegd.",
  },
  {
    emoji: "\u2696\uFE0F",
    titel: "Vergelijking",
    duur: "~2 min",
    beschrijving:
      "Twee of meer spelers worden naast elkaar beoordeeld op dezelfde pijlers. Ideaal voor selectiemomenten.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Sub-componenten                                                           */
/* -------------------------------------------------------------------------- */

export function GroteStapMarker() {
  return (
    <motion.div variants={fadeUp} className="relative py-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: "var(--knkv-geel-500)" }} />
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="bliksem">
            {"\u26A1"}
          </span>
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: "var(--knkv-geel-500)" }}
          >
            De Grote Stap
          </span>
          <span className="text-lg" role="img" aria-label="bliksem">
            {"\u26A1"}
          </span>
        </div>
        <div className="h-px flex-1" style={{ backgroundColor: "var(--knkv-geel-500)" }} />
      </div>
      <p className="mt-1 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        Van basisbewegingen naar korfbalspecifieke pijlers
      </p>
    </motion.div>
  );
}
