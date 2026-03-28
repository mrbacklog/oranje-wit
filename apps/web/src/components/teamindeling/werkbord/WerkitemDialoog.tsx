"use client";

import { useState, useTransition } from "react";
import { createWerkitem } from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import type { WerkitemType, WerkitemPrioriteit, Besluitniveau, Doelgroep, Entiteit } from "./types";

interface WerkitemDialoogProps {
  blauwdrukId: string;
  scenarioId?: string;
  spelerId?: string;
  stafId?: string;
  teamOwCode?: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function WerkitemDialoog({
  blauwdrukId,
  scenarioId,
  spelerId,
  stafId,
  teamOwCode,
  onClose,
  onCreated,
}: WerkitemDialoogProps) {
  const [isPending, startTransition] = useTransition();
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [type, setType] = useState<WerkitemType>("STRATEGISCH");
  const [prioriteit, setPrioriteit] = useState<WerkitemPrioriteit>("MIDDEL");
  const [besluitniveau, setBesluitniveau] = useState<Besluitniveau | "">("");
  const [doelgroep, setDoelgroep] = useState<Doelgroep | "">("");
  const [entiteit, setEntiteit] = useState<Entiteit | "">(
    spelerId ? "SPELER" : stafId ? "STAF" : teamOwCode ? "TEAM" : ""
  );
  const [resolutie, setResolutie] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim()) return;

    startTransition(async () => {
      await createWerkitem({
        blauwdrukId,
        titel: titel.trim(),
        beschrijving: beschrijving.trim(),
        type,
        prioriteit,
        besluitniveau: besluitniveau || undefined,
        doelgroep: doelgroep || undefined,
        entiteit: entiteit || undefined,
        scenarioId,
        spelerId,
        stafId,
        teamOwCode,
        resolutie: type === "BESLUIT" && resolutie.trim() ? resolutie.trim() : undefined,
      });
      onCreated();
      onClose();
    });
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <form
        className="dialog-panel w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-semibold text-gray-900">Nieuw werkitem</h2>
        </div>

        <div className="dialog-body space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Titel</label>
            <input
              className="input"
              value={titel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitel(e.target.value)}
              placeholder="Korte omschrijving..."
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Beschrijving</label>
            <textarea
              className="input"
              rows={2}
              value={beschrijving}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBeschrijving(e.target.value)
              }
              placeholder="Toelichting, context..."
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
              <select
                className="input"
                value={type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setType(e.target.value as WerkitemType)
                }
              >
                <option value="BESLUIT">Besluit</option>
                <option value="STRATEGISCH">Strategisch</option>
                <option value="DATA">Data</option>
                <option value="REGEL">Regel</option>
                <option value="TRAINER">Trainer</option>
                <option value="SPELER">Speler</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">Prioriteit</label>
              <select
                className="input"
                value={prioriteit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPrioriteit(e.target.value as WerkitemPrioriteit)
                }
              >
                <option value="BLOCKER">Blocker</option>
                <option value="HOOG">Hoog</option>
                <option value="MIDDEL">Middel</option>
                <option value="LAAG">Laag</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>

          {/* Organisatorische dimensies */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">Besluitniveau</label>
              <select
                className="input"
                value={besluitniveau}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setBesluitniveau(e.target.value as Besluitniveau | "");
                  if (e.target.value !== "DOELGROEP" && e.target.value !== "TC") {
                    setDoelgroep("");
                  }
                }}
              >
                <option value="">—</option>
                <option value="BESTUUR">Bestuur</option>
                <option value="TC">TC</option>
                <option value="DOELGROEP">Doelgroep</option>
              </select>
            </div>

            {(besluitniveau === "DOELGROEP" || besluitniveau === "TC") && (
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-700">Doelgroep</label>
                <select
                  className="input"
                  value={doelgroep}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDoelgroep(e.target.value as Doelgroep | "")
                  }
                >
                  <option value="">—</option>
                  <option value="KWEEKVIJVER">Kweekvijver</option>
                  <option value="ONTWIKKELHART">Ontwikkelhart</option>
                  <option value="TOP">Top</option>
                  <option value="WEDSTRIJDSPORT">Wedstrijdsport</option>
                  <option value="KORFBALPLEZIER">Korfbalplezier</option>
                  <option value="ALLE">Alle</option>
                </select>
              </div>
            )}

            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">Entiteit</label>
              <select
                className="input"
                value={entiteit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setEntiteit(e.target.value as Entiteit | "")
                }
              >
                <option value="">—</option>
                <option value="BELEID">Beleid</option>
                <option value="SELECTIE">Selectie</option>
                <option value="TEAM">Team</option>
                <option value="STAF">Staf</option>
                <option value="SPELER">Speler</option>
              </select>
            </div>
          </div>

          {/* Resolutie-veld bij type BESLUIT */}
          {type === "BESLUIT" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Besluit (resolutie)
              </label>
              <textarea
                className="input"
                rows={2}
                value={resolutie}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setResolutie(e.target.value)
                }
                placeholder="Wat is er besloten?"
              />
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isPending}>
            Annuleer
          </button>
          <button type="submit" className="btn-primary" disabled={isPending || !titel.trim()}>
            {isPending ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
}
