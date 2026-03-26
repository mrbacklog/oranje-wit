"use client";

import { useState } from "react";
import { logger } from "@oranje-wit/types";

interface RatingEditorProps {
  spelerId: string;
  rating: number | null;
  ratingBerekend: number | null;
  onUpdate?: (nieuwRating: number) => void;
}

export default function RatingEditor({
  spelerId,
  rating,
  ratingBerekend,
  onUpdate,
}: RatingEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(rating ?? ""));
  const [saving, setSaving] = useState(false);

  const isAangepast = rating != null && ratingBerekend != null && rating !== ratingBerekend;

  async function handleSave() {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 200) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/spelers/${spelerId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: num }),
      });
      if (res.ok) {
        onUpdate?.(num);
        setEditing(false);
      }
    } catch (error) {
      logger.warn("Rating opslaan mislukt:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (ratingBerekend == null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/spelers/${spelerId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingBerekend }),
      });
      if (res.ok) {
        onUpdate?.(ratingBerekend);
        setValue(String(ratingBerekend));
        setEditing(false);
      }
    } catch (error) {
      logger.warn("Rating reset mislukt:", error);
    } finally {
      setSaving(false);
    }
  }

  if (rating == null && ratingBerekend == null) {
    return (
      <div>
        <span className="text-xs text-gray-500">Rating</span>
        <p className="text-sm text-gray-400">–</p>
      </div>
    );
  }

  return (
    <div>
      <span className="text-xs text-gray-500">Rating</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              type="number"
              min={0}
              max={200}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-sm tabular-nums focus:border-orange-400 focus:outline-none"
              autoFocus
              disabled={saving}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs text-orange-600 hover:text-orange-800"
            >
              OK
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Annuleer
            </button>
          </>
        ) : (
          <>
            <span
              className="cursor-pointer text-sm font-bold text-gray-800 tabular-nums hover:text-orange-600"
              onClick={() => {
                setValue(String(rating ?? ratingBerekend ?? ""));
                setEditing(true);
              }}
              title="Klik om aan te passen"
            >
              {rating ?? ratingBerekend}
            </span>
            {isAangepast && (
              <>
                <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                  aangepast
                </span>
                <span className="text-[10px] text-gray-400" title="Berekende rating">
                  (berekend: {ratingBerekend})
                </span>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="text-[10px] text-gray-400 hover:text-orange-600"
                  title="Reset naar berekende waarde"
                >
                  Reset
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
