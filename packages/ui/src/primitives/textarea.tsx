import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
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
Textarea.displayName = "Textarea";
