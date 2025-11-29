// /dashboard/SidebarLimite.jsx
import React, { useState } from "react";
import { formatCurrency } from "../utils/formatters";

const API = "http://127.0.0.1:8000";

export default function SidebarLimite({
  open,
  setOpen,
  clinicaId,
  dados,
  profile,
  reloadDashboard,
}) {
  const k = dados?.kpis || {};
  const nome = dados?.contexto?.clinica_nome || "-";

  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function salvar() {
    if (!clinicaId || clinicaId === "todas") return;

    try {
      setLoading(true);

      const payload = {
        limite_aprovado: Number(valor),
        observacao: obs || null,
        aprovado_por: profile?.nome || profile?.email || "admin",
      };

      const r = await fetch(`${API}/clinicas/${clinicaId}/limite_aprovado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error("Erro ao salvar");

      await reloadDashboard();
      setOpen(false);

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar limite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex justify-end">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-6 overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-slate-200 text-lg font-semibold">
            Aprovar limite — {nome}
          </h3>
          <button
            onClick={() => !loading && setOpen(false)}
            className="text-slate-500 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        {/* LIMITE ATUAL / SUGERIDO */}
        <div className="mb-6 space-y-3">
          <div>
            <p className="text-slate-400 text-xs">Limite atual</p>
            <p className="text-xl font-semibold text-emerald-300">
              {formatCurrency(k.limite_aprovado)}
            </p>
          </div>

          <div>
            <p className="text-slate-400 text-xs">Sugestão do motor</p>
            <p className="text-xl font-semibold text-sky-300">
              {formatCurrency(k.limite_sugerido)}
            </p>
          </div>
        </div>

        {/* INPUT NOVO VALOR */}
        <div className="space-y-2 mb-6">
          <label className="text-xs text-slate-400">Novo limite (R$)</label>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            type="number"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2"
            placeholder="Ex: 150000"
          />
        </div>

        {/* OBSERVAÇÃO */}
        <div className="space-y-2 mb-6">
          <label className="text-xs text-slate-400">Observação (opcional)</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 text-sm resize-none"
            placeholder="Ex.: aprovado em comitê..."
          />
        </div>

        {/* INFO */}
        <div className="text-[11px] text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl p-3 mb-6">
          <p>
            O limite é um <span className="text-sky-300">teto total</span> de exposição,
            não um valor mensal.
          </p>
        </div>

        {/* AÇÕES */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => !loading && setOpen(false)}
            className="px-3 py-1.5 text-xs rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            disabled={loading}
            onClick={salvar}
            className="px-4 py-2 text-xs rounded-full bg-emerald-600/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-600/30"
          >
            {loading ? "Salvando..." : "Confirmar"}
          </button>
        </div>

      </div>
    </div>
  );
}
