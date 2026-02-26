"use client";

import { useState, useCallback } from "react";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";

interface NieuwTeamDialoogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    naam: string;
    categorie: TeamCategorie;
    kleur?: Kleur;
  }) => void;
}

const CATEGORIEEN: { waarde: TeamCategorie; label: string }[] = [
  { waarde: "B_CATEGORIE", label: "B-categorie" },
  { waarde: "A_CATEGORIE", label: "A-categorie" },
  { waarde: "SENIOREN", label: "Senioren" },
];

const KLEUREN: { waarde: Kleur; label: string }[] = [
  { waarde: "BLAUW", label: "Blauw" },
  { waarde: "GROEN", label: "Groen" },
  { waarde: "GEEL", label: "Geel" },
  { waarde: "ORANJE", label: "Oranje" },
  { waarde: "ROOD", label: "Rood" },
];

export default function NieuwTeamDialoog({
  open,
  onClose,
  onSubmit,
}: NieuwTeamDialoogProps) {
  const [naam, setNaam] = useState("");
  const [categorie, setCategorie] = useState<TeamCategorie>("B_CATEGORIE");
  const [kleur, setKleur] = useState<Kleur | "">("");

  const handleSubmit = useCallback(() => {
    if (!naam.trim()) return;
    onSubmit({
      naam: naam.trim(),
      categorie,
      kleur: categorie === "B_CATEGORIE" && kleur ? (kleur as Kleur) : undefined,
    });
    setNaam("");
    setCategorie("B_CATEGORIE");
    setKleur("");
    onClose();
  }, [naam, categorie, kleur, onSubmit, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Nieuw team</h3>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Naam */}
          <div>
            <label
              htmlFor="team-naam"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Teamnaam *
            </label>
            <input
              id="team-naam"
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Bijv. Oranje-3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              autoFocus
            />
          </div>

          {/* Categorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorie
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIEEN.map(({ waarde, label }) => (
                <label
                  key={waarde}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                    categorie === waarde
                      ? "bg-orange-50 border-orange-400 text-orange-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="categorie"
                    value={waarde}
                    checked={categorie === waarde}
                    onChange={() => setCategorie(waarde)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Kleur (alleen bij B-categorie) */}
          {categorie === "B_CATEGORIE" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kleur
              </label>
              <select
                value={kleur}
                onChange={(e) => setKleur(e.target.value as Kleur | "")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              >
                <option value="">Geen kleur</option>
                {KLEUREN.map(({ waarde, label }) => (
                  <option key={waarde} value={waarde}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!naam.trim()}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Team aanmaken
          </button>
        </div>
      </div>
    </div>
  );
}
