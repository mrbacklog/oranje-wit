"use client";

import { useState, useCallback } from "react";
import type {
  LedenStatistieken,
  CategorieStats,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { updateCategorieKaders } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import {
  CATEGORIEEN,
  getMergedSettings,
  type CategorieSettings,
  type CategorieKaders,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/categorie-kaders";
import { CategorieKaart } from "./CategorieKaart";
import { SettingsDialog } from "./CategorieSettingsDialog";

// ============================================================
// Props
// ============================================================

interface CategoriePanelProps {
  statistieken: LedenStatistieken;
  kaders: CategorieKaders;
  kadersId: string;
}

// ============================================================
// Mapping: categorie-sleutel → statistieken
// ============================================================

function getStats(statistieken: LedenStatistieken, sleutel: string): CategorieStats | null {
  // B-kleuren zitten in perCategorie
  const kleurMatch = statistieken.perCategorie.find((c) => c.kleur === sleutel);
  if (kleurMatch) return kleurMatch;

  // Senioren
  if (sleutel === "SENIOREN_A" || sleutel === "SENIOREN_B") {
    return {
      kleur: sleutel,
      label: sleutel === "SENIOREN_A" ? "Senioren A" : "Senioren B",
      ...statistieken.senioren,
      streefPerTeam: sleutel === "SENIOREN_A" ? 10 : 10,
      minTeams: 0,
      maxTeams: 0,
    };
  }

  return null;
}

// ============================================================
// Hoofdcomponent
// ============================================================

export default function CategoriePanel({
  statistieken,
  kaders: initieleKaders,
  kadersId,
}: CategoriePanelProps) {
  const [kaders, setKaders] = useState<CategorieKaders>(initieleKaders);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleSave = useCallback(
    async (categorie: string, settings: Partial<CategorieSettings>) => {
      setKaders((prev) => ({
        ...prev,
        [categorie]: { ...prev[categorie], ...settings },
      }));
      // Server-side opslaan via queueMicrotask (non-blocking)
      queueMicrotask(() => {
        updateCategorieKaders(kadersId, categorie, settings);
      });
    },
    [kadersId]
  );

  return (
    <div className="space-y-4">
      {/* Categorie-kaarten grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CATEGORIEEN.map((cat) => {
          const stats = getStats(statistieken, cat.sleutel);
          const settings = getMergedSettings(cat.sleutel, kaders);
          return (
            <CategorieKaart
              key={cat.sleutel}
              definitie={cat}
              stats={stats}
              settings={settings}
              onOpenSettings={() => setOpenDialog(cat.sleutel)}
            />
          );
        })}
      </div>

      {/* Settings Dialog */}
      {openDialog && (
        <SettingsDialog
          sleutel={openDialog}
          settings={getMergedSettings(openDialog, kaders)}
          onSave={(s) => handleSave(openDialog, s)}
          onClose={() => setOpenDialog(null)}
        />
      )}
    </div>
  );
}
