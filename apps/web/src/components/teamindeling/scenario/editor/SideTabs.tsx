"use client";

interface SideTabPoolProps {
  poolOpen: boolean;
  showEditDrawer: boolean;
  onToggle: () => void;
}

/** Linker side-tab voor de spelerspool (verberg als gepind). */
export function SideTabPool({ poolOpen, showEditDrawer, onToggle }: SideTabPoolProps) {
  return (
    <button
      onClick={onToggle}
      className={`absolute top-4 left-0 z-20 flex flex-col items-center gap-1.5 rounded-r-lg border border-l-0 px-2 py-4 shadow-md transition-colors ${
        poolOpen || showEditDrawer
          ? "border-orange-300 bg-orange-500 text-white"
          : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
      }`}
      title={poolOpen ? "Verberg spelerspool" : "Toon spelerspool"}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span
        className="text-[10px] font-semibold tracking-wide uppercase"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        Spelerspool
      </span>
    </button>
  );
}

interface SideTabsRightProps {
  rapportPinned: boolean;
  werkbordOpen: boolean;
  whatIfOpen: boolean;
  onOpenRapport: () => void;
  onOpenWerkbord: () => void;
  onOpenWhatIf: () => void;
}

/** Rechter side-tabs: Validatie + Werkbord + What-if. */
export function SideTabsRight({
  rapportPinned,
  werkbordOpen,
  whatIfOpen,
  onOpenRapport,
  onOpenWerkbord,
  onOpenWhatIf,
}: SideTabsRightProps) {
  return (
    <div className="absolute top-4 right-0 z-20 flex flex-col gap-2">
      {/* Side-tab: Validatie */}
      {!rapportPinned && (
        <button
          onClick={onOpenRapport}
          className="flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 border-orange-200 bg-orange-50 px-2 py-4 text-orange-600 shadow-md transition-colors hover:bg-orange-100"
          title="Validatierapport"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span
            className="text-[10px] font-semibold tracking-wide uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            Validatie
          </span>
        </button>
      )}

      {/* Side-tab: Werkbord */}
      <button
        onClick={onOpenWerkbord}
        className={`flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors ${
          werkbordOpen
            ? "border-orange-300 bg-orange-500 text-white"
            : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
        }`}
        title="Werkbord"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          Werkbord
        </span>
      </button>

      {/* Side-tab: What-if */}
      <button
        onClick={onOpenWhatIf}
        className={`flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors ${
          whatIfOpen
            ? "border-orange-300 bg-orange-500 text-white"
            : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
        }`}
        title="What-if"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          What-if
        </span>
      </button>
    </div>
  );
}
