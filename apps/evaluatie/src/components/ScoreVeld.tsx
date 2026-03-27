"use client";

interface ScoreVeldProps {
  label: string;
  max: number;
  value: number | null;
  onChange: (v: number) => void;
}

export default function ScoreVeld({ label, max, value, onChange }: ScoreVeldProps) {
  return (
    <div>
      <label className="text-text-secondary block text-xs font-medium">
        {label} (1-{max})
      </label>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`h-8 w-8 rounded-md text-sm font-medium ${
              value === v ? "bg-ow-oranje text-white" : "hover:bg-ow-oranje/10 border"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
