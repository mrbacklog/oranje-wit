export default function ProgressiePage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Progressie
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Inside Out meegroei-overzicht per leeftijdsgroep
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
            Visualisatie van het Inside Out meegroei-principe: hoe items en pijlers toenemen van
            Blauw (8 items) naar Rood (56 items). Inclusief de voorloper-ketens tussen banden.
          </p>
        </div>
      </div>
    </div>
  );
}
