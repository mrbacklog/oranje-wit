"use client";

import { useState, useCallback } from "react";
import { updateTwijfelpunten } from "@/app/blauwdruk/actions";

interface Twijfelpunt {
  id: string;
  vraag: string;
  opties: string[];
}

interface TwijfelpuntenEditorProps {
  blauwdrukId: string;
  initieel: Twijfelpunt[];
}

export default function TwijfelpuntenEditor({
  blauwdrukId,
  initieel,
}: TwijfelpuntenEditorProps) {
  const [twijfelpunten, setTwijfelpunten] =
    useState<Twijfelpunt[]>(initieel);
  const [opslaan, setOpslaan] = useState(false);

  const slaOp = useCallback(
    async (nieuweLijst: Twijfelpunt[]) => {
      setOpslaan(true);
      try {
        await updateTwijfelpunten(blauwdrukId, nieuweLijst);
      } finally {
        setOpslaan(false);
      }
    },
    [blauwdrukId]
  );

  const voegTwijfelpuntToe = useCallback(() => {
    const nieuw: Twijfelpunt = {
      id: crypto.randomUUID(),
      vraag: "",
      opties: [],
    };
    setTwijfelpunten((prev) => [...prev, nieuw]);
  }, []);

  const updateVraag = useCallback(
    async (id: string, vraag: string) => {
      const nieuw = twijfelpunten.map((tp) =>
        tp.id === id ? { ...tp, vraag } : tp
      );
      setTwijfelpunten(nieuw);
      await slaOp(nieuw);
    },
    [twijfelpunten, slaOp]
  );

  const verwijderTwijfelpunt = useCallback(
    async (id: string) => {
      const nieuw = twijfelpunten.filter((tp) => tp.id !== id);
      setTwijfelpunten(nieuw);
      await slaOp(nieuw);
    },
    [twijfelpunten, slaOp]
  );

  const voegOptieToe = useCallback(
    async (twijfelpuntId: string, optie: string) => {
      const trimmed = optie.trim();
      if (!trimmed) return;
      const nieuw = twijfelpunten.map((tp) =>
        tp.id === twijfelpuntId
          ? { ...tp, opties: [...tp.opties, trimmed] }
          : tp
      );
      setTwijfelpunten(nieuw);
      await slaOp(nieuw);
    },
    [twijfelpunten, slaOp]
  );

  const verwijderOptie = useCallback(
    async (twijfelpuntId: string, optieIndex: number) => {
      const nieuw = twijfelpunten.map((tp) =>
        tp.id === twijfelpuntId
          ? { ...tp, opties: tp.opties.filter((_, i) => i !== optieIndex) }
          : tp
      );
      setTwijfelpunten(nieuw);
      await slaOp(nieuw);
    },
    [twijfelpunten, slaOp]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {twijfelpunten.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-3">
          Nog geen twijfelpunten. Voeg er een toe om te beginnen.
        </p>
      ) : (
        <ul className="space-y-4 mb-3">
          {twijfelpunten.map((tp) => (
            <TwijfelpuntItem
              key={tp.id}
              twijfelpunt={tp}
              onUpdateVraag={updateVraag}
              onVerwijder={verwijderTwijfelpunt}
              onVoegOptieToe={voegOptieToe}
              onVerwijderOptie={verwijderOptie}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={voegTwijfelpuntToe}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          + Nieuw twijfelpunt
        </button>
        {opslaan && (
          <span className="text-xs text-gray-400">Opslaan...</span>
        )}
      </div>
    </div>
  );
}

// --- Sub-component per twijfelpunt ---

interface TwijfelpuntItemProps {
  twijfelpunt: Twijfelpunt;
  onUpdateVraag: (id: string, vraag: string) => Promise<void>;
  onVerwijder: (id: string) => Promise<void>;
  onVoegOptieToe: (id: string, optie: string) => Promise<void>;
  onVerwijderOptie: (id: string, optieIndex: number) => Promise<void>;
}

function TwijfelpuntItem({
  twijfelpunt,
  onUpdateVraag,
  onVerwijder,
  onVoegOptieToe,
  onVerwijderOptie,
}: TwijfelpuntItemProps) {
  const [bewerkVraag, setBewerkVraag] = useState(false);
  const [vraagTekst, setVraagTekst] = useState(twijfelpunt.vraag);
  const [nieuweOptie, setNieuweOptie] = useState("");

  const bevestigVraag = useCallback(async () => {
    setBewerkVraag(false);
    if (vraagTekst.trim() !== twijfelpunt.vraag) {
      await onUpdateVraag(twijfelpunt.id, vraagTekst.trim());
    }
  }, [vraagTekst, twijfelpunt, onUpdateVraag]);

  const handleOptieToevoegen = useCallback(async () => {
    if (!nieuweOptie.trim()) return;
    await onVoegOptieToe(twijfelpunt.id, nieuweOptie);
    setNieuweOptie("");
  }, [nieuweOptie, twijfelpunt.id, onVoegOptieToe]);

  return (
    <li className="border border-gray-100 rounded-lg p-3 bg-gray-50">
      {/* Vraag */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-orange-500 mt-0.5 shrink-0">&#10067;</span>
        {bewerkVraag || !twijfelpunt.vraag ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={vraagTekst}
              onChange={(e) => setVraagTekst(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") bevestigVraag();
                if (e.key === "Escape") {
                  setVraagTekst(twijfelpunt.vraag);
                  setBewerkVraag(false);
                }
              }}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              autoFocus
              placeholder="Typ een vraag, bijv. 'Hoeveel U15-teams?'"
            />
            <button
              onClick={bevestigVraag}
              className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-start justify-between group">
            <span
              className="text-sm font-medium text-gray-800 cursor-pointer hover:text-orange-700"
              onClick={() => setBewerkVraag(true)}
            >
              {twijfelpunt.vraag}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setBewerkVraag(true)}
                className="text-xs text-gray-400 hover:text-gray-600"
                title="Bewerken"
              >
                &#9998;
              </button>
              <button
                onClick={() => onVerwijder(twijfelpunt.id)}
                className="text-xs text-gray-400 hover:text-red-500"
                title="Verwijderen"
              >
                &#10005;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Opties als chips */}
      <div className="ml-6 flex flex-wrap gap-2 items-center">
        {twijfelpunt.opties.map((optie, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700"
          >
            {optie}
            <button
              onClick={() => onVerwijderOptie(twijfelpunt.id, index)}
              className="text-gray-400 hover:text-red-500 text-xs ml-0.5"
              title="Optie verwijderen"
            >
              &#10005;
            </button>
          </span>
        ))}

        {/* Nieuwe optie invoer */}
        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={nieuweOptie}
            onChange={(e) => setNieuweOptie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOptieToevoegen();
            }}
            className="border border-dashed border-gray-300 rounded-full px-3 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-orange-300 focus:border-orange-400"
            placeholder="+ optie"
          />
          {nieuweOptie.trim() && (
            <button
              onClick={handleOptieToevoegen}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              Toevoegen
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
