"use client";

/**
 * Tier-effecten en decoratieve sub-componenten voor de SpelersKaart.
 *
 * Bevat: TierLabel, SilverSheen, GoldShimmer, ShieldFoto, Sterren, StatBar
 */

// ================================================================
// TierLabel
// ================================================================

export function TierLabel({ tier }: { tier: string }) {
  const bgColors: Record<string, string> = {
    brons: "var(--tier-brons-icon)",
    zilver: "var(--tier-zilver-icon)",
    goud: "var(--tier-goud-icon)",
  };
  const textColors: Record<string, string> = {
    brons: "var(--tier-brons-bg)",
    zilver: "var(--tier-zilver-text)",
    goud: "var(--tier-goud-text)",
  };

  return (
    <span
      className="absolute top-2 left-2 z-[5] rounded px-1.5 py-0.5 text-[8px] font-extrabold tracking-[1px] uppercase"
      style={{
        background: bgColors[tier],
        color: textColors[tier],
      }}
    >
      {tier}
    </span>
  );
}

// ================================================================
// Tier sheen/shimmer
// ================================================================

export function SilverSheen() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
      style={{ backfaceVisibility: "hidden" }}
    >
      <div
        className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%]"
        style={{
          background:
            "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 70%)",
          animation: "sheen 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export function GoldShimmer() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
      style={{ backfaceVisibility: "hidden" }}
    >
      <div
        className="absolute -top-full -left-full h-[300%] w-[300%]"
        style={{
          background:
            "linear-gradient(45deg, transparent 25%, rgba(255,215,0,0.06) 35%, rgba(255,215,0,0.15) 40%, rgba(255,255,255,0.2) 45%, rgba(255,215,0,0.15) 50%, rgba(255,215,0,0.06) 55%, transparent 65%)",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ================================================================
// ShieldFoto
// ================================================================

export function ShieldFoto({
  fotoUrl,
  roepnaam,
  achternaam,
  fotoSize,
}: {
  fotoUrl?: string;
  roepnaam: string;
  achternaam: string;
  fotoSize: number;
}) {
  const initialen = `${roepnaam.charAt(0)}${achternaam.charAt(0)}`.toUpperCase();
  const clipPath =
    "polygon(50% 0%, 100% 12%, 100% 65%, 75% 85%, 50% 100%, 25% 85%, 0% 65%, 0% 12%)";

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: fotoSize,
        height: fotoSize,
        clipPath,
        background: "rgba(255,255,255,0.12)",
      }}
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span
          className="font-extrabold text-white/60 uppercase"
          style={{ fontSize: fotoSize * 0.3 }}
        >
          {initialen}
        </span>
      )}
    </div>
  );
}

// ================================================================
// Sterren
// ================================================================

export function Sterren({
  count,
  max = 5,
  size = 12,
}: {
  count: number;
  max?: number;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} van ${max} sterren`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width={size}
          height={size}
          fill={i < count ? "var(--knkv-geel-500)" : "none"}
          stroke={
            i < count
              ? "var(--knkv-geel-500)"
              : "color-mix(in srgb, var(--text-primary) 30%, transparent)"
          }
          strokeWidth={1.5}
          className={i < count ? "drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" : ""}
        >
          <path d="M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.5L10 14.27l-4.94 2.4.94-5.5-4-3.9 5.53-.76L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

// ================================================================
// StatBar
// ================================================================

export function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-1">
      <span className="min-w-[22px] text-[9px] font-bold text-white/50">{label}</span>
      <span className="min-w-[18px] text-right text-[11px] font-bold text-white">{value}</span>
      <div className="bg-surface-card/10 h-[3px] flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 80
                ? "var(--knkv-groen-400)"
                : pct >= 60
                  ? "var(--knkv-geel-400)"
                  : pct >= 40
                    ? "var(--knkv-oranje-400)"
                    : "var(--knkv-rood-400)",
          }}
        />
      </div>
    </div>
  );
}
