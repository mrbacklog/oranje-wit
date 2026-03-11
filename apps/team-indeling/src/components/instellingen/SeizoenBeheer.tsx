"use client";

import { Card, CardBody, CardHeader, Button, Select } from "@oranje-wit/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { switchSeizoen } from "@/app/instellingen/actions";

interface Props {
  seizoenen: { seizoen: string; isWerkseizoen: boolean }[];
}

export function SeizoenBeheer({ seizoenen }: Props) {
  const werkseizoen = seizoenen.find((s) => s.isWerkseizoen);
  const [selected, setSelected] = useState(werkseizoen?.seizoen || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSwitch() {
    if (!selected || selected === werkseizoen?.seizoen) return;
    startTransition(async () => {
      await switchSeizoen(selected);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Seizoenswisseling</h2>
        <p className="mt-1 text-xs text-gray-500">Alleen zichtbaar voor admin</p>
      </CardHeader>
      <CardBody>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              label="Actief werkseizoen"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {seizoenen.map((s) => (
                <option key={s.seizoen} value={s.seizoen}>
                  {s.seizoen} {s.isWerkseizoen ? "\u2605" : ""}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleSwitch} disabled={isPending || selected === werkseizoen?.seizoen}>
            {isPending ? "Wisselen..." : "Wissel seizoen"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
