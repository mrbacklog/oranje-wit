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
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="px-4 py-3 border-t border-gray-100">
        <a
          href="/login"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Inloggen
        </a>
      </div>
    );
  }

  const { name, role } = session.user;

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500">
            {role ? rolLabels[role] || role : "Viewer"}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-2"
          title="Uitloggen"
        >
          Uit
        </button>
      </div>
    </div>
  );
}
