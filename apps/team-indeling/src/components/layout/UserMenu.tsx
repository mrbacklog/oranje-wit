"use client";

import { useSession, signOut } from "next-auth/react";

const rolLabels: Record<string, string> = {
  EDITOR: "TC-lid",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="border-t border-gray-100 px-4 py-3">
        <a href="/login" className="text-sm font-medium text-orange-600 hover:text-orange-700">
          Inloggen
        </a>
      </div>
    );
  }

  const { name, role } = session.user;

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role ? rolLabels[role] || role : "Viewer"}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ml-2 shrink-0 text-xs text-gray-400 transition-colors hover:text-gray-600"
          title="Uitloggen"
        >
          Uit
        </button>
      </div>
    </div>
  );
}
