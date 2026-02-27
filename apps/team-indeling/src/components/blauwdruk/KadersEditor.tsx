/**
 * KadersOverzicht — Toont KNKV Competitie 2.0 regels en OW-voorkeuren
 * per kleur/categorie als gestructureerde kaarten.
 *
 * Hardcoded (geen import-afhankelijkheid) — bron: rules/knkv-regels.md + rules/ow-voorkeuren.md
 *
 * Geboortejaren worden berekend op basis van het seizoen (PEILJAAR).
 */

const PEILJAAR = 2026; // Seizoen 2026-2027

// ============================================================
// Types & Data
// ============================================================

interface Regel {
  label: string;
  knkv?: string;
  ow?: string;
}

interface CategorieKaart {
  naam: string;
  subtitel: string;
  categorie: "A" | "B";
  regels: Regel[];
  accentKleur: string; // Tailwind border/bg kleur
  accentBg: string;    // Tailwind lichte achtergrond
}

/**
 * Bereken geboortejaar-range uit leeftijdsrange.
 * Voorbeeld: leeftijd 5-7 bij peiljaar 2026 → geboortejaren 2019-2021.
 */
function geboortejaren(minLeeftijd: number, maxLeeftijd: number): string {
  const laatsteJaar = PEILJAAR - minLeeftijd;
  const eersteJaar = PEILJAAR - maxLeeftijd;
  return `${eersteJaar}–${laatsteJaar}`;
}

const CATEGORIEEN: CategorieKaart[] = [
  {
    naam: "Blauw",
    subtitel: `5-7 jaar · geb. ${geboortejaren(5, 7)} · 4-tal · B-categorie`,
    categorie: "B",
    accentKleur: "border-blue-400",
    accentBg: "bg-blue-50",
    regels: [
      { label: "Geboortejaren", knkv: geboortejaren(5, 7) },
      { label: "Teamgrootte", knkv: "4 spelers op het veld", ow: "Ideaal 5-6 in selectie" },
      { label: "Leeftijdsspreiding", knkv: "Max 2 jaar binnen team" },
      { label: "Gender", knkv: "Geen onderscheid", ow: "Min 2 van elk geslacht" },
      { label: "Paalhoogte", knkv: "2.5m" },
      { label: "Bal", knkv: "Maat 3" },
      { label: "Wissels", knkv: "Onbeperkt" },
      { label: "Prioriteit", ow: "Sociaal (plezier)" },
    ],
  },
  {
    naam: "Groen",
    subtitel: `8-9 jaar · geb. ${geboortejaren(8, 9)} · 4-tal · B-categorie`,
    categorie: "B",
    accentKleur: "border-green-500",
    accentBg: "bg-green-50",
    regels: [
      { label: "Geboortejaren", knkv: geboortejaren(8, 9) },
      { label: "Teamgrootte", knkv: "4 spelers op het veld", ow: "Ideaal 5-6 in selectie" },
      { label: "Leeftijdsspreiding", knkv: "Max 2 jaar binnen team" },
      { label: "Gender", knkv: "2V+2M, 4V, of 4M", ow: "Min 2 van elk geslacht" },
      { label: "Paalhoogte", knkv: "3.0m" },
      { label: "Bal", knkv: "Maat 4" },
      { label: "Wissels", knkv: "Onbeperkt" },
      { label: "Prioriteit", ow: "1: Sociaal · 2: Ontwikkeling" },
    ],
  },
  {
    naam: "Geel",
    subtitel: `10-12 jaar · geb. ${geboortejaren(10, 12)} · 8-tal · B-categorie`,
    categorie: "B",
    accentKleur: "border-yellow-400",
    accentBg: "bg-yellow-50",
    regels: [
      { label: "Geboortejaren", knkv: geboortejaren(10, 12) },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) in selectie" },
      { label: "Leeftijdsspreiding", knkv: "Max 3 jaar binnen team" },
      { label: "Gem. leeftijd", knkv: "Min 9.0 jaar (hele team)" },
      { label: "Gender", knkv: "In principe 4+4, mag afwijken (hesjes)", ow: "Min 2 van elk geslacht" },
      { label: "Paalhoogte", knkv: "3.0m" },
      { label: "Bal", knkv: "Maat 4" },
      { label: "Wissels", knkv: "Onbeperkt" },
      { label: "Speeltijd", knkv: "2×25 min" },
      { label: "Prioriteit", ow: "1: Ontwikkeling · 2: Sociaal" },
    ],
  },
  {
    naam: "Oranje",
    subtitel: `13-15 jaar · geb. ${geboortejaren(13, 15)} · 8-tal · B-categorie`,
    categorie: "B",
    accentKleur: "border-orange-400",
    accentBg: "bg-orange-50",
    regels: [
      { label: "Geboortejaren", knkv: geboortejaren(13, 15) },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) in selectie" },
      { label: "Leeftijdsspreiding", knkv: "Max 3 jaar binnen team" },
      { label: "Gem. leeftijd", knkv: "Min 9.0 jaar (hele team)" },
      { label: "Gender", knkv: "In principe 4+4, mag afwijken (hesjes)", ow: "Min 2 van elk geslacht" },
      { label: "Paalhoogte", knkv: "3.5m" },
      { label: "Bal", knkv: "Maat 5" },
      { label: "Wissels", knkv: "Onbeperkt" },
      { label: "Speeltijd", knkv: "2×25 min" },
      { label: "Prioriteit", ow: "1: Ontwikkeling · 2: Sociaal" },
    ],
  },
  {
    naam: "Rood",
    subtitel: `16-18 jaar · geb. ${geboortejaren(16, 18)} · 8-tal · B-categorie`,
    categorie: "B",
    accentKleur: "border-red-400",
    accentBg: "bg-red-50",
    regels: [
      { label: "Geboortejaren", knkv: geboortejaren(16, 18) },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) in selectie" },
      { label: "Leeftijdsspreiding", knkv: "Max 3 jaar binnen team" },
      { label: "Gem. leeftijd", knkv: "Min 9.0 jaar (hele team)" },
      { label: "Gender", knkv: "In principe 4+4, mag afwijken (hesjes)", ow: "Min 2 van elk geslacht" },
      { label: "Paalhoogte", knkv: "3.5m" },
      { label: "Bal", knkv: "Maat 5" },
      { label: "Wissels", knkv: "Na 2 goals" },
      { label: "Speeltijd", knkv: "2×30 min" },
      { label: "Prioriteit", ow: "1: Sociaal · 2: Ontwikkeling" },
    ],
  },
  {
    naam: "U15",
    subtitel: `geb. ${PEILJAAR - 14}–${PEILJAAR - 13} · A-categorie · 8-tal`,
    categorie: "A",
    accentKleur: "border-purple-400",
    accentBg: "bg-purple-50",
    regels: [
      { label: "Geboortejaren", knkv: `${PEILJAAR - 14}–${PEILJAAR - 13} (strikt 2 jaar)` },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) per team" },
      { label: "Gender", knkv: "Verplicht 4V + 4M op het veld" },
      { label: "Vastspelen", knkv: "Na 3 wedstrijden in zelfde team" },
      { label: "Wissels", knkv: "Na 2 goals" },
      { label: "Speeltijd", knkv: "2×30 min" },
      { label: "Selectie", ow: "2 teams (prestatie + ontwikkeling), 20 spelers (10M+10V)" },
      { label: "Prioriteit", ow: "1: Teamsterkte · 2: Ontwikkeling" },
    ],
  },
  {
    naam: "U17",
    subtitel: `geb. ${PEILJAAR - 16}–${PEILJAAR - 15} · A-categorie · 8-tal`,
    categorie: "A",
    accentKleur: "border-purple-400",
    accentBg: "bg-purple-50",
    regels: [
      { label: "Geboortejaren", knkv: `${PEILJAAR - 16}–${PEILJAAR - 15} (strikt 2 jaar)` },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) per team" },
      { label: "Gender", knkv: "Verplicht 4V + 4M op het veld" },
      { label: "Vastspelen", knkv: "Na 3 wedstrijden in zelfde team" },
      { label: "Wissels", knkv: "Na 2 goals" },
      { label: "Speeltijd", knkv: "2×30 min" },
      { label: "Selectie", ow: "2 teams (prestatie + ontwikkeling), 20 spelers (10M+10V)" },
      { label: "Prioriteit", ow: "1: Teamsterkte · 2: Ontwikkeling" },
    ],
  },
  {
    naam: "U19",
    subtitel: `geb. ${PEILJAAR - 18}–${PEILJAAR - 17} · A-categorie · 8-tal`,
    categorie: "A",
    accentKleur: "border-purple-400",
    accentBg: "bg-purple-50",
    regels: [
      { label: "Geboortejaren", knkv: `${PEILJAAR - 18}–${PEILJAAR - 17} (strikt 2 jaar)` },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) per team" },
      { label: "Gender", knkv: "Verplicht 4V + 4M op het veld" },
      { label: "Vastspelen", knkv: "Na 3 wedstrijden in zelfde team" },
      { label: "Wissels", knkv: "Na 2 goals" },
      { label: "Speeltijd", knkv: "2×30 min" },
      { label: "Selectie", ow: "2 teams (prestatie + ontwikkeling), 20 spelers (10M+10V)" },
      { label: "Prioriteit", ow: "1: Teamsterkte · 2: Ontwikkeling" },
    ],
  },
  {
    naam: "Senioren A",
    subtitel: "Sen 1-4 · 8-tal · A-categorie (wedstrijdkorfbal)",
    categorie: "A",
    accentKleur: "border-indigo-400",
    accentBg: "bg-indigo-50",
    regels: [
      { label: "Leeftijd", knkv: "Geen beperking (19+)" },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) in selectie" },
      { label: "Gender", knkv: "Verplicht 4V + 4M op het veld" },
      { label: "Vastspelen", knkv: "Na 3 wedstrijden in zelfde team" },
      { label: "Wissels", knkv: "Na 2 goals" },
      { label: "Speeltijd", knkv: "2×30 min" },
      { label: "Prioriteit", ow: "Teamsterkte" },
    ],
  },
  {
    naam: "Senioren B",
    subtitel: "Sen 5+ · 8-tal · B-categorie (breedtesport)",
    categorie: "B",
    accentKleur: "border-gray-400",
    accentBg: "bg-gray-50",
    regels: [
      { label: "Leeftijd", knkv: "Geen beperking (19+)" },
      { label: "Teamgrootte", knkv: "6-8 op het veld", ow: "Ideaal 10 (5M+5V) in selectie" },
      { label: "Gender", knkv: "Mag afwijken van 4+4 (hesjes)", ow: "Min 2 van elk geslacht" },
      { label: "Wissels", knkv: "Onbeperkt" },
      { label: "Speeltijd", knkv: "2×30 min" },
      { label: "Prioriteit", ow: "Sociaal (plezier)" },
    ],
  },
];

// ============================================================
// Component
// ============================================================

export default function KadersOverzicht() {
  return (
    <div className="space-y-4">
      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          KNKV (verplicht)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-sky-100 border border-sky-300" />
          OW (voorkeur)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="badge-blue text-[10px] px-1.5 py-0">A</span>
          A-categorie
        </span>
        <span className="flex items-center gap-1.5">
          <span className="badge-gray text-[10px] px-1.5 py-0">B</span>
          B-categorie
        </span>
      </div>

      {/* Kaarten grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIEEN.map((cat) => (
          <CategorieKaartComponent key={cat.naam} categorie={cat} />
        ))}
      </div>
    </div>
  );
}

function CategorieKaartComponent({ categorie }: { categorie: CategorieKaart }) {
  return (
    <div className={`card border-l-4 ${categorie.accentKleur}`}>
      <div className={`card-header ${categorie.accentBg} flex items-center justify-between`}>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{categorie.naam}</h4>
          <p className="text-xs text-gray-500">{categorie.subtitel}</p>
        </div>
        <span className={categorie.categorie === "A" ? "badge-blue" : "badge-gray"}>
          {categorie.categorie === "A" ? "A-cat" : "B-cat"}
        </span>
      </div>
      <div className="card-body p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left font-medium text-gray-500 px-4 py-2 w-[120px]">Regel</th>
              <th className="text-left font-medium text-amber-700 px-3 py-2 bg-amber-50/50">KNKV</th>
              <th className="text-left font-medium text-sky-700 px-3 py-2 bg-sky-50/50">OW</th>
            </tr>
          </thead>
          <tbody>
            {categorie.regels.map((regel) => (
              <tr key={regel.label} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-1.5 font-medium text-gray-600">{regel.label}</td>
                <td className="px-3 py-1.5 text-gray-800 bg-amber-50/30">
                  {regel.knkv ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-1.5 text-gray-800 bg-sky-50/30">
                  {regel.ow ?? <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
