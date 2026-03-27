"use client";

import { useState } from "react";

export function NieuwItemForm({
  pijlerId,
  pijlerCode,
  loading,
  onCreate,
  onCancel,
}: {
  pijlerId: string;
  pijlerCode: string;
  loading: boolean;
  onCreate: (
    pijlerId: string,
    data: {
      itemCode: string;
      label: string;
      vraagTekst: string;
      isKern: boolean;
    }
  ) => Promise<boolean>;
  onCancel: () => void;
}) {
  const prefix = pijlerCode.toLowerCase().slice(0, 3);
  const [itemCode, setItemCode] = useState(`${prefix}_`);
  const [label, setLabel] = useState("");
  const [vraagTekst, setVraagTekst] = useState("");
  const [isKern, setIsKern] = useState(false);

  const codeGeldig = /^[a-z_]{3,50}$/.test(itemCode);
  const labelGeldig = label.length >= 3;
  const vraagGeldig = vraagTekst.length >= 10;
  const kanOpslaan = codeGeldig && labelGeldig && vraagGeldig && !loading;

  return (
    <div className="bg-surface-elevated space-y-3 rounded-xl border border-white/10 p-4">
      <h4 className="text-sm font-medium">Nieuw item</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-text-secondary mb-1 block text-xs">Item-code</label>
          <input
            type="text"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value.toLowerCase())}
            className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 font-mono text-sm outline-none"
            placeholder={`${prefix}_naam`}
          />
          {itemCode.length > 0 && !codeGeldig && (
            <p className="mt-1 text-xs text-red-400">Lowercase met underscores, min. 3 tekens</p>
          )}
        </div>
        <div>
          <label className="text-text-secondary mb-1 block text-xs">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
            placeholder="Korte naam"
          />
        </div>
      </div>
      <div>
        <label className="text-text-secondary mb-1 block text-xs">Formulering</label>
        <textarea
          value={vraagTekst}
          onChange={(e) => setVraagTekst(e.target.value)}
          rows={2}
          className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
          placeholder="Beschrijving van het observeerbare gedrag (min. 10 tekens)"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={isKern}
          onChange={(e) => setIsKern(e.target.checked)}
          className="accent-ow-oranje h-4 w-4 rounded"
        />
        <span className="text-sm">Kern-item (voor TEAM-methode)</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => onCreate(pijlerId, { itemCode, label, vraagTekst, isKern })}
          disabled={!kanOpslaan}
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Toevoegen"}
        </button>
        <button
          onClick={onCancel}
          className="text-text-secondary text-sm transition-colors hover:text-white"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
