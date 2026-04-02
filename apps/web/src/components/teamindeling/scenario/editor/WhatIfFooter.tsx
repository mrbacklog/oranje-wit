"use client";

interface WhatIfFooterProps {
  bezig: boolean;
  onVerwerpen: () => void;
  onBewaren: () => void;
  onToepassen: () => void;
  heeftHardefouten: boolean;
}

export default function WhatIfFooter({
  bezig,
  onVerwerpen,
  onBewaren,
  onToepassen,
  heeftHardefouten,
}: WhatIfFooterProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-end gap-2 border-t border-orange-200 bg-orange-50 px-4">
      <button
        onClick={onVerwerpen}
        disabled={bezig}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
      >
        Verwerpen
      </button>
      <button
        onClick={onBewaren}
        disabled={bezig}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        Bewaren
      </button>
      <button
        onClick={onToepassen}
        disabled={heeftHardefouten || bezig}
        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        title={
          heeftHardefouten ? "Toepassen geblokkeerd door harde validatiefouten" : "Pas what-if toe"
        }
      >
        {bezig ? "Bezig..." : "Toepassen"}
      </button>
    </div>
  );
}
