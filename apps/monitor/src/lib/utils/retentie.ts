const KORFBALGROEPEN: Record<number, string> = {
  6: "F-jeugd",
  7: "F-jeugd",
  8: "E-jeugd",
  9: "E-jeugd",
  10: "D-jeugd",
  11: "D-jeugd",
  12: "C-jeugd",
  13: "C-jeugd",
  14: "B-jeugd",
  15: "B-jeugd",
  16: "A-jeugd",
  17: "A-jeugd",
  18: "Senioren",
  19: "Senioren",
  20: "Senioren",
  21: "Senioren",
  22: "Senioren",
  23: "Senioren",
  24: "Senioren",
  25: "Senioren",
};

export type RetentieDataPoint = {
  leeftijd: number;
  retentie: number;
  retentie_m?: number;
  retentie_v?: number;
};

export type KritiekMoment = {
  leeftijd: number;
  groep: string;
  retentie: number;
  daling: number;
  retentieM: number | null;
  retentieV: number | null;
  signaal: string | null;
};

export function detecteerKritiekeMomenten(data: RetentieDataPoint[]): KritiekMoment[] {
  if (data.length < 2) return [];

  const momenten: KritiekMoment[] = [];

  for (let i = 1; i < data.length; i++) {
    const vorig = data[i - 1];
    const huidig = data[i];
    const daling = huidig.retentie - vorig.retentie;

    if (daling < -3) {
      const retM = huidig.retentie_m ?? null;
      const retV = huidig.retentie_v ?? null;
      let signaal: string | null = null;

      if (retM !== null && retV !== null) {
        const verschil = Math.abs(retM - retV);
        if (verschil > 10) {
          signaal =
            retM < retV
              ? `Jongens ${verschil.toFixed(0)}pp lager`
              : `Meisjes ${verschil.toFixed(0)}pp lager`;
        }
      }

      momenten.push({
        leeftijd: huidig.leeftijd,
        groep: KORFBALGROEPEN[huidig.leeftijd] ?? "Overig",
        retentie: huidig.retentie,
        daling,
        retentieM: retM,
        retentieV: retV,
        signaal,
      });
    }
  }

  momenten.sort((a, b) => a.daling - b.daling);
  return momenten.slice(0, 7);
}

// ---------------------------------------------------------------------------
// Waterfall berekening
// ---------------------------------------------------------------------------

export type WaterfallItem = {
  label: string;
  waarde: number;
  type: "start" | "instroom" | "uitstroom" | "eind";
};

export function berekenWaterfall(
  behouden: number,
  instroomNieuw: number,
  instroomTerug: number,
  uitstroom: number
): WaterfallItem[] {
  const begin = behouden + uitstroom;
  return [
    { label: "Begin", waarde: begin, type: "start" },
    { label: "Nieuw", waarde: instroomNieuw, type: "instroom" },
    { label: "Terug", waarde: instroomTerug, type: "instroom" },
    { label: "Uitstroom", waarde: -uitstroom, type: "uitstroom" },
    { label: "Eind", waarde: begin + instroomNieuw + instroomTerug - uitstroom, type: "eind" },
  ];
}

// ---------------------------------------------------------------------------
// Patroon detectie
// ---------------------------------------------------------------------------

type LeeftijdRow = { leeftijd: number; M: number; V: number };

export function detecteerPatronen(data: LeeftijdRow[], type: "instroom" | "uitstroom"): string[] {
  if (data.length === 0) return [];

  const patronen: string[] = [];
  const label = type === "instroom" ? "instroom" : "uitstroom";

  const piek = data.reduce((max, r) => (r.M + r.V > max.M + max.V ? r : max), data[0]);
  patronen.push(
    `Piek ${label} bij leeftijd ${piek.leeftijd} (gem. ${(piek.M + piek.V).toFixed(1)} per seizoen)`
  );

  const piekM = data.reduce((max, r) => (r.M > max.M ? r : max), data[0]);
  const piekV = data.reduce((max, r) => (r.V > max.V ? r : max), data[0]);

  if (Math.abs(piekM.leeftijd - piekV.leeftijd) > 1) {
    const eerder = piekM.leeftijd < piekV.leeftijd ? "jongens" : "meisjes";
    const later = piekM.leeftijd < piekV.leeftijd ? "meisjes" : "jongens";
    patronen.push(
      `${label.charAt(0).toUpperCase() + label.slice(1)} ${eerder} piekt eerder (${Math.min(piekM.leeftijd, piekV.leeftijd)} jaar) dan ${later} (${Math.max(piekM.leeftijd, piekV.leeftijd)} jaar)`
    );
  }

  const piekWaarde = piek.M + piek.V;
  const drempel = piekWaarde * 0.3;
  const stabilisatie = data.find((r) => r.leeftijd > piek.leeftijd && r.M + r.V < drempel);
  if (stabilisatie) {
    patronen.push(`Na leeftijd ${stabilisatie.leeftijd} is de ${label} minimaal`);
  }

  const totaalM = data.reduce((s, r) => s + r.M, 0);
  const totaalV = data.reduce((s, r) => s + r.V, 0);
  const totaal = totaalM + totaalV;
  if (totaal > 0) {
    const pctM = ((totaalM / totaal) * 100).toFixed(0);
    const pctV = ((totaalV / totaal) * 100).toFixed(0);
    if (Math.abs(totaalM - totaalV) / totaal > 0.1) {
      patronen.push(`Verhouding: ${pctM}% jongens, ${pctV}% meisjes`);
    }
  }

  return patronen;
}
