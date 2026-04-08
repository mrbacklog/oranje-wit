"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";
import type { LedenDiff } from "@/lib/teamindeling/leden-diff";
import type { LidCsvRij } from "@/lib/teamindeling/leden-csv";
import LedenSyncPreview from "./LedenSyncPreview";

type Fase = "upload" | "preview" | "verwerken" | "resultaat";

interface LedenSyncDialoogProps {
  open: boolean;
  onClose: () => void;
  kadersId: string;
}

interface VerwerkResultaat {
  ledenBijgewerkt: number;
  spelersAangemaakt: number;
  spelersGemarkeerd: number;
}

export default function LedenSyncDialoog({ open, onClose, kadersId }: LedenSyncDialoogProps) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("upload");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [diff, setDiff] = useState<LedenDiff | null>(null);
  const [resultaat, setResultaat] = useState<VerwerkResultaat | null>(null);
  const [geselecteerdNieuw, setGeselecteerdNieuw] = useState<Set<string>>(new Set());
  const [geselecteerdVertrokken, setGeselecteerdVertrokken] = useState<Set<string>>(new Set());
  const [sectieOpen, setSectieOpen] = useState({ nieuw: true, vertrokken: true, gewijzigd: false });

  const reset = useCallback(() => {
    setFase("upload");
    setBezig(false);
    setFout(null);
    setCsvFile(null);
    setDiff(null);
    setResultaat(null);
    setGeselecteerdNieuw(new Set());
    setGeselecteerdVertrokken(new Set());
    setSectieOpen({ nieuw: true, vertrokken: true, gewijzigd: false });
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSluitEnVervers = useCallback(() => {
    reset();
    onClose();
    router.refresh();
  }, [reset, onClose, router]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setFout(null);
    setBezig(true);
    setFase("preview");
    try {
      const formData = new FormData();
      formData.append("csv", file);
      const res = await fetch("/api/teamindeling/leden-sync/preview", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setFout(json.error?.message ?? "Onbekende fout bij preview");
        setFase("upload");
        return;
      }
      const d = json.data as LedenDiff;
      setDiff(d);
      setGeselecteerdNieuw(new Set(d.nieuweLeden.map((l: LidCsvRij) => l.relCode)));
      setGeselecteerdVertrokken(new Set(d.vertrokkenSpelers.map((s) => s.id)));
    } catch (error) {
      logger.warn("Leden sync preview mislukt:", error);
      setFout("Fout bij verbinding met server");
      setFase("upload");
    } finally {
      setBezig(false);
    }
  }, []);

  const handleVerwerk = useCallback(async () => {
    if (!csvFile || !diff) return;
    setBezig(true);
    setFout(null);
    setFase("verwerken");
    try {
      const formData = new FormData();
      formData.append("csv", csvFile);
      formData.append(
        "selectie",
        JSON.stringify({
          nieuweLeden: Array.from(geselecteerdNieuw),
          vertrokkenSpelers: Array.from(geselecteerdVertrokken),
          kadersId,
        })
      );
      const res = await fetch("/api/teamindeling/leden-sync/verwerk", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setFout(json.error?.message ?? "Onbekende fout bij verwerking");
        setFase("preview");
        return;
      }
      setResultaat(json.data as VerwerkResultaat);
      setFase("resultaat");
    } catch (error) {
      logger.warn("Leden sync verwerking mislukt:", error);
      setFout("Fout bij verbinding met server");
      setFase("preview");
    } finally {
      setBezig(false);
    }
  }, [csvFile, diff, geselecteerdNieuw, geselecteerdVertrokken, kadersId]);

  const toggleNieuw = (relCode: string) => {
    setGeselecteerdNieuw((prev) => {
      const next = new Set(prev);
      if (next.has(relCode)) next.delete(relCode);
      else next.add(relCode);
      return next;
    });
  };

  const toggleVertrokken = (id: string) => {
    setGeselecteerdVertrokken((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSectie = (key: "nieuw" | "vertrokken" | "gewijzigd") => {
    setSectieOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!open) return null;

  const aantalGeselecteerd = geselecteerdNieuw.size + geselecteerdVertrokken.size;
  const FASE_TEKST: Record<Fase, string> = {
    upload: "Upload een Sportlink CSV om mutaties te detecteren",
    preview: bezig ? "CSV analyseren..." : "Controleer de gevonden wijzigingen",
    verwerken: "Wijzigingen verwerken...",
    resultaat: "Synchronisatie afgerond",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Leden synchroniseren</h3>
            <p className="mt-0.5 text-sm text-gray-500">{FASE_TEKST[fase]}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {fout && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {fout}
            </div>
          )}

          {fase === "upload" && <UploadFase onFileChange={handleFileChange} />}

          {(fase === "preview" || fase === "verwerken") && bezig && (
            <Spinner tekst={FASE_TEKST[fase]} />
          )}

          {fase === "preview" && !bezig && diff && (
            <LedenSyncPreview
              diff={diff}
              geselecteerdNieuw={geselecteerdNieuw}
              geselecteerdVertrokken={geselecteerdVertrokken}
              onToggleNieuw={toggleNieuw}
              onToggleVertrokken={toggleVertrokken}
              sectieOpen={sectieOpen}
              onToggleSectie={toggleSectie}
            />
          )}

          {fase === "resultaat" && resultaat && <ResultaatFase resultaat={resultaat} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          {(fase === "upload" || (fase === "preview" && !bezig)) && (
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
          )}
          {fase === "preview" && !bezig && (
            <button
              onClick={handleVerwerk}
              disabled={aantalGeselecteerd === 0 && (diff?.gewijzigdeLeden.length ?? 0) === 0}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
            >
              Verwerken{aantalGeselecteerd > 0 ? ` (${aantalGeselecteerd})` : ""}
            </button>
          )}
          {fase === "resultaat" && (
            <button
              onClick={handleSluitEnVervers}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Sluiten
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadFase({
  onFileChange,
}: {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="rounded-full bg-orange-50 p-4">
        <svg
          className="h-8 w-8 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600">
        Download &quot;alle leden.csv&quot; uit Sportlink en upload hier
      </p>
      <label className="cursor-pointer rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
        CSV selecteren
        <input type="file" accept=".csv" onChange={onFileChange} className="hidden" />
      </label>
    </div>
  );
}

function Spinner({ tekst }: { tekst: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-300 border-t-transparent" />
      <span className="text-sm text-gray-500">{tekst}</span>
    </div>
  );
}

function ResultaatFase({ resultaat }: { resultaat: VerwerkResultaat }) {
  return (
    <div className="space-y-3 py-4">
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-sm font-medium text-green-800">Synchronisatie geslaagd</p>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <p>
          <strong>{resultaat.ledenBijgewerkt}</strong> leden bijgewerkt in de database
        </p>
        {resultaat.spelersAangemaakt > 0 && (
          <p>
            <strong>{resultaat.spelersAangemaakt}</strong> nieuwe speler(s) aangemaakt
          </p>
        )}
        {resultaat.spelersGemarkeerd > 0 && (
          <p>
            <strong>{resultaat.spelersGemarkeerd}</strong> speler(s) als stoppend gemarkeerd
          </p>
        )}
      </div>
    </div>
  );
}
