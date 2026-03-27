"use client";

import { useState } from "react";
import { ItemRow } from "./item-row";
import { PIJLER_ICON_MAP } from "@/components/beheer/icons";

const LAAG_LABELS: Record<string, { label: string; kleur: string }> = {
  technisch: { label: "T", kleur: "bg-blue-900/30 text-blue-400" },
  tactisch: { label: "Ta", kleur: "bg-purple-900/30 text-purple-400" },
  mentaal: { label: "M", kleur: "bg-amber-900/30 text-amber-400" },
};

interface Item {
  id: string;
  itemCode: string;
  label: string;
  vraagTekst: string;
  laag: string | null;
  volgorde: number;
  actief: boolean;
}

interface PijlerSectionProps {
  code: string;
  naam: string;
  icoon: string | null;
  items: Item[];
  isEditable: boolean;
  onUpdateItem: (
    itemId: string,
    data: { label?: string; vraagTekst?: string; laag?: string | null; actief?: boolean }
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: () => void;
}

export function PijlerSection({
  code,
  naam,
  icoon,
  items,
  isEditable,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
}: PijlerSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const actieveItems = items.filter((i) => i.actief);
  const PijlerIcon = PIJLER_ICON_MAP[code];

  return (
    <div className="rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-surface-raised flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {PijlerIcon ? <PijlerIcon className="h-5 w-5" /> : null}
          <span className="text-text-primary font-semibold">{naam}</span>
          <span className="text-text-muted text-sm">({code})</span>
          <span
            className="text-text-secondary rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: "var(--surface-sunken)" }}
          >
            {actieveItems.length} items
          </span>
        </div>
        <svg
          className={`text-text-muted h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t" style={{ borderColor: "var(--border-default)" }}>
          {items.length === 0 ? (
            <div className="text-text-muted px-4 py-6 text-center text-sm">
              Geen items in deze pijler
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isEditable={isEditable}
                  laagLabels={LAAG_LABELS}
                  onUpdate={(data) => onUpdateItem(item.id, data)}
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </div>
          )}

          {isEditable && (
            <div className="border-t px-4 py-2" style={{ borderColor: "var(--border-light)" }}>
              <button
                onClick={onAddItem}
                className="text-ow-oranje hover:bg-ow-oranje/10 flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Item toevoegen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { LAAG_LABELS };
