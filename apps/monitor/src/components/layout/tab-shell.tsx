"use client";

import { useState, type ReactNode } from "react";

interface TabConfig<T extends string> {
  label: T;
  beschrijving: string;
  content: ReactNode;
}

interface TabShellProps<T extends string> {
  tabs: TabConfig<T>[];
}

export function TabShell<T extends string>({ tabs }: TabShellProps<T>) {
  const [activeTab, setActiveTab] = useState<T>(tabs[0].label);

  const active = tabs.find((t) => t.label === activeTab) ?? tabs[0];

  return (
    <>
      <div role="tablist" className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            id={`tab-${tab.label.toLowerCase()}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.label
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mb-6 text-sm text-gray-500">{active.beschrijving}</p>

      <div role="tabpanel" aria-labelledby={`tab-${activeTab.toLowerCase()}`}>
        {active.content}
      </div>
    </>
  );
}
