import { SportlinkTabs } from "@/components/sportlink/SportlinkTabs";

export const dynamic = "force-dynamic";

export default function SportlinkPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 24,
          color: "var(--text-1, #fafafa)",
        }}
      >
        Sportlink
      </h1>
      <SportlinkTabs />
    </div>
  );
}
