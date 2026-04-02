"use client";

interface WhatIfToolbarProps {
  vraag: string;
  heeftHardefouten: boolean;
  bezig: boolean;
  onVerlaat: () => void;
  onToepassen: () => void;
  onVerwerpen: () => void;
}

export default function WhatIfToolbar({
  vraag,
  heeftHardefouten,
  bezig,
  onVerlaat,
  onToepassen,
  onVerwerpen,
}: WhatIfToolbarProps) {
  return (
    <div className="relative flex h-12 items-center justify-between border-b-2 border-orange-500 bg-white px-4">
      {/* Links: verlaat-knop */}
      <div className="flex items-center gap-3">
        <button
          onClick={onVerlaat}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Verlaat what-if modus"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Verlaat what-if
        </button>
      </div>

      {/* Midden: what-if vraag */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-orange-700 uppercase">
          What-if
        </span>
        <p className="max-w-md truncate text-sm font-medium text-gray-800" title={vraag}>
          {vraag}
        </p>
      </div>

      {/* Rechts: verwerpen + toepassen */}
      <div className="flex items-center gap-2">
        <button
          onClick={onVerwerpen}
          disabled={bezig}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
        >
          Verwerpen
        </button>
        <button
          onClick={onToepassen}
          disabled={heeftHardefouten || bezig}
          className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          title={
            heeftHardefouten
              ? "Toepassen geblokkeerd door harde validatiefouten"
              : "Pas what-if toe op werkindeling"
          }
        >
          {bezig ? "Bezig..." : "Toepassen"}
        </button>
      </div>
    </div>
  );
}
