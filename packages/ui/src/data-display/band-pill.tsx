const BAND_COLORS: Record<string, string> = {
  Blauw: "bg-band-blauw text-white",
  Groen: "bg-band-groen text-white",
  Geel: "bg-band-geel",
  Oranje: "bg-band-oranje text-white",
  Rood: "bg-band-rood text-white",
  Senioren: "",
};

const GEEL_TEXT_COLOR = "#422006";
const SENIOREN_STYLE = {
  backgroundColor: "var(--text-tertiary)",
  color: "#ffffff",
};
const FALLBACK_STYLE = {
  backgroundColor: "var(--surface-sunken)",
  color: "var(--text-secondary)",
};

export function BandPill({ band }: { band: string }) {
  const classes = BAND_COLORS[band];

  if (band === "Senioren") {
    return (
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={SENIOREN_STYLE}
      >
        {band}
      </span>
    );
  }

  if (classes == null) {
    return (
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={FALLBACK_STYLE}
      >
        {band}
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
      style={band === "Geel" ? { color: GEEL_TEXT_COLOR } : undefined}
    >
      {band}
    </span>
  );
}
