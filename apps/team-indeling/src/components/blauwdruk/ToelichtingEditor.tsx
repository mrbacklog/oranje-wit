"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { updateToelichting } from "@/app/blauwdruk/actions";

interface ToelichtingEditorProps {
  blauwdrukId: string;
  initieel: string;
}

export default function ToelichtingEditor({
  blauwdrukId,
  initieel,
}: ToelichtingEditorProps) {
  const [tekst, setTekst] = useState(initieel);
  const [status, setStatus] = useState<"idle" | "opslaan" | "opgeslagen">(
    "idle"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slaOp = useCallback(
    async (waarde: string) => {
      setStatus("opslaan");
      try {
        await updateToelichting(blauwdrukId, waarde);
        setStatus("opgeslagen");
        // Reset status na 2 seconden
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("idle");
      }
    },
    [blauwdrukId]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const waarde = e.target.value;
      setTekst(waarde);

      // Debounce: wacht 400ms na laatste toetsaanslag
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        slaOp(waarde);
      }, 400);
    },
    [slaOp]
  );

  // Cleanup timer bij unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <textarea
        value={tekst}
        onChange={handleChange}
        placeholder="Notities, speerpunten en toelichting bij de blauwdruk..."
        rows={6}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-y"
      />
      <div className="mt-2 flex justify-end">
        {status === "opslaan" && (
          <span className="text-xs text-gray-400">Opslaan...</span>
        )}
        {status === "opgeslagen" && (
          <span className="text-xs text-green-600">Opgeslagen</span>
        )}
      </div>
    </div>
  );
}
