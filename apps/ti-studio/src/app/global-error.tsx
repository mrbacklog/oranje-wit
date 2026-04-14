"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <head>
        <title>Fout — TI Studio</title>
      </head>
      <body
        style={{
          margin: 0,
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 640,
            width: "100%",
            padding: 32,
            background: "#141414",
            borderRadius: 12,
            border: "1px solid rgba(255,107,0,.3)",
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️ TI Studio — Fout</div>
          <p style={{ color: "#a3a3a3", fontSize: 14, marginBottom: 24 }}>
            Er is een onverwachte fout opgetreden. Stuur onderstaande informatie door aan de
            ontwikkelaar.
          </p>

          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #262626",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              fontFamily: "monospace",
              fontSize: 12,
              wordBreak: "break-word",
            }}
          >
            <div style={{ color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>
              {error?.name}: {error?.message}
            </div>
            {error?.digest && (
              <div style={{ color: "#6b7280", marginBottom: 8 }}>Digest: {error.digest}</div>
            )}
            {error?.stack && (
              <details>
                <summary style={{ color: "#9ca3af", cursor: "pointer", marginBottom: 8 }}>
                  Stack trace
                </summary>
                <pre
                  style={{
                    color: "#d1d5db",
                    fontSize: 11,
                    overflow: "auto",
                    maxHeight: 300,
                    marginTop: 8,
                  }}
                >
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={reset}
            style={{
              background: "#ff6b00",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      </body>
    </html>
  );
}
