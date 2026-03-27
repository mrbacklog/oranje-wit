import SessionProvider from "@/components/providers/SessionProvider";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--surface-page)" }}>
        <header
          className="border-b px-6 py-3"
          style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
        >
          <nav className="flex items-center gap-6">
            <span className="text-ow-oranje font-bold">Evaluatie</span>
            <Link href="/admin" className="text-text-secondary hover:text-text-primary text-sm">
              Rondes
            </Link>
            <Link
              href="/admin/coordinatoren"
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              Coördinatoren
            </Link>
            <Link
              href="/admin/templates"
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              E-mail templates
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
