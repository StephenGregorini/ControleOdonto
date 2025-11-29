import React from "react";

export default function Section({ title, children, className = "" }) {
  return (
    <section className={"flex flex-col gap-3 " + className}>
      {title && (
        <h2 className="text-slate-300 text-sm font-semibold tracking-wide">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
