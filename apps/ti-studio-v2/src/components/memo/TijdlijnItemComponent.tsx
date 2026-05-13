"use client";

// apps/ti-studio-v2/src/components/memo/TijdlijnItemComponent.tsx

import type { TijdlijnItem } from "./types";

interface TijdlijnItemProps {
  item: TijdlijnItem;
  isLaatste: boolean;
}

const ACTIE_LABELS: Record<string, string> = {
  AANGEMAAKT: "Aangemaakt",
  BEWERKT: "Bewerkt",
  STATUS_GEWIJZIGD: "Status gewijzigd",
  VERWIJDERD: "Verwijderd",
};

function formatTijdstip(d: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function TijdlijnItemComponent({ item, isLaatste }: TijdlijnItemProps) {
  return (
    <div className={["tl-item", isLaatste ? "laatste" : ""].filter(Boolean).join(" ")}>
      <div className="tl-lijn">
        <div
          className={["tl-dot", item.type === "log" ? "tl-dot-log" : ""].filter(Boolean).join(" ")}
        />
        {!isLaatste && <div className="tl-streep" />}
      </div>
      <div className="tl-content">
        <div className="tl-meta">
          <span className="tl-auteur">{item.auteurNaam}</span>
          <span className="tl-tijd">{formatTijdstip(item.timestamp)}</span>
        </div>
        {item.type === "toelichting" && item.tekst && <p className="tl-tekst">{item.tekst}</p>}
        {item.type === "log" && item.actie && (
          <p className="tl-log-actie">
            {ACTIE_LABELS[item.actie] ?? item.actie}
            {item.detail && <span className="tl-log-detail"> — {item.detail}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
