"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { maakNieuwSeizoen } from "@/app/blauwdruk/actions";

export default function NieuwSeizoenDialog({ volgendSeizoen }: { volgendSeizoen: string }) {
  const [open, setOpen] = useState(false);
  const [seizoen, setSeizoen] = useState(volgendSeizoen);
  const [fout, setFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setFout(null);
    startTransition(async () => {
      try {
        await maakNieuwSeizoen(seizoen);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setFout(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-orange-600 hover:text-orange-700"
      >
        + Nieuw seizoen
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-medium text-gray-700">Nieuw seizoen aanmaken</p>
      <input
        type="text"
        value={seizoen}
        onChange={(e) => setSeizoen(e.target.value)}
        placeholder="bijv. 2027-2028"
        pattern="\d{4}-\d{4}"
        className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
      />
      {fout && <p className="mb-2 text-xs text-red-600">{fout}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isPending ? "Aanmaken..." : "Aanmaken"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
