import { signIn } from "@oranje-wit/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div
        className="w-full max-w-sm rounded-lg border p-8 shadow-sm"
        style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
      >
        <h1 className="text-ow-oranje mb-6 text-center text-xl font-bold">Evaluatie — Admin</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="bg-ow-oranje hover:bg-ow-oranje-dark w-full rounded-md px-4 py-2 text-white"
          >
            Inloggen met Google
          </button>
        </form>
      </div>
    </main>
  );
}
