import { signIn } from "@oranje-wit/auth";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>TI Studio v2 — Inloggen</h1>
      <p style={{ color: "var(--text-secondary)", textAlign: "center", maxWidth: 420 }}>
        Schaduw-app van c.k.v. Oranje Wit. Log in met je TC-account.
      </p>
      <form
        action={async () => {
          "use server";
          const params = await searchParams;
          await signIn("google", { redirectTo: params.callbackUrl ?? "/" });
        }}
      >
        <button
          type="submit"
          style={{
            background: "var(--ow-oranje, #ff6b00)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Inloggen met Google
        </button>
      </form>
    </main>
  );
}
