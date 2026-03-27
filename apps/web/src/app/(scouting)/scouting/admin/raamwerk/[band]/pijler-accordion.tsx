"use client";

import { ItemRow } from "./item-row";
import { NieuwItemForm } from "./nieuw-item-form";

// ============================================================
// Types
// ============================================================

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

interface PijlerData {
  id: string;
  code: string;
  naam: string;
  icoon: string | null;
  volgorde: number;
  blok: string | null;
  items: ItemData[];
}

// ============================================================
// PijlerAccordion
// ============================================================

export function PijlerAccordion({
  pijler,
  isExpanded,
  validatie,
  isEditable,
  editingItem,
  nieuwItemPijler,
  loading,
  onToggle,
  onEditItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  onCreateItem,
  onSetNieuwItemPijler,
}: {
  pijler: PijlerData;
  isExpanded: boolean;
  validatie: { heeftKernItem: boolean; aantalKern: number; aantalActief: number };
  isEditable: boolean;
  editingItem: string | null;
  nieuwItemPijler: string | null;
  loading: boolean;
  onToggle: () => void;
  onEditItem: (id: string) => void;
  onUpdateItem: (id: string, data: Partial<ItemData>) => Promise<boolean>;
  onDeleteItem: (id: string) => void;
  onMoveItem: (id: string, dir: "omhoog" | "omlaag") => void;
  onCreateItem: (
    pijlerId: string,
    data: { itemCode: string; label: string; vraagTekst: string; isKern: boolean }
  ) => Promise<boolean>;
  onSetNieuwItemPijler: (id: string | null) => void;
}) {
  return (
    <div className="bg-surface-card overflow-hidden rounded-2xl border border-white/10">
      <PijlerHeader
        pijler={pijler}
        isExpanded={isExpanded}
        validatie={validatie}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="border-t border-white/5 px-5 py-3">
          {pijler.items.length === 0 ? (
            <p className="text-text-muted py-4 text-center text-sm">Geen items in deze pijler</p>
          ) : (
            <div className="space-y-2">
              {pijler.items.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isFirst={idx === 0}
                  isLast={idx === pijler.items.length - 1}
                  isEditable={isEditable}
                  isEditing={editingItem === item.id}
                  loading={loading}
                  onEdit={() => onEditItem(item.id)}
                  onUpdate={(data) => onUpdateItem(item.id, data)}
                  onDelete={() => onDeleteItem(item.id)}
                  onMove={(dir) => onMoveItem(item.id, dir)}
                />
              ))}
            </div>
          )}

          {isEditable && (
            <div className="mt-3 border-t border-white/5 pt-3">
              {nieuwItemPijler === pijler.id ? (
                <NieuwItemForm
                  pijlerId={pijler.id}
                  pijlerCode={pijler.code}
                  loading={loading}
                  onCreate={onCreateItem}
                  onCancel={() => onSetNieuwItemPijler(null)}
                />
              ) : (
                <button
                  onClick={() => onSetNieuwItemPijler(pijler.id)}
                  className="text-text-muted hover:text-ow-oranje flex items-center gap-2 text-sm transition-colors"
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
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Item toevoegen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PijlerHeader
// ============================================================

function PijlerHeader({
  pijler,
  isExpanded,
  validatie,
  onToggle,
}: {
  pijler: PijlerData;
  isExpanded: boolean;
  validatie: { heeftKernItem: boolean; aantalKern: number; aantalActief: number };
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="hover:bg-surface-card/5 flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
    >
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="font-semibold">{pijler.naam}</span>
        <span className="text-text-muted text-xs uppercase">{pijler.code}</span>
        {pijler.blok && (
          <span className="text-text-muted bg-surface-card/5 rounded px-2 py-0.5 text-xs">
            {pijler.blok}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ValidatieIndicator heeftKernItem={validatie.heeftKernItem} />
        <span className="text-text-secondary text-sm">
          {validatie.aantalKern} kern / {validatie.aantalActief} totaal
        </span>
      </div>
    </button>
  );
}

// ============================================================
// ValidatieIndicator
// ============================================================

function ValidatieIndicator({ heeftKernItem }: { heeftKernItem: boolean }) {
  if (heeftKernItem) {
    return (
      <span className="text-emerald-400" title="Heeft kern-items">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      </span>
    );
  }
  return (
    <span className="text-red-400" title="Geen kern-items">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    </span>
  );
}
