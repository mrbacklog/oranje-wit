"use client";

import { useState } from "react";

interface ItemData {
  id: string;
  itemCode: string;
  label: string;
  vraagTekst: string;
  isKern: boolean;
  categorie: string | null;
  volgorde: number;
  actief: boolean;
}

export function ItemRow({
  item,
  isFirst,
  isLast,
  isEditable,
  isEditing,
  loading,
  onEdit,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: ItemData;
  isFirst: boolean;
  isLast: boolean;
  isEditable: boolean;
  isEditing: boolean;
  loading: boolean;
  onEdit: () => void;
  onUpdate: (data: Partial<ItemData>) => Promise<boolean>;
  onDelete: () => void;
  onMove: (richting: "omhoog" | "omlaag") => void;
}) {
  const [editLabel, setEditLabel] = useState(item.label);
  const [editVraag, setEditVraag] = useState(item.vraagTekst);

  const handleSave = async () => {
    const success = await onUpdate({
      label: editLabel,
      vraagTekst: editVraag,
    });
    if (success) onEdit(); // sluit edit mode
  };

  if (!item.actief) {
    return (
      <div className="bg-surface-card/5 flex items-center gap-3 rounded-lg px-3 py-2 opacity-40">
        <span className="text-text-muted text-sm line-through">{item.label}</span>
        <span className="text-text-muted text-xs">(verwijderd)</span>
        {isEditable && (
          <button
            onClick={() => onUpdate({ actief: true })}
            disabled={loading}
            className="text-text-muted ml-auto text-xs transition-colors hover:text-emerald-400"
          >
            Herstellen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-lg border border-white/5 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
                placeholder="Label"
              />
              <textarea
                value={editVraag}
                onChange={(e) => setEditVraag(e.target.value)}
                rows={2}
                className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
                placeholder="Formulering (min. 10 tekens)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading || editLabel.length < 3 || editVraag.length < 10}
                  className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-lg px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  Opslaan
                </button>
                <button
                  onClick={() => {
                    setEditLabel(item.label);
                    setEditVraag(item.vraagTekst);
                    onEdit();
                  }}
                  className="text-text-secondary text-xs transition-colors hover:text-white"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                <span className="text-text-muted font-mono text-xs">{item.itemCode}</span>
                {item.isKern ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    kern
                  </span>
                ) : (
                  <span className="bg-surface-card/10 rounded-full px-2 py-0.5 text-xs text-white/40">
                    verdieping
                  </span>
                )}
                {item.categorie && (
                  <span className="text-text-muted text-xs">{item.categorie}</span>
                )}
              </div>
              <p className="text-text-secondary mt-1 text-sm">{item.vraagTekst}</p>
            </div>
          )}
        </div>

        {/* Acties */}
        {isEditable && !isEditing && (
          <ItemActies
            item={item}
            isFirst={isFirst}
            isLast={isLast}
            loading={loading}
            onEdit={onEdit}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onMove={onMove}
          />
        )}
      </div>
    </div>
  );
}

// ── Actie-knoppen voor een item ──

function ItemActies({
  item,
  isFirst,
  isLast,
  loading,
  onEdit,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: ItemData;
  isFirst: boolean;
  isLast: boolean;
  loading: boolean;
  onEdit: () => void;
  onUpdate: (data: Partial<ItemData>) => Promise<boolean>;
  onDelete: () => void;
  onMove: (richting: "omhoog" | "omlaag") => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {/* Volgorde knoppen */}
      <button
        onClick={() => onMove("omhoog")}
        disabled={isFirst || loading}
        className="text-text-muted hover:text-text-primary rounded p-1 transition-colors disabled:opacity-30"
        title="Omhoog"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
      <button
        onClick={() => onMove("omlaag")}
        disabled={isLast || loading}
        className="text-text-muted hover:text-text-primary rounded p-1 transition-colors disabled:opacity-30"
        title="Omlaag"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Kern toggle */}
      <button
        onClick={() => onUpdate({ isKern: !item.isKern })}
        disabled={loading}
        className={`rounded px-2 py-1 text-xs transition-colors ${
          item.isKern
            ? "text-emerald-400 hover:text-amber-400"
            : "text-text-muted hover:text-emerald-400"
        }`}
        title={item.isKern ? "Markeer als verdieping" : "Markeer als kern"}
      >
        {item.isKern ? "Kern" : "Kern?"}
      </button>

      {/* Bewerken */}
      <button
        onClick={onEdit}
        disabled={loading}
        className="text-text-muted hover:text-ow-oranje rounded p-1 transition-colors"
        title="Bewerken"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        </svg>
      </button>

      {/* Verwijderen */}
      <button
        onClick={() => {
          if (confirm(`Weet je zeker dat je "${item.label}" wilt verwijderen?`)) {
            onDelete();
          }
        }}
        disabled={loading}
        className="text-text-muted rounded p-1 transition-colors hover:text-red-400"
        title="Verwijderen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}
