import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = "", id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${className}`}
          style={{
            backgroundColor: "var(--surface-card)",
            color: "var(--text-primary)",
            borderColor: "var(--border-strong)",
          }}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
