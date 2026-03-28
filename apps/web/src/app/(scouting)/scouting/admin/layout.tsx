import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/scouting/db/prisma";
import Link from "next/link";

// Prisma 7 type recursion workaround
const db = prisma as any;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Check TC-rol
  const scout = await db.scout.findUnique({
    where: { email: session.user.email },
    select: { rol: true },
  });

  if (!scout || scout.rol !== "TC") {
    redirect("/scouting");
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Admin header */}
      <header className="bg-surface-card border-b border-white/10 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Terug naar dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold">Admin</h1>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/scouting/admin/raamwerk"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Raamwerk
            </Link>
          </nav>
        </div>
      </header>

      {/* Admin content */}
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
