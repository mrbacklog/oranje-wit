"use client";

import { useParams } from "next/navigation";
import { Badge } from "@oranje-wit/ui";

const SCHAAL_PREVIEW: Record<string, { labels: string[]; type: string }> = {
  duim: { labels: ["\uD83D\uDC4E", "\uD83D\uDC4D"], type: "Duim (2 niveaus)" },
  smiley: { labels: ["\uD83D\uDE10", "\uD83D\uDE42", "\uD83D\uDE04"], type: "Smiley (3 niveaus)" },
  sterren: {
    labels: [
      "\u2B50",
      "\u2B50\u2B50",
      "\u2B50\u2B50\u2B50",
      "\u2B50\u2B50\u2B50\u2B50",
      "\u2B50\u2B50\u2B50\u2B50\u2B50",
    ],
    type: "Sterren (1-5)",
  },
  slider: { labels: ["1", "...", "99"], type: "Slider (1-99)" },
};

export default function PreviewPage() {
  const params = useParams<{ versieId: string; band: string }>();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Preview: {params.band}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Zo ziet het scoutingformulier eruit voor de scout
        </p>
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <Badge color="blue">Preview modus</Badge>
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Dit is een voorbeeld. Scores worden niet opgeslagen.
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Preview wordt uitgewerkt met hergebruik van de scouting score-componenten (SmileyScore,
            SterrenScore, SliderScore).
          </p>
          <div className="mt-4 space-y-2">
            {Object.entries(SCHAAL_PREVIEW).map(([type, info]) => (
              <div
                key={type}
                className="flex items-center gap-3 rounded-lg p-3"
                style={{
                  border: "1px solid var(--border-light)",
                  backgroundColor: "var(--surface-sunken)",
                }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {info.type}:
                </span>
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {info.labels.join(" \u2192 ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
