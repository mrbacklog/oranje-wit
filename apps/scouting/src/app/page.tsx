import { redirect } from "next/navigation";
import { auth } from "@oranje-wit/auth";
import { signIn } from "@oranje-wit/auth";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/zoek");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--ow-oranje)] shadow-lg">
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
          <h1 className="text-2xl font-bold tracking-tight">OW Scout</h1>
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
            className="w-full rounded-xl bg-[var(--ow-oranje)] px-6 py-3 font-semibold text-white transition-transform hover:brightness-110 active:scale-95"
          >
            Inloggen met Google
          </button>
        </form>

        <p className="max-w-xs text-xs text-neutral-400">
          Scout spelers, bouw spelerskaarten en verdien badges.
        </p>
      </div>
    </main>
  );
}
