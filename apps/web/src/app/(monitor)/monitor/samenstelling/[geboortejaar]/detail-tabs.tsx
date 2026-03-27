"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

const TABS = [
  { id: "overzicht", label: "Actief / Gestopt" },
  { id: "tijdlijn", label: "Tijdlijn" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DetailTabsProps {
  actiefGestoptContent: ReactNode;
  tijdlijnContent: ReactNode;
  defaultTab?: string;
}

export function DetailTabs({ actiefGestoptContent, tijdlijnContent, defaultTab }: DetailTabsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab") || defaultTab || "overzicht";
  const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "overzicht";

  function setTab(id: TabId) {
    const url = new URL(window.location.href);
    if (id === "overzicht") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", id);
    }
    router.push(url.pathname + url.search, { scroll: false });
  }

  return (
    <>
      <div role="tablist" className="bg-surface-sunken mb-6 flex gap-1 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-surface-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === "overzicht" ? actiefGestoptContent : tijdlijnContent}
      </div>
    </>
  );
}
