import type { MouseEvent } from "react";
import type { WerkitemStatus } from "@oranje-wit/database";

export type MemoGrootte = "compact" | "normaal" | "rijk" | "hero" | "hover";

const GROOTTE_PX: Record<MemoGrootte, number> = {
  compact: 13,
  normaal: 18,
  rijk: 22,
  hero: 36,
  hover: 28,
};

const STATUS_KLEUR: Record<Exclude<WerkitemStatus, "GEARCHIVEERD">, string> = {
  OPEN: "#fde047",
  IN_BESPREKING: "#facc15",
  GEACCEPTEERD_RISICO: "#a16207",
  OPGELOST: "#44403c",
};

interface MemoCornerProps {
  status: WerkitemStatus | "geen";
  size?: MemoGrootte;
  onClick?: (e: MouseEvent) => void;
}

export function MemoCorner({ status, size = "normaal", onClick }: MemoCornerProps) {
  if (status === "geen" || status === "GEARCHIVEERD") return null;

  const kleur = STATUS_KLEUR[status as Exclude<WerkitemStatus, "GEARCHIVEERD">];
  if (!kleur) return null;

  const px = GROOTTE_PX[size];

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: px,
        height: px,
        clipPath: "polygon(0 0, 100% 0, 0 100%)",
        background: kleur,
        borderTopLeftRadius: "inherit",
        zIndex: 10,
        pointerEvents: onClick ? "auto" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
      aria-hidden={!onClick}
    />
  );
}
