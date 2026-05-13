"use client";

import type { VersieMeta } from "./werkbord-types";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

interface VersiesDrawerProps {
  versies: VersieMeta[];
  actieveVersieId: string;
  open: boolean;
  onVersieSelect: (versieId: string) => void;
}

export function VersiesDrawer({
  versies,
  actieveVersieId,
  open,
  onVersieSelect,
}: VersiesDrawerProps) {
  return (
    <div
      className={cx("wb-drawer", "rechts", open && "open")}
      style={{ "--drawer-width": "280px" } as React.CSSProperties}
    >
      <div className="wb-drawer-header">
        <span className="wb-drawer-title">Versies</span>
      </div>

      <div className="wb-drawer-list ow-scroll">
        {versies.map((v) => {
          const isActief = v.id === actieveVersieId;
          return (
            <div
              key={v.id}
              className={cx("wb-team-rij", isActief && "active")}
              style={
                {
                  "--team-kleur": isActief ? "var(--ow-accent)" : "var(--border-default)",
                  opacity: isActief ? 1 : 0.6,
                } as React.CSSProperties
              }
              onClick={() => onVersieSelect(v.id)}
            >
              <span className="t-naam">
                v{v.nummer}
                {v.naam ? ` — ${v.naam}` : ""}
              </span>
              {isActief ? (
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: "rgba(34,197,94,.1)",
                    color: "#4ade80",
                    fontWeight: 700,
                    border: "1px solid rgba(34,197,94,.3)",
                  }}
                >
                  Actief
                </span>
              ) : (
                <span className="t-count">
                  {new Date(v.createdAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
