import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Select({
  label,
  options = [],
  value,
  onChange,
  loading,
  searchable = false,
  searchPlaceholder = "Buscar...",
  ...props
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const term = query.trim().toLowerCase();
    if (!term) return options;
    const normalize = (txt) =>
      String(txt || "")
        .toLowerCase()
        .replace(/[.\-\/\s]/g, "");
    const termNorm = normalize(term);
    return options.filter((opt) => {
      const label = String(opt.label || "");
      return (
        label.toLowerCase().includes(term) ||
        normalize(label).includes(termNorm)
      );
    });
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (!rootRef.current || rootRef.current.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (searchable) {
    const selected = options.find((opt) => String(opt.value) === String(value));
    return (
      <div ref={rootRef} className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-[11px] text-slate-400 uppercase tracking-wide">
            {label}
          </label>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => setOpen((prev) => !prev)}
          className={
            "rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 w-full flex items-center justify-between " +
            (props.className || "")
          }
        >
          <span className="truncate">
            {loading ? "Carregando..." : selected?.label || "Selecione"}
          </span>
          <span className="text-slate-500">▾</span>
        </button>

        {open && (
          <div className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg p-2 z-50 backdrop-blur">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 w-full"
            />

            <div className="mt-2 max-h-56 overflow-y-auto">
              {filteredOptions.length === 0 && (
                <span className="text-[11px] text-slate-500 px-2 py-2 block">
                  Nenhum resultado encontrado.
                </span>
              )}
              {filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-100 hover:bg-slate-800/70 rounded-lg"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

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
