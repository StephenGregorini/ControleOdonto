import React from "react";

export default function SidePanel({ open, onClose, children }) {
  return (
    <div
      className={
        "fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm transition " +
        (open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
      }
    >
      <div
        className={
          "w-full max-w-md h-full bg-slate-900 border-l border-white/10 p-6 overflow-y-auto transition-transform " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <button
          className="text-slate-400 hover:text-white absolute top-4 right-4"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
