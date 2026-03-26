"use client";

type ScoutingContext = "WEDSTRIJD" | "TRAINING" | "OVERIG";

const CONTEXT_OPTIES: { value: ScoutingContext; label: string; icon: string }[] = [
  { value: "WEDSTRIJD", label: "Wedstrijd", icon: "🏟️" },
  { value: "TRAINING", label: "Training", icon: "🏃" },
  { value: "OVERIG", label: "Overig", icon: "📋" },
];

export function StapContext({
  context,
  contextDetail,
  onContextChange,
  onDetailChange,
}: {
  context: ScoutingContext | null;
  contextDetail: string;
  onContextChange: (v: ScoutingContext) => void;
  onDetailChange: (v: string) => void;
}) {
  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">In welke context heb je gescout?</h2>
      <p className="text-text-secondary mb-6 text-sm">Kies wanneer je dit team hebt gezien.</p>

      <div className="grid grid-cols-3 gap-3">
        {CONTEXT_OPTIES.map((optie) => (
          <button
            key={optie.value}
            type="button"
            onClick={() => onContextChange(optie.value)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95 ${
              context === optie.value
                ? "border-ow-oranje bg-ow-oranje/10 shadow-lg"
                : "bg-surface-card border-white/10 hover:border-white/20"
            } `}
          >
            <span className="text-3xl">{optie.icon}</span>
            <span className="text-sm font-semibold">{optie.label}</span>
          </button>
        ))}
      </div>

      {context && (
        <div className="mt-6 animate-[fadeIn_300ms_ease]">
          <label htmlFor="context-detail" className="text-text-secondary mb-1 block text-sm">
            Optioneel: tegenstander of locatie
          </label>
          <input
            id="context-detail"
            type="text"
            value={contextDetail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={context === "WEDSTRIJD" ? "Bijv. Deetos D1" : "Bijv. Dinsdagtraining"}
            className="bg-surface-card text-text-primary placeholder:text-text-muted focus:border-ow-oranje focus:ring-ow-oranje w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
