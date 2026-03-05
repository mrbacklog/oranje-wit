import { signIn } from "@oranje-wit/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-orange-600">Evaluatie — Admin</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
          >
            Inloggen met Google
          </button>
        </form>
      </div>
    </main>
  );
}
