"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Piramide", "Detail"] as const;

interface SamenstellingTabsProps {
  piramideContent: ReactNode;
  detailContent: ReactNode;
}

export function SamenstellingTabs({ piramideContent, detailContent }: SamenstellingTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Piramide");

  return (
    <>
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Piramide" && piramideContent}
      {activeTab === "Detail" && detailContent}
    </>
  );
}
