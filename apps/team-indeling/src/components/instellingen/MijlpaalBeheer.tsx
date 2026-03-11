"use client";

import { Card, CardBody, CardHeader, Button, Input } from "@oranje-wit/ui";
import type { Mijlpaal } from "@oranje-wit/database";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMijlpaal, deleteMijlpaal, updateMijlpaal } from "@/app/instellingen/actions";

interface Props {
  mijlpalen: Mijlpaal[];
}

export function MijlpaalBeheer({ mijlpalen }: Props) {
  const [label, setLabel] = useState("");
  const [datum, setDatum] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    if (!label || !datum) return;
    startTransition(async () => {
      await createMijlpaal({ label, datum });
      setLabel("");
      setDatum("");
      router.refresh();
    });
  }

  function handleToggle(m: Mijlpaal) {
    startTransition(async () => {
      await updateMijlpaal(m.id, { afgerond: !m.afgerond });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMijlpaal(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Mijlpalen</h2>
        <p className="mt-1 text-xs text-gray-500">Configureer mijlpalen voor het Dashboard</p>
      </CardHeader>
      <CardBody>
        <div className="mb-4 space-y-2">
          {mijlpalen.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={m.afgerond}
                onChange={() => handleToggle(m)}
                className="accent-ow-oranje"
              />
              <span
                className={`flex-1 text-sm ${m.afgerond ? "text-gray-400 line-through" : "text-gray-900"}`}
              >
                {m.label}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(m.datum).toLocaleDateString("nl-NL")}
              </span>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-xs text-red-400 hover:text-red-600"
                disabled={isPending}
              >
                {"\u2715"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Label"
              value={label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
              placeholder="Bijv. TC-vergadering #2"
            />
          </div>
          <div>
            <Input
              label="Datum"
              type="date"
              value={datum}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDatum(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={isPending || !label || !datum}>
            Toevoegen
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
