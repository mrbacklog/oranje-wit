"use client";

import { useState } from "react";
import { CsvUpload } from "./csv-upload";
import {
  previewTeamsSnapshot,
  verwerkTeamsSnapshotAction,
} from "@/app/(beheer)/beheer/teams/sync/actions";
import type { CompetitieType } from "@/lib/beheer/teams-snapshot";
import { TeamsSnapshotPreview, type SnapshotPreviewData } from "./teams-snapshot-preview";

type Status = "idle" | "config" | "previewing" | "preview" | "verwerking" | "klaar";

const COMPETITIE_OPTIES: { value: CompetitieType; label: string }[] = [
  { value: "veld_najaar", label: "Veld najaar" },
  { value: "zaal_8", label: "Zaal (8-tallen)" },
  { value: "zaal_4", label: "Zaal (4-tallen)" },
  { value: "veld_voorjaar", label: "Veld voorjaar" },
];

interface Props {
  seizoenOpties: string[];
  huidigSeizoen: string;
}

export function TeamsSnapshotPanel({ seizoenOpties, huidigSeizoen }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [bestandsnaam, setBestandsnaam] = useState<string>("");
  const [seizoen, setSeizoen] = useState<string>(huidigSeizoen);
  const [competitie, setCompetitie] = useState<CompetitieType>("veld_najaar");
  const [fout, setFout] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<SnapshotPreviewData | null>(null);

  const [resultaat, setResultaat] = useState<{
    opgeslagen: number;
    stafOpgeslagen: number;
    signaleringen: string[];
  } | null>(null);

  function handleUpload(content: string, naam: string) {
    setCsvContent(content);
    setBestandsnaam(naam);
    setFout(null);
    setStatus("config");
  }

  async function handlePreview() {
    if (!csvContent) return;
    setStatus("previewing");

    const result = await previewTeamsSnapshot(csvContent, seizoen, competitie);
    if (!result.ok) {
      setFout(result.error);
      setStatus("config");
      return;
    }
    setPreviewData({
      ...result.data.preview,
      diff: result.data.diff,
    });
    setStatus("preview");
  }

  async function handleVerwerk() {
    if (!csvContent) return;
    setStatus("verwerking");

    const result = await verwerkTeamsSnapshotAction(csvContent, seizoen, competitie);
    if (!result.ok) {
      setFout(result.error);
      setStatus("preview");
      return;
    }
    setResultaat(result.data);
    setStatus("klaar");
  }

  function handleReset() {
    setStatus("idle");
    setCsvContent(null);
    setPreviewData(null);
    setResultaat(null);
    setFout(null);
  }

  return (
    <div className="space-y-4">
      {/* Foutmelding */}
      {fout && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error-500) 10%, var(--surface-card))",
            borderColor: "var(--color-error-500)",
            color: "var(--color-error-500)",
          }}
        >
          {fout}
        </div>
      )}

      {/* Upload */}
      {status === "idle" && <CsvUpload onUpload={handleUpload} />}

      {/* Seizoen/competitie selectie */}
      {status === "config" && (
        <div className="space-y-4">
          <div
            className="rounded-xl border px-5 py-3"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {bestandsnaam}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Teams CSV gedetecteerd
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Opnieuw
              </button>
            </div>
          </div>

          <div
            className="rounded-xl border px-5 py-4"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Kies seizoen en competitieperiode
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Seizoen
                </label>
                <select
                  value={seizoen}
                  onChange={(e) => setSeizoen(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--surface-sunken)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  {seizoenOpties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Competitieperiode
                </label>
                <select
                  value={competitie}
                  onChange={(e) => setCompetitie(e.target.value as CompetitieType)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--surface-sunken)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  {COMPETITIE_OPTIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handlePreview}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--ow-oranje-500)" }}
            >
              Preview laden
            </button>
          </div>
        </div>
      )}

      {/* Previewing */}
      {status === "previewing" && (
        <div
          className="rounded-xl border px-5 py-8 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Preview laden...
          </p>
        </div>
      )}

      {/* Preview */}
      {status === "preview" && previewData && (
        <TeamsSnapshotPreview data={previewData} onVerwerk={handleVerwerk} onReset={handleReset} />
      )}

      {/* Verwerking bezig */}
      {status === "verwerking" && (
        <div
          className="rounded-xl border px-5 py-8 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Snapshot opslaan...
          </p>
        </div>
      )}

      {/* Resultaat */}
      {status === "klaar" && resultaat && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="stat-value">{resultaat.opgeslagen}</div>
              <div className="stat-label">Records opgeslagen</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultaat.stafOpgeslagen}</div>
              <div className="stat-label">Staf herkend</div>
            </div>
          </div>

          {resultaat.signaleringen.length > 0 && (
            <div
              className="rounded-xl border px-5 py-3"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <p
                className="mb-2 text-xs font-medium tracking-wider uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                Signaleringen
              </p>
              <ul className="space-y-1">
                {resultaat.signaleringen.map((s, i) => (
                  <li key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleReset}
            className="rounded-lg border px-4 py-2 text-sm"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Nieuwe import
          </button>
        </div>
      )}
    </div>
  );
}
