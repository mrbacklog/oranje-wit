"use client";

import { useState, useCallback } from "react";
import { updateSpeerpunten } from "@/app/blauwdruk/actions";

interface SpeerpuntenEditorProps {
  blauwdrukId: string;
  initieel: string[];
}

export default function SpeerpuntenEditor({
  blauwdrukId,
  initieel,
}: SpeerpuntenEditorProps) {
  const [speerpunten, setSpeerpunten] = useState<string[]>(initieel);
  const [bewerkIndex, setBewerkIndex] = useState<number | null>(null);
  const [bewerkTekst, setBewerkTekst] = useState("");
  const [opslaan, setOpslaan] = useState(false);

  const slaOp = useCallback(
    async (nieuweSpeerpunten: string[]) => {
      setOpslaan(true);
      try {
        await updateSpeerpunten(blauwdrukId, nieuweSpeerpunten);
      } finally {
        setOpslaan(false);
      }
    },
    [blauwdrukId]
  );

  const voegToe = useCallback(() => {
    const nieuw = [...speerpunten, ""];
    setSpeerpunten(nieuw);
    setBewerkIndex(nieuw.length - 1);
    setBewerkTekst("");
  }, [speerpunten]);

  const verwijder = useCallback(
    async (index: number) => {
      const nieuw = speerpunten.filter((_, i) => i !== index);
      setSpeerpunten(nieuw);
      setBewerkIndex(null);
      await slaOp(nieuw);
    },
    [speerpunten, slaOp]
  );

  const startBewerking = useCallback(
    (index: number) => {
      setBewerkIndex(index);
      setBewerkTekst(speerpunten[index]);
    },
    [speerpunten]
  );

  const bevestigBewerking = useCallback(async () => {
    if (bewerkIndex === null) return;
    const tekst = bewerkTekst.trim();
    if (!tekst) {
      // Lege tekst = verwijderen
      await verwijder(bewerkIndex);
      return;
    }
    const nieuw = [...speerpunten];
    nieuw[bewerkIndex] = tekst;
    setSpeerpunten(nieuw);
    setBewerkIndex(null);
    setBewerkTekst("");
    await slaOp(nieuw);
  }, [bewerkIndex, bewerkTekst, speerpunten, slaOp, verwijder]);

  const annuleerBewerking = useCallback(() => {
    if (bewerkIndex !== null && speerpunten[bewerkIndex] === "") {
      // Nieuwe lege entry annuleren = verwijderen
      setSpeerpunten(speerpunten.filter((_, i) => i !== bewerkIndex));
    }
    setBewerkIndex(null);
    setBewerkTekst("");
  }, [bewerkIndex, speerpunten]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {speerpunten.length === 0 && bewerkIndex === null ? (
        <p className="text-sm text-gray-400 italic mb-3">
          Nog geen speerpunten. Voeg er een toe om te beginnen.
        </p>
      ) : (
        <ul className="space-y-2 mb-3">
          {speerpunten.map((speerpunt, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5 shrink-0">&#9679;</span>
              {bewerkIndex === index ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={bewerkTekst}
                    onChange={(e) => setBewerkTekst(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") bevestigBewerking();
                      if (e.key === "Escape") annuleerBewerking();
                    }}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                    autoFocus
                    placeholder="Typ een speerpunt..."
                  />
                  <button
                    onClick={bevestigBewerking}
                    className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    OK
                  </button>
                  <button
                    onClick={annuleerBewerking}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    Annuleer
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-start justify-between group">
                  <span
                    className="text-sm text-gray-800 cursor-pointer hover:text-orange-700"
                    onClick={() => startBewerking(index)}
                  >
                    {speerpunt}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startBewerking(index)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                      title="Bewerken"
                    >
                      &#9998;
                    </button>
                    <button
                      onClick={() => verwijder(index)}
                      className="text-xs text-gray-400 hover:text-red-500"
                      title="Verwijderen"
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={voegToe}
          disabled={bewerkIndex !== null}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Speerpunt toevoegen
        </button>
        {opslaan && (
          <span className="text-xs text-gray-400">Opslaan...</span>
        )}
      </div>
    </div>
  );
}
