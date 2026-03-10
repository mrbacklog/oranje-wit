interface AfmeldBadgeProps {
  afmelddatum: string;
  variant?: "compact" | "full";
}

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString("nl-NL", { month: "short", year: "numeric" });
}

export default function AfmeldBadge({ afmelddatum, variant = "compact" }: AfmeldBadgeProps) {
  const datum = new Date(afmelddatum);
  const isVerleden = datum < new Date();

  const title = isVerleden
    ? `Afgemeld per ${formatDatum(datum)}`
    : `Afmelding gepland: ${formatDatum(datum)}`;

  const kleur = isVerleden ? "text-red-600 bg-red-50" : "text-orange-600 bg-orange-50";

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex shrink-0 items-center rounded-full p-0.5 ${kleur}`}
        title={title}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          {isVerleden ? (
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ) : (
            <>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M6 3.5V6l2 1.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-tight font-medium ${kleur}`}
      title={title}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {isVerleden ? (
          <path
            d="M3 3l6 6M9 3l-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ) : (
          <>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M6 3.5V6l2 1.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {formatDatum(datum)}
    </span>
  );
}
