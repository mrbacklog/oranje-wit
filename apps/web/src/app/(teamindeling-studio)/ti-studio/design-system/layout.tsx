export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      style={{
        backgroundColor: "var(--surface-page, #0f1115)",
        color: "var(--text-primary, #f3f4f6)",
        minHeight: "100dvh",
      }}
    >
      {children}
    </div>
  );
}
