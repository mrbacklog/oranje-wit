"use client";

import { useState } from "react";
import { Button, Input, Select } from "@oranje-wit/ui";

interface ItemFormProps {
  pijlerCode: string;
  pijlerNaam: string;
  bandNeedLaag: boolean;
  isKorfbalactie: boolean;
  onSubmit: (data: {
    itemCode: string;
    label: string;
    vraagTekst: string;
    laag: string | null;
  }) => void;
  onCancel: () => void;
}

export function ItemForm({
  pijlerCode,
  pijlerNaam,
  bandNeedLaag,
  isKorfbalactie,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [label, setLabel] = useState("");
  const [vraagTekst, setVraagTekst] = useState("");
  const [laag, setLaag] = useState("");

  function generateItemCode() {
    const prefix = pijlerCode.toLowerCase();
    const suffix = label
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "_");
    if (laag && isKorfbalactie) {
      const laagPrefix = laag === "technisch" ? "t" : laag === "tactisch" ? "ta" : "m";
      return `${prefix}_${laagPrefix}_${suffix}`;
    }
    return `${prefix}_${suffix}`;
  }

  function handleSubmit() {
    if (!label.trim() || !vraagTekst.trim()) return;
    onSubmit({
      itemCode: generateItemCode(),
      label: label.trim(),
      vraagTekst: vraagTekst.trim(),
      laag: laag || null,
    });
  }

  return (
    <div
      className="border-ow-oranje/30 space-y-3 rounded-lg border p-4"
      style={{ backgroundColor: "var(--surface-raised)" }}
    >
      <h4 className="text-text-secondary text-sm font-medium">Nieuw item voor {pijlerNaam}</h4>
      <Input
        label="Label (korte naam)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="bijv. Afstandsschot"
      />
      <Input
        label="Vraagtekst (wat de scout ziet)"
        value={vraagTekst}
        onChange={(e) => setVraagTekst(e.target.value)}
        placeholder="bijv. Schiet goed van afstand"
      />
      {bandNeedLaag && isKorfbalactie && (
        <Select label="Laag" value={laag} onChange={(e) => setLaag(e.target.value)}>
          <option value="">Selecteer laag...</option>
          <option value="technisch">Technisch (KAN je het?)</option>
          <option value="tactisch">Tactisch (WEET je wanneer?)</option>
          <option value="mentaal">Mentaal (DOE je het?)</option>
        </Select>
      )}
      {label && (
        <p className="text-text-muted text-xs">
          Item code:{" "}
          <code className="rounded px-1" style={{ backgroundColor: "var(--surface-sunken)" }}>
            {generateItemCode()}
          </code>
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuleren
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!label.trim() || !vraagTekst.trim()}
        >
          Toevoegen
        </Button>
      </div>
    </div>
  );
}
