"use client";

import { useState } from "react";

interface Item {
  id: string;
  itemCode: string;
  label: string;
  vraagTekst: string;
  laag: string | null;
  volgorde: number;
  actief: boolean;
}

interface LaagLabel {
  label: string;
  kleur: string;
}

interface ItemRowProps {
  item: Item;
  isEditable: boolean;
  laagLabels: Record<string, LaagLabel>;
  onUpdate: (data: {
    label?: string;
    vraagTekst?: string;
    laag?: string | null;
    actief?: boolean;
  }) => void;
  onDelete: () => void;
}

export function ItemRow({ item, isEditable, laagLabels, onUpdate, onDelete }: ItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editVraag, setEditVraag] = useState(item.vraagTekst);
  const [editLaag, setEditLaag] = useState(item.laag || "");

  function handleSave() {
    onUpdate({
      label: editLabel,
      vraagTekst: editVraag,
      laag: editLaag || null,
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setEditLabel(item.label);
    setEditVraag(item.vraagTekst);
    setEditLaag(item.laag || "");
    setIsEditing(false);
  }

  if (isEditing && isEditable) {
    return (
      <div className="space-y-2 px-4 py-3">
        <div className="flex gap-2">
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="flex-1 rounded-md border px-2 py-1 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            placeholder="Label"
          />
          <select
            value={editLaag}
            onChange={(e) => setEditLaag(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="">Geen laag</option>
            <option value="technisch">Technisch</option>
            <option value="tactisch">Tactisch</option>
            <option value="mentaal">Mentaal</option>
          </select>
        </div>
        <input
          value={editVraag}
          onChange={(e) => setEditVraag(e.target.value)}
          className="w-full rounded-md border px-2 py-1 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
          placeholder="Vraagtekst"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="text-text-secondary hover:bg-surface-raised rounded-md px-3 py-1 text-xs"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-orange-600 px-3 py-1 text-xs text-white hover:bg-orange-700"
          >
            Opslaan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${!item.actief ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-text-primary text-sm font-medium">{item.label}</span>
          {item.laag && laagLabels[item.laag] && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${laagLabels[item.laag].kleur}`}
            >
              {laagLabels[item.laag].label}
            </span>
          )}
          {!item.actief && (
            <span
              className="text-text-muted rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: "var(--surface-sunken)" }}
            >
              Inactief
            </span>
          )}
        </div>
        <p className="text-text-muted truncate text-xs">{item.vraagTekst}</p>
        <p className="text-text-muted text-[10px]">{item.itemCode}</p>
      </div>

      {isEditable && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ actief: !item.actief })}
            className="text-text-muted hover:bg-surface-raised hover:text-text-secondary rounded p-1"
            title={item.actief ? "Deactiveren" : "Activeren"}
          >
            {item.actief ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="text-text-muted hover:bg-surface-raised hover:text-ow-oranje rounded p-1"
            title="Bewerken"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-text-muted rounded p-1 hover:bg-red-900/20 hover:text-red-400"
            title="Verwijderen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
