import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`placeholder:text-text-muted w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${error ? "border-red-500" : ""} ${className}`}
          style={{
            backgroundColor: "var(--surface-card)",
            color: "var(--text-primary)",
            borderColor: error ? undefined : "var(--border-strong)",
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs" style={{ color: "var(--color-error-500)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
