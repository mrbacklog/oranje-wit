export type LeeftijdCategorie =
  | "kangoeroe"
  | "blauw"
  | "groen"
  | "geel"
  | "oranje"
  | "rood"
  | "senior";

export type LeeftijdKolomSize = "normaal" | "rijk" | "hero" | "hover";

interface LeeftijdKolomProps {
  leeftijd: number;
  category: LeeftijdCategorie;
  size?: LeeftijdKolomSize;
}

// Breedte per size
const BREEDTE: Record<LeeftijdKolomSize, number> = {
  normaal: 40,
  rijk: 40,
  hero: 56,
  hover: 48,
};

const FONT_GROOT: Record<LeeftijdKolomSize, number> = {
  normaal: 15,
  rijk: 15,
  hero: 22,
  hover: 20,
};

const FONT_KLEIN: Record<LeeftijdKolomSize, number> = {
  normaal: 9,
  rijk: 9,
  hero: 12,
  hover: 11,
};

// Zet decimale leeftijd om naar hele jaren en decimalen (.DD)
function splitLeeftijd(leeftijd: number): { jaren: string; decimalen: string } {
  const jaren = Math.floor(leeftijd);
  const decimalen = Math.round((leeftijd - jaren) * 100);
  return {
    jaren: String(jaren),
    decimalen: `.${String(decimalen).padStart(2, "0")}`,
  };
}

// Bepaal de CSS-variabele voor het gradient op basis van leeftijd in jaren
function leeftijdGradientVar(jaren: number): string {
  const j = Math.min(Math.max(jaren, 4), 19);
  return `var(--leeftijd-${j})`;
}

export function LeeftijdKolom({ leeftijd, size = "normaal" }: LeeftijdKolomProps) {
  const { jaren, decimalen } = splitLeeftijd(leeftijd);
  const jarenNum = parseInt(jaren, 10);
  const gradient = leeftijdGradientVar(jarenNum);
  const breedte = BREEDTE[size];
  const fontGroot = FONT_GROOT[size];
  const fontKlein = FONT_KLEIN[size];

  return (
    <div
      className="leeft-col"
      style={{
        width: breedte,
        height: "100%",
        background: gradient,
        borderRadius: "0 4px 4px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <span
        className="lb"
        style={{
          color: "#fff",
          fontSize: fontGroot,
          fontWeight: 800,
          textShadow: "0 1px 2px rgba(0,0,0,.5)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {jaren}
      </span>
      <span
        className="ld"
        style={{
          color: "rgba(255,255,255,.7)",
          fontSize: fontKlein,
          fontWeight: 700,
          marginTop: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {decimalen}
      </span>
    </div>
  );
}
