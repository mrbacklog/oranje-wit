"use client";

import { useState, useTransition } from "react";
import { createNotitie } from "@/app/notities/actions";
import type { NotitieCategorie, NotitiePrioriteit } from "@oranje-wit/database";

interface NotitieDialoogProps {
  blauwdrukId: string;
  scenarioId?: string;
  spelerId?: string;
  stafId?: string;
  teamOwCode?: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function NotitieDialoog({
  blauwdrukId,
  scenarioId,
  spelerId,
  stafId,
  teamOwCode,
  onClose,
  onCreated,
}: NotitieDialoogProps) {
  const [isPending, startTransition] = useTransition();
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [categorie, setCategorie] = useState<NotitieCategorie>("SPELER");
  const [prioriteit, setPrioriteit] = useState<NotitiePrioriteit>("MIDDEL");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim()) return;

    startTransition(async () => {
      await createNotitie({
        blauwdrukId,
        titel: titel.trim(),
        beschrijving: beschrijving.trim(),
        categorie,
        prioriteit,
        scenarioId,
        spelerId,
        stafId,
        teamOwCode,
      });
      onCreated();
      onClose();
    });
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <form
        className="dialog-panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-semibold text-gray-900">Nieuwe notitie</h2>
        </div>

        <div className="dialog-body">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Titel</label>
            <input
              className="input"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Korte omschrijving..."
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Beschrijving</label>
            <textarea
              className="input"
              rows={3}
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Toelichting, context..."
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">Categorie</label>
              <select
                className="input"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as NotitieCategorie)}
              >
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
                onChange={(e) => setPrioriteit(e.target.value as NotitiePrioriteit)}
              >
                <option value="BLOCKER">Blocker</option>
                <option value="HOOG">Hoog</option>
                <option value="MIDDEL">Middel</option>
                <option value="LAAG">Laag</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>
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
