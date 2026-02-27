"use client";

interface TeamExportData {
  naam: string;
  spelers: {
    speler: {
      roepnaam: string;
      achternaam: string;
      geboortejaar: number;
      geslacht: string;
    };
  }[];
}

interface ExportPanelProps {
  teams: TeamExportData[];
  seizoen: string;
}

const PEILJAAR = 2026;

export default function ExportPanel({ teams, seizoen }: ExportPanelProps) {
  function exportCSV() {
    const header = "Team,Speler,Geboortejaar,Geslacht,Leeftijd";
    const rows: string[] = [];

    for (const team of teams) {
      for (const ts of team.spelers) {
        const s = ts.speler;
        const leeftijd = PEILJAAR - s.geboortejaar;
        const naam = `${s.roepnaam} ${s.achternaam}`;
        // Escape velden met komma's
        const escapedNaam = naam.includes(",") ? `"${naam}"` : naam;
        const escapedTeam = team.naam.includes(",")
          ? `"${team.naam}"`
          : team.naam;
        rows.push(
          `${escapedTeam},${escapedNaam},${s.geboortejaar},${s.geslacht},${leeftijd}`
        );
      }
    }

    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teamindeling-${seizoen}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printOverzicht() {
    window.print();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Exporteren</h3>
      <div className="flex gap-3">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>
        <button
          onClick={printOverzicht}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print overzicht
        </button>
      </div>
    </div>
  );
}
