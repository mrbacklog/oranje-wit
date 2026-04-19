"use client";

// Gedeelde UI-elementen voor Sportlink sync componenten

const inputBg = "var(--bg-2, #141416)";
const inputBorder = "var(--border-1, #2a2a2e)";

export function FormInput({
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "9px 12px",
        fontSize: 14,
        background: inputBg,
        border: `1px solid ${inputBorder}`,
        borderRadius: "var(--radius-sm, 6px)",
        color: "var(--text-1, #fafafa)",
        outline: "none",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent, #ff6b00)";
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255, 107, 0, .4)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = inputBorder;
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}
