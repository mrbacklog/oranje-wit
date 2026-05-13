// Kanban skeleton — 4 lege lanes

export default function MemoLoading() {
  return (
    <div className="kanban-page">
      <div className="kanban-header" style={{ opacity: 0.4 }}>
        <div className="kh-links">
          <div
            style={{
              width: 200,
              height: 28,
              borderRadius: 7,
              background: "var(--surface-card)",
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 24,
                  borderRadius: 6,
                  background: "var(--surface-card)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="kanban-area">
        <div className="kanban-board">
          {["OPEN", "IN_BESPREKING", "GEACCEPTEERD_RISICO", "OPGELOST"].map((s) => (
            <div key={s} className="kanban-lane">
              <div className="lane-header" style={{ opacity: 0.5 }}>
                <span className="lane-dot" style={{ background: "var(--border-default)" }} />
                <span className="lane-title" style={{ color: "var(--text-tertiary)" }}>
                  {s}
                </span>
              </div>
              <div className="lane-body">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 80,
                      borderRadius: 8,
                      background: "var(--surface-card)",
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
