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
      <label className="block text-xs font-medium text-gray-600">
        {label} (1-{max})
      </label>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`h-8 w-8 rounded-md text-sm font-medium ${
              value === v ? "bg-orange-500 text-white" : "border bg-white hover:bg-orange-50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
