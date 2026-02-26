const BAND_COLORS: Record<string, string> = {
  Blauw: "bg-band-blauw text-white",
  Groen: "bg-band-groen text-white",
  Geel: "bg-band-geel text-gray-800",
  Oranje: "bg-band-oranje text-white",
  Rood: "bg-band-rood text-white",
  Senioren: "bg-gray-600 text-white",
};

export function BandPill({ band }: { band: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_COLORS[band] || "bg-gray-200 text-gray-600"}`}>
      {band}
    </span>
  );
}
