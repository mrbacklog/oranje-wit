"use client";

import Link from "next/link";

// Leeftijdsgroep-volgorde
const GROEP_VOLGORDE = ["rood", "oranje", "geel", "groen", "blauw", "paars"];

const GROEP_LABELS: Record<string, string> = {
  rood: "Rood (16-18)",
  oranje: "Oranje (13-15)",
  geel: "Geel (10-12)",
  groen: "Groen (8-9)",
  blauw: "Blauw (6-7)",
  paars: "Paars (5)",
  overig: "Overig",
};

const GROEP_KLEUREN: Record<string, { border: string; bg: string; text: string }> = {
  rood: { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-400" },
  oranje: { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400" },
  geel: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400" },
  groen: { border: "border-green-500", bg: "bg-green-500/10", text: "text-green-400" },
  blauw: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-400" },
  paars: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-400" },
  overig: { border: "border-gray-500", bg: "bg-surface-dark0/10", text: "text-text-muted" },
};

interface Team {
  id: number;
  owCode: string;
  naam: string | null;
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  isSelectie: boolean;
}

interface TeamGridProps {
  groepen: Record<string, Team[]>;
}

export function TeamGrid({ groepen }: TeamGridProps) {
  // Sorteer groepen op KNKV-volgorde
  const gesorteerdeGroepen = Object.entries(groepen).sort(([a], [b]) => {
    const indexA = GROEP_VOLGORDE.indexOf(a);
    const indexB = GROEP_VOLGORDE.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

  if (gesorteerdeGroepen.length === 0) {
    return (
      <div className="bg-surface-card rounded-2xl p-8 text-center">
        <p className="text-text-muted">Geen jeugdteams gevonden voor dit seizoen.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {gesorteerdeGroepen.map(([groep, teams]) => {
        const kleuren = GROEP_KLEUREN[groep] ?? GROEP_KLEUREN.overig;

        return (
          <section key={groep}>
            <h2 className={`mb-3 text-sm font-bold tracking-wider uppercase ${kleuren.text}`}>
              {GROEP_LABELS[groep] ?? groep}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className={`touch-target flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97] ${kleuren.border} ${kleuren.bg} hover:shadow-lg hover:shadow-black/20`}
                >
                  {/* Team-kleur dot */}
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: team.kleur ?? "#888" }}
                  />

                  {/* Teamnaam */}
                  <span className="text-text-primary text-sm font-bold">
                    {team.naam ?? team.owCode}
                  </span>

                  {/* Labels */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {team.isSelectie && (
                      <span className="text-text-secondary rounded-full bg-surface-card/10 px-2 py-0.5 text-[10px] font-medium">
                        Selectie
                      </span>
                    )}
                    {team.spelvorm && (
                      <span className="text-text-secondary rounded-full bg-surface-card/10 px-2 py-0.5 text-[10px] font-medium">
                        {team.spelvorm}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
