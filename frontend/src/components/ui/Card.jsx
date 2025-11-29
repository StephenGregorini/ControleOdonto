import React from "react";

export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-slate-900/90 border border-slate-800 p-4 " + className
      }
    >
      {children}
    </div>
  );
}
