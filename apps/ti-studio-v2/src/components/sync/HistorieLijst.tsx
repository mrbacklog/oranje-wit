"use client";

import { useEffect, useState } from "react";
import type { SportlinkNotificatieRij } from "./types";

interface HistorieLijstProps {
  notificaties: SportlinkNotificatieRij[];
  limit?: number;
}

function ActieBadge({ actie }: { actie: string }) {
  const kleur =
    actie === "insert"
      ? "#60a5fa"
      : actie === "update"
        ? "#fbbf24"
        : actie === "delete"
          ? "#ef4444"
          : "var(--text-tertiary)";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "1px 6px",
        borderRadius: 4,
        background: `${kleur}18`,
        color: kleur,
        letterSpacing: "0.04em",
        flexShrink: 0,
        textTransform: "uppercase",
      }}
    >
      {actie}
    </span>
  );
}

export function HistorieLijst({ notificaties, limit = 50 }: HistorieLijstProps) {
  const [gemount, setGemount] = useState(false);

  useEffect(() => {
    setGemount(true);
  }, []);

  const zichtbaar = notificaties.slice(0, limit);

  if (zichtbaar.length === 0) {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        Geen notificaties beschikbaar
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {zichtbaar.map((rij) => (
        <div
          key={rij.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "10px 20px",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <ActieBadge actie={rij.actie} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-primary)",
                fontWeight: 500,
                marginBottom: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {rij.beschrijving}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              {rij.entiteit} · {rij.relCode}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {gemount
              ? new Date(rij.datum).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
