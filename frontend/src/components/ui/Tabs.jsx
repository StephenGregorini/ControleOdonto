// frontend/src/components/ui/Tabs.jsx
import React from "react";

export default function Tabs({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-1.5 text-xs sm:text-sm rounded-full whitespace-nowrap transition ${
              active
                ? "bg-sky-500/15 text-sky-200 border border-sky-500/60 shadow-sm shadow-sky-900/40"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/70"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-4 -bottom-[2px] h-[2px] rounded-full bg-sky-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}