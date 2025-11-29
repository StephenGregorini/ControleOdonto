import React from "react";

export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-slate-900/80 border border-white/10 p-4 " + className
      }
    >
      {children}
    </div>
  );
}
