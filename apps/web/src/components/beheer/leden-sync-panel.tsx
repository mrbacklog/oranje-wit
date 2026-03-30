"use client";

import { useState } from "react";
import { CsvUpload } from "./csv-upload";
import { previewLedenSync, verwerkLedenSyncAction } from "@/app/(beheer)/beheer/teams/sync/actions";
import type { LedenDiffResult } from "@/lib/beheer/leden-sync";
import { Badge } from "@oranje-wit/ui";

type Status = "idle" | "previewing" | "preview" | "verwerking" | "klaar";

interface PreviewData extends LedenDiffResult {
  herkend: string[];
  genegeerd: string[];
}

export function LedenSyncPanel() {
  const [status, setStatus] = useState<Status>("idle");
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [bestandsnaam, setBestandsnaam] = useState<string>("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [resultaat, setResultaat] = useState<{
    aangemaakt: number;
    bijgewerkt: number;
    afgemeldGemarkeerd: number;
    signaleringen: string[];
  } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  async function handleUpload(content: string, naam: string) {
    setCsvContent(content);
    setBestandsnaam(naam);
    setFout(null);
    setStatus("previewing");

    const result = await previewLedenSync(content);
    if (!result.ok) {
      setFout(result.error);
      setStatus("idle");
      return;
    }
    setPreview(result.data);
    setStatus("preview");
  }

  async function handleVerwerk() {
    if (!csvContent) return;
    setStatus("verwerking");

    const result = await verwerkLedenSyncAction(csvContent);
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
    setPreview(null);
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
      {status === "previewing" && <CsvUpload onUpload={handleUpload} bezig />}

      {/* Preview */}
      {status === "preview" && preview && (
        <div className="space-y-4">
          {/* Bestandsinfo */}
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
                  {preview.totaalCsv} leden in CSV, {preview.totaalDb} in database
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

          {/* Kolommen */}
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
              Kolommen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {preview.herkend.map((k) => (
                <Badge key={k} color="green">
                  {k}
                </Badge>
              ))}
              {preview.genegeerd.map((k) => (
                <Badge key={k} color="gray">
                  {k}
                </Badge>
              ))}
            </div>
          </div>

          {/* Diff samenvatting */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DiffStat label="Nieuw" count={preview.nieuw.length} kleur="green" />
            <DiffStat label="Gewijzigd" count={preview.gewijzigd.length} kleur="orange" />
            <DiffStat label="Afgemeld" count={preview.afgemeld.length} kleur="red" />
            <DiffStat label="Verdwenen" count={preview.verdwenen.length} kleur="gray" />
          </div>

          {/* Diff details */}
          {preview.nieuw.length > 0 && (
            <DiffSection titel="Nieuw" kleur="green">
              {preview.nieuw.map((l) => (
                <DiffRij key={l.relCode}>
                  <span>{l.naam}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {l.geslacht}, {l.geboortejaar ?? "?"}
                  </span>
                </DiffRij>
              ))}
            </DiffSection>
          )}

          {preview.gewijzigd.length > 0 && (
            <DiffSection titel="Gewijzigd" kleur="orange">
              {preview.gewijzigd.map((l) => (
                <DiffRij key={l.relCode}>
                  <span>{l.naam}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {l.wijzigingen
                      .map((w) => `${w.veld}: ${w.oud ?? "–"} → ${w.nieuw ?? "–"}`)
                      .join(", ")}
                  </span>
                </DiffRij>
              ))}
            </DiffSection>
          )}

          {preview.afgemeld.length > 0 && (
            <DiffSection titel="Afgemeld" kleur="red">
              {preview.afgemeld.map((l) => (
                <DiffRij key={l.relCode}>
                  <span>{l.naam}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    per {l.afmelddatum}
                  </span>
                </DiffRij>
              ))}
            </DiffSection>
          )}

          {preview.verdwenen.length > 0 && (
            <DiffSection titel="Verdwenen uit CSV" kleur="gray">
              {preview.verdwenen.map((l) => (
                <DiffRij key={l.relCode}>
                  <span>{l.naam}</span>
                </DiffRij>
              ))}
            </DiffSection>
          )}

          {/* Ongewijzigd */}
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {preview.ongewijzigd} leden ongewijzigd
          </p>

          {/* Actieknoppen */}
          <div className="flex gap-3">
            <button
              onClick={handleVerwerk}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--ow-oranje-500)" }}
            >
              Verwerken
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border px-4 py-2 text-sm"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              Annuleren
            </button>
          </div>
        </div>
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
            Bezig met synchroniseren...
          </p>
        </div>
      )}

      {/* Resultaat */}
      {status === "klaar" && resultaat && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card">
              <div className="stat-value">{resultaat.aangemaakt}</div>
              <div className="stat-label">Aangemaakt</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultaat.bijgewerkt}</div>
              <div className="stat-label">Bijgewerkt</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultaat.afgemeldGemarkeerd}</div>
              <div className="stat-label">Afgemeld</div>
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

// -- Subcomponenten ----------------------------------------------------------

function DiffStat({ label, count, kleur }: { label: string; count: number; kleur: string }) {
  const kleuren: Record<string, string> = {
    green: "var(--color-success-500)",
    orange: "var(--color-warning-500)",
    red: "var(--color-error-500)",
    gray: "var(--text-tertiary)",
  };

  return (
    <div className="stat-card">
      <div
        className="stat-value"
        style={{ color: count > 0 ? kleuren[kleur] : "var(--text-tertiary)" }}
      >
        {count}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DiffSection({
  titel,
  kleur,
  children,
}: {
  titel: string;
  kleur: string;
  children: React.ReactNode;
}) {
  const kleuren: Record<string, string> = {
    green: "var(--color-success-500)",
    orange: "var(--color-warning-500)",
    red: "var(--color-error-500)",
    gray: "var(--text-tertiary)",
  };

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-default)",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-2.5"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: kleuren[kleur] }}
        />
        <span
          className="text-xs font-medium tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          {titel}
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
        {children}
      </div>
    </div>
  );
}

function DiffRij({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-2 text-sm"
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </div>
  );
}
