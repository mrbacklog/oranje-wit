import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import ReadOnlyBadge from "./_read-only-badge";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>TI Studio v2 — schaduw-app</h1>
      <p style={{ color: "var(--text-secondary)", textAlign: "center", maxWidth: 480 }}>
        Welkom, {String(user?.name ?? user?.email ?? "TC-lid")}. Dit is het skelet van de v2-app.
        Pagina&apos;s worden stap voor stap toegevoegd.
      </p>
      <ReadOnlyBadge />
    </main>
  );
}
