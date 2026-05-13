"use client";

export default function MemoError({ error }: { error: Error }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "var(--text-tertiary)",
        fontSize: 13,
      }}
    >
      <p style={{ color: "#ef4444", fontWeight: 600 }}>Fout bij laden memo&apos;s</p>
      <p style={{ marginTop: 8 }}>{error.message}</p>
    </div>
  );
}
