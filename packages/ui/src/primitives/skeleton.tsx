"use client";

type SkeletonVariant = "text" | "card" | "circle" | "custom";

interface SkeletonProps {
  /** Vorm van de skeleton */
  variant?: SkeletonVariant;
  /** Breedte — voor text/card/custom. Circle gebruikt height. */
  width?: string | number;
  /** Hoogte */
  height?: string | number;
  /** Aantal text-regels (alleen bij variant="text") */
  lines?: number;
  /** Extra CSS class */
  className?: string;
}

const VARIANT_DEFAULTS: Record<SkeletonVariant, { w: string; h: string; radius: string }> = {
  text: { w: "100%", h: "14px", radius: "6px" },
  card: { w: "100%", h: "120px", radius: "16px" },
  circle: { w: "40px", h: "40px", radius: "50%" },
  custom: { w: "100%", h: "40px", radius: "12px" },
};

/**
 * Skeleton — Premium loading placeholder met smooth gradient sweep.
 *
 * Features:
 * - Smooth gradient sweep animatie (niet standaard pulse)
 * - Gradient gaat van surface-card via surface-raised terug naar surface-card
 * - Varianten: text (regels), card (rechthoek), circle (avatar), custom
 * - Text variant ondersteunt meerdere regels met variabele breedte
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  lines = 1,
  className = "",
}: SkeletonProps) {
  const defaults = VARIANT_DEFAULTS[variant];

  if (variant === "text" && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`} role="status" aria-label="Laden...">
        {Array.from({ length: lines }, (_, i) => {
          // Laatste regel is korter voor een natuurlijk uiterlijk
          const isLast = i === lines - 1;
          const lineWidth = isLast ? "75%" : "100%";
          return (
            <div
              key={i}
              className="skeleton-shimmer"
              style={{
                width: width ?? lineWidth,
                height: height ?? defaults.h,
                borderRadius: defaults.radius,
                backgroundColor: "var(--surface-card)",
              }}
            />
          );
        })}
        <span className="sr-only">Laden...</span>
      </div>
    );
  }

  const resolvedWidth = width ?? (variant === "circle" ? (height ?? defaults.w) : defaults.w);
  const resolvedHeight = height ?? defaults.h;

  return (
    <div
      className={`skeleton-shimmer ${className}`}
      role="status"
      aria-label="Laden..."
      style={{
        width: typeof resolvedWidth === "number" ? `${resolvedWidth}px` : resolvedWidth,
        height: typeof resolvedHeight === "number" ? `${resolvedHeight}px` : resolvedHeight,
        borderRadius: defaults.radius,
        backgroundColor: "var(--surface-card)",
      }}
    >
      <span className="sr-only">Laden...</span>
    </div>
  );
}
