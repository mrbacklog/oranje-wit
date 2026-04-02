"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface OpvolgingTabsProps {
  tabs: Tab[];
  children: (activeTab: string) => React.ReactNode;
}

export default function OpvolgingTabs({ tabs, children }: OpvolgingTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  return (
    <div>
      {/* Tab nav */}
      <div
        className="mb-4 flex gap-1 rounded-lg p-1"
        style={{ background: "var(--bg-secondary, #141414)" }}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            style={{
              color:
                activeTab === tab.id ? "var(--text-primary, #fafafa)" : "var(--text-muted, #666)",
            }}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="opvolging-tab-indicator"
                className="absolute inset-0 rounded-md"
                style={{ background: "var(--bg-tertiary, #1e1e1e)" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                style={{ background: "var(--ow-accent, #FF6B00)", color: "#fff" }}
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">{children(activeTab)}</div>
    </div>
  );
}
