"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

const TABS = [
  { id: "piramide", label: "Piramide" },
  { id: "detail", label: "Detail" },
  { id: "heatmap", label: "Historie" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SamenstellingTabsProps {
  piramideContent: ReactNode;
  detailContent: ReactNode;
  heatmapContent: ReactNode;
  defaultTab?: string;
}

export function SamenstellingTabs({
  piramideContent,
  detailContent,
  heatmapContent,
  defaultTab,
}: SamenstellingTabsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab") || defaultTab || "piramide";
  const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "piramide";

  function setTab(id: TabId) {
    const url = new URL(window.location.href);
    if (id === "piramide") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", id);
    }
    router.push(url.pathname + url.search, { scroll: false });
  }

  const content: Record<TabId, ReactNode> = {
    piramide: piramideContent,
    detail: detailContent,
    heatmap: heatmapContent,
  };

  return (
    <>
      <div role="tablist" className="bg-surface-sunken mb-6 flex gap-1 rounded-lg p-1">
        {TABS.map((tab) => (
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

      <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {content[activeTab]}
      </div>
    </>
  );
}
