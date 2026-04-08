"use client";

interface SideTabPoolProps {
  poolOpen: boolean;
  showEditDrawer: boolean;
  onToggle: () => void;
}

/** Linker side-tab voor de spelerspool (verberg als gepind). */
export function SideTabPool({ poolOpen, showEditDrawer, onToggle }: SideTabPoolProps) {
  const isActive = poolOpen || showEditDrawer;
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 left-0 z-20 flex flex-col items-center gap-1.5 rounded-r-lg border border-l-0 px-2 py-4 shadow-md transition-colors"
      style={
        isActive
          ? {
              background: "var(--ow-oranje-500)",
              borderColor: "var(--ow-oranje-500)",
              color: "#fff",
            }
          : {
              background: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--ow-oranje-500)",
            }
      }
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
  versiesOpen: boolean;
  onOpenRapport: () => void;
  onOpenWerkbord: () => void;
  onOpenWhatIf: () => void;
  onOpenVersies: () => void;
}

/** Rechter side-tabs: Validatie + Werkbord + What-if + Versies. */
export function SideTabsRight({
  rapportPinned,
  werkbordOpen,
  whatIfOpen,
  versiesOpen,
  onOpenRapport,
  onOpenWerkbord,
  onOpenWhatIf,
  onOpenVersies,
}: SideTabsRightProps) {
  return (
    <div className="absolute top-4 right-0 z-20 flex flex-col gap-2">
      {/* Side-tab: Validatie */}
      {!rapportPinned && (
        <button
          onClick={onOpenRapport}
          className="flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--border-default)",
            color: "var(--ow-oranje-500)",
          }}
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
        className="flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors"
        style={
          werkbordOpen
            ? {
                background: "var(--ow-oranje-500)",
                borderColor: "var(--ow-oranje-500)",
                color: "#fff",
              }
            : {
                background: "var(--surface-card)",
                borderColor: "var(--border-default)",
                color: "var(--ow-oranje-500)",
              }
        }
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
        className="flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors"
        style={
          whatIfOpen
            ? {
                background: "var(--ow-oranje-500)",
                borderColor: "var(--ow-oranje-500)",
                color: "#fff",
              }
            : {
                background: "var(--surface-card)",
                borderColor: "var(--border-default)",
                color: "var(--ow-oranje-500)",
              }
        }
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

      {/* Side-tab: Versies */}
      <button
        onClick={onOpenVersies}
        className="flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors"
        style={
          versiesOpen
            ? {
                background: "var(--ow-oranje-500)",
                borderColor: "var(--ow-oranje-500)",
                color: "#fff",
              }
            : {
                background: "var(--surface-card)",
                borderColor: "var(--border-default)",
                color: "var(--ow-oranje-500)",
              }
        }
        title="Versiegeschiedenis"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          Versies
        </span>
      </button>
    </div>
  );
}
