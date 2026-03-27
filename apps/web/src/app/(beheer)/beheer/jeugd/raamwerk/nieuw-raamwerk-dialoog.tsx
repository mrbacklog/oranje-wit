"use client";

import { useState, useTransition } from "react";
import { Button, Dialog, Input, Select } from "@oranje-wit/ui";
import { createRaamwerk, type RaamwerkVersieSamenvatting } from "./actions";

interface Props {
  versies: RaamwerkVersieSamenvatting[];
}

export function NieuwRaamwerkDialoog({ versies }: Props) {
  const [open, setOpen] = useState(false);
  const [seizoen, setSeizoen] = useState("");
  const [naam, setNaam] = useState("");
  const [kopieerVan, setKopieerVan] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setSeizoen("");
    setNaam("");
    setKopieerVan("");
    setError("");
  }

  function handleSubmit() {
    setError("");
    if (!seizoen || !naam) {
      setError("Seizoen en naam zijn verplicht");
      return;
    }

    startTransition(async () => {
      try {
        await createRaamwerk(seizoen, naam, kopieerVan || undefined);
        setOpen(false);
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Er ging iets mis");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Nieuw seizoen</Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Nieuwe raamwerkversie"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Annuleren
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Seizoen"
            placeholder="2026-2027"
            value={seizoen}
            onChange={(e) => setSeizoen(e.target.value)}
          />
          <Input
            label="Naam"
            placeholder="Vaardigheidsraamwerk v1.2"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
          />
          <Select
            label="Kopieer van (optioneel)"
            value={kopieerVan}
            onChange={(e) => setKopieerVan(e.target.value)}
          >
            <option value="">Lege versie (standaard bandstructuur)</option>
            {versies.map((v) => (
              <option key={v.id} value={v.id}>
                {v.seizoen} - {v.naam} ({v.totaalItems} items)
              </option>
            ))}
          </Select>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      </Dialog>
    </>
  );
}
