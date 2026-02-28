"use client";

import { useState, useCallback } from "react";
import { updateKeuzes } from "@/app/blauwdruk/actions";
import type { Keuze } from "@/app/blauwdruk/actions";

interface KeuzeEditorProps {
  blauwdrukId: string;
  initieel: Keuze[];
}

export default function KeuzeEditor({ blauwdrukId, initieel }: KeuzeEditorProps) {
  const [keuzes, setKeuzes] = useState<Keuze[]>(initieel);
  const [opslaan, setOpslaan] = useState(false);

  const slaOp = useCallback(
    async (nieuweLijst: Keuze[]) => {
      setOpslaan(true);
      try {
        await updateKeuzes(blauwdrukId, nieuweLijst);
      } finally {
        setOpslaan(false);
      }
    },
    [blauwdrukId]
  );

  const voegKeuzeToe = useCallback(() => {
    const nieuw: Keuze = {
      id: crypto.randomUUID(),
      vraag: "",
      opties: [],
    };
    setKeuzes((prev) => [...prev, nieuw]);
  }, []);

  const updateVraag = useCallback(
    async (id: string, vraag: string) => {
      const nieuw = keuzes.map((k) => (k.id === id ? { ...k, vraag } : k));
      setKeuzes(nieuw);
      await slaOp(nieuw);
    },
    [keuzes, slaOp]
  );

  const verwijderKeuze = useCallback(
    async (id: string) => {
      const nieuw = keuzes.filter((k) => k.id !== id);
      setKeuzes(nieuw);
      await slaOp(nieuw);
    },
    [keuzes, slaOp]
  );

  const voegOptieToe = useCallback(
    async (keuzeId: string, optie: string) => {
      const trimmed = optie.trim();
      if (!trimmed) return;
      const nieuw = keuzes.map((k) =>
        k.id === keuzeId ? { ...k, opties: [...k.opties, trimmed] } : k
      );
      setKeuzes(nieuw);
      await slaOp(nieuw);
    },
    [keuzes, slaOp]
  );

  const verwijderOptie = useCallback(
    async (keuzeId: string, optieIndex: number) => {
      const nieuw = keuzes.map((k) =>
        k.id === keuzeId ? { ...k, opties: k.opties.filter((_, i) => i !== optieIndex) } : k
      );
      setKeuzes(nieuw);
      await slaOp(nieuw);
    },
    [keuzes, slaOp]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {keuzes.length === 0 ? (
        <p className="mb-3 text-sm text-gray-400 italic">
          Nog geen keuzes. Voeg er een toe om te beginnen.
        </p>
      ) : (
        <ul className="mb-3 space-y-4">
          {keuzes.map((k) => (
            <KeuzeItem
              key={k.id}
              keuze={k}
              onUpdateVraag={updateVraag}
              onVerwijder={verwijderKeuze}
              onVoegOptieToe={voegOptieToe}
              onVerwijderOptie={verwijderOptie}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={voegKeuzeToe}
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          + Nieuwe keuze
        </button>
        {opslaan && <span className="text-xs text-gray-400">Opslaan...</span>}
      </div>
    </div>
  );
}

// --- Sub-component per keuze ---

interface KeuzeItemProps {
  keuze: Keuze;
  onUpdateVraag: (id: string, vraag: string) => Promise<void>;
  onVerwijder: (id: string) => Promise<void>;
  onVoegOptieToe: (id: string, optie: string) => Promise<void>;
  onVerwijderOptie: (id: string, optieIndex: number) => Promise<void>;
}

function KeuzeItem({
  keuze,
  onUpdateVraag,
  onVerwijder,
  onVoegOptieToe,
  onVerwijderOptie,
}: KeuzeItemProps) {
  const [bewerkVraag, setBewerkVraag] = useState(false);
  const [vraagTekst, setVraagTekst] = useState(keuze.vraag);
  const [nieuweOptie, setNieuweOptie] = useState("");

  const bevestigVraag = useCallback(async () => {
    setBewerkVraag(false);
    if (vraagTekst.trim() !== keuze.vraag) {
      await onUpdateVraag(keuze.id, vraagTekst.trim());
    }
  }, [vraagTekst, keuze, onUpdateVraag]);

  const handleOptieToevoegen = useCallback(async () => {
    if (!nieuweOptie.trim()) return;
    await onVoegOptieToe(keuze.id, nieuweOptie);
    setNieuweOptie("");
  }, [nieuweOptie, keuze.id, onVoegOptieToe]);

  return (
    <li className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      {/* Vraag */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="mt-0.5 shrink-0 text-orange-500">&#10067;</span>
        {bewerkVraag || !keuze.vraag ? (
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={vraagTekst}
              onChange={(e) => setVraagTekst(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") bevestigVraag();
                if (e.key === "Escape") {
                  setVraagTekst(keuze.vraag);
                  setBewerkVraag(false);
                }
              }}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              autoFocus
              placeholder="Typ een vraag, bijv. 'Hoeveel U15-teams?'"
            />
            <button
              onClick={bevestigVraag}
              className="rounded bg-orange-500 px-2 py-1 text-xs text-white transition-colors hover:bg-orange-600"
            >
              OK
            </button>
          </div>
        ) : (
          <div className="group flex flex-1 items-start justify-between">
            <span
              className="cursor-pointer text-sm font-medium text-gray-800 hover:text-orange-700"
              onClick={() => setBewerkVraag(true)}
            >
              {keuze.vraag}
            </span>
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setBewerkVraag(true)}
                className="text-xs text-gray-400 hover:text-gray-600"
                title="Bewerken"
              >
                &#9998;
              </button>
              <button
                onClick={() => onVerwijder(keuze.id)}
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
      <div className="ml-6 flex flex-wrap items-center gap-2">
        {keuze.opties.map((optie, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700"
          >
            {optie}
            <button
              onClick={() => onVerwijderOptie(keuze.id, index)}
              className="ml-0.5 text-xs text-gray-400 hover:text-red-500"
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
            className="w-32 rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-300 focus:outline-none"
            placeholder="+ optie"
          />
          {nieuweOptie.trim() && (
            <button
              onClick={handleOptieToevoegen}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Toevoegen
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
