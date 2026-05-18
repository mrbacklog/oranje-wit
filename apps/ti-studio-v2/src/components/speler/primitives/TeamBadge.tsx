interface TeamBadgeProps {
  variant: "huidig" | "indeling" | "leeg";
  naam?: string;
  onClick?: () => void;
}

export function TeamBadge({ variant, naam, onClick }: TeamBadgeProps) {
  if (variant === "leeg") {
    return (
      <span
        className="tb-plus"
        onClick={onClick}
        style={{
          color: "var(--indeling-text)",
          border: "1px dashed var(--indeling-border)",
          borderRadius: 3,
          padding: "1px 5px",
          fontSize: "inherit",
          fontWeight: 600,
          cursor: onClick ? "pointer" : "default",
          whiteSpace: "nowrap",
        }}
      >
        + Indeling
      </span>
    );
  }

  if (variant === "indeling") {
    return (
      <span
        className="tb-i"
        onClick={onClick}
        style={{
          color: "var(--indeling-text)",
          border: "1px solid var(--indeling-border)",
          borderRadius: 3,
          padding: "1px 5px",
          background: "var(--indeling-bg)",
          fontSize: "inherit",
          fontWeight: 600,
          cursor: onClick ? "pointer" : "default",
          whiteSpace: "nowrap",
        }}
      >
        {naam ?? "—"}
      </span>
    );
  }

  // huidig
  return (
    <span
      className="tb"
      onClick={onClick}
      style={{
        color: "var(--team-text)",
        border: "1px solid var(--team-border)",
        borderRadius: 3,
        padding: "1px 5px",
        fontSize: "inherit",
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
    >
      {naam ?? "—"}
    </span>
  );
}
