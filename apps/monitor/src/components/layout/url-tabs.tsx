"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

interface TabConfig {
  id: string;
  label: string;
  beschrijving?: string;
  content: ReactNode;
}

interface URLTabsProps {
  tabs: TabConfig[];
  /** Welk tab-id als default (zonder ?tab= param). Default: eerste tab. */
  defaultTab?: string;
}

export function URLTabs({ tabs, defaultTab }: URLTabsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const fallback = defaultTab ?? tabs[0]?.id ?? "";
  const tabParam = params.get("tab") || fallback;
  const activeTab = tabs.some((t) => t.id === tabParam) ? tabParam : fallback;

  function setTab(id: string) {
    const url = new URL(window.location.href);
    if (id === fallback) {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", id);
    }
    router.push(url.pathname + url.search, { scroll: false });
  }

  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <>
      <div role="tablist" className="bg-surface-sunken mb-6 flex gap-1 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
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

      {active?.beschrijving && (
        <p className="text-text-muted mb-6 text-sm">{active.beschrijving}</p>
      )}

      <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {active?.content}
      </div>
    </>
  );
}
