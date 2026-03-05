import SessionProvider from "@/components/providers/SessionProvider";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white px-6 py-3">
          <nav className="flex items-center gap-6">
            <span className="font-bold text-orange-600">Evaluatie</span>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              Rondes
            </Link>
            <Link href="/admin/coordinatoren" className="text-sm text-gray-600 hover:text-gray-900">
              Coördinatoren
            </Link>
            <Link href="/admin/templates" className="text-sm text-gray-600 hover:text-gray-900">
              E-mail templates
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
