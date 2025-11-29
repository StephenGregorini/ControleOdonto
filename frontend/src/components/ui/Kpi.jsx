import React from "react";

export default function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>

      <span className="text-2xl font-semibold text-slate-100">{value}</span>

      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </div>
  );
}
