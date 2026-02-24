import React from "react";

const colorClasses = {
  emerald: "text-emerald-300",
  rose: "text-rose-300",
  sky: "text-sky-300",
  amber: "text-amber-300",
};

export default function Kpi({ label, value, description, color }) {
  const accentClass = color ? colorClasses[color] : "text-slate-50";

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-md shadow-slate-900/20 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs mb-1">{label}</p>
          <p className={`text-2xl font-semibold ${accentClass}`}>
            {value}
          </p>
        </div>
      </div>
      {description && (
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{description}</p>
      )}
    </div>
  );
}
