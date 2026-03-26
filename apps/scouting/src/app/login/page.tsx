import { signIn } from "@oranje-wit/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
          style={{ backgroundColor: "#FF6B00" }}
        >
          <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 text-white" aria-hidden="true">
            <circle cx="24" cy="18" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path
              d="M24 28c-8 0-14 4-14 9v3h28v-3c0-5-6-9-14-9z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">OW Scout</h1>
          <p className="mt-1 text-sm text-neutral-500">Scouting voor c.k.v. Oranje Wit</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/zoek" });
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full rounded-xl px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: "#FF6B00" }}
          >
            Inloggen met Google
          </button>
        </form>

        <p className="max-w-xs text-xs text-neutral-400">
          Alleen geautoriseerde scouts kunnen inloggen. Neem contact op met de TC als je toegang
          nodig hebt.
        </p>
      </div>
    </main>
  );
}
