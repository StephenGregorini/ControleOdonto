import React from "react";

export default function Tabs({ value, onChange, items }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={
              "relative px-3 py-1.5 text-sm rounded-full transition " +
              (active
                ? "bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5")
            }
          >
            {it.label}
            {active && (
              <span className="absolute inset-x-4 -bottom-[2px] h-[2px] rounded-full bg-sky-500"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
