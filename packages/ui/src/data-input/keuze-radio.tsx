"use client";

interface KeuzeRadioProps {
  value: string | null;
  onChange: (value: string) => void;
  opties: string[];
  label?: string;
}

export function KeuzeRadio({ value, onChange, opties, label }: KeuzeRadioProps) {
  return (
    <div>
      {label && (
        <label
          className="mb-2 block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {opties.map((optie) => {
          const isActive = value === optie;
          return (
            <button
              key={optie}
              type="button"
              onClick={() => onChange(optie)}
              className="rounded-lg border px-3 py-2 text-sm transition-all"
              style={{
                backgroundColor: isActive ? "var(--ow-accent, #ff6b00)" : "var(--surface-raised)",
                borderColor: isActive ? "var(--ow-accent, #ff6b00)" : "var(--border-default)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                boxShadow: isActive ? "0 0 12px rgba(255,107,0,0.25)" : "none",
              }}
            >
              {optie}
            </button>
          );
        })}
      </div>
    </div>
  );
}
