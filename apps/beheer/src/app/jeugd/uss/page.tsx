export default function UssPage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          USS-parameters
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Geunificeerde Score Schaal configuratie per seizoen
        </p>
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-5 py-4">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Configureer de USS-parameters (sMax, k, l0) en A-categorie USS-waarden per seizoen. De
            USS verbindt scouting-scores, evaluaties en teamratings in een enkele schaal (0-200).
          </p>
        </div>
      </div>
    </div>
  );
}
