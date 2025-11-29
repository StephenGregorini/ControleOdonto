import React from "react";

export default function Select({
  label,
  options = [],
  value,
  onChange,
  loading,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[11px] text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={
          "rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 w-full " +
          (props.className || "")
        }
      >
        {loading && <option>Carregando...</option>}
        {!loading && options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
