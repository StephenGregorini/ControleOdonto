import React from "react";

export default function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[11px] text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        {...props}
        className={
          "rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 " +
          (props.className || "")
        }
      />
    </div>
  );
}
