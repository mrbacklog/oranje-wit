"use client";

import type { StafLid } from "./werkbord-types";

interface WbStafRijProps {
  staflid: StafLid;
  onClick: (stafId: string) => void;
}

export function WbStafRij({ staflid, onClick }: WbStafRijProps) {
  const initialen = staflid.naam
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="wb-staf-rij"
      onClick={() => onClick(staflid.stafId)}
      style={{ cursor: "pointer" }}
      title={staflid.naam}
    >
      {/* Avatar */}
      <div className="av">{initialen}</div>

      {/* Info */}
      <div className="info">
        <div className="nm">{staflid.naam}</div>
        <div className="rol">
          {staflid.rollen.slice(0, 2).map((r) => (
            <span
              key={r}
              style={{
                padding: "1px 5px",
                borderRadius: 3,
                background: "var(--staf-accent-dim)",
                color: "var(--staf-rol-text)",
                fontSize: 8,
                fontWeight: 700,
                border: "1px solid var(--staf-accent-border)",
              }}
            >
              {r}
            </span>
          ))}
          {staflid.ingedeeldTeamIds.length > 0 && (
            <span style={{ color: "#4ade80", fontSize: 8, fontWeight: 700 }}>
              ✓ {staflid.ingedeeldTeamIds.length}t
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
