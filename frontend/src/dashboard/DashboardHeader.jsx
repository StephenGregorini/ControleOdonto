import React from "react";
import { useDashboard } from "../DashboardContext";
import { formatMesRef } from "../utils/formatters";

export default function DashboardHeader({ onExport }) {
  const { profile, dados } = useDashboard();
  const periodo = dados?.filtros?.periodo;
  const contexto = dados?.contexto;

  return (
    <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      
      {/* Título */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Painel de <span className="text-sky-400">Crédito e Risco</span>
          </h1>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 mt-1">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span>Motor de Crédito MedSimples</span>
          </div>
        </div>

        <p className="text-slate-400 max-w-3xl text-sm sm:text-base mt-2">
          Visão de risco, inadimplência, comportamento e limites recomendados para cada clínica.
        </p>
      </div>

      {/* Infos do canto direito */}
      <div className="text-left lg:text-right text-xs text-slate-400 space-y-0.5 flex-shrink-0">
        <div>
          Período disponível:{" "}
          <span className="font-semibold text-sky-300">
            {periodo?.min_mes_ref ? formatMesRef(periodo.min_mes_ref) : "-"} —{" "}
            {periodo?.max_mes_ref ? formatMesRef(periodo.max_mes_ref) : "-"}
          </span>
        </div>

        <div>
          Contexto:{" "}
          <span className="font-semibold text-slate-100">
            {contexto?.clinica_nome || "-"}
          </span>
        </div>

        <div>
          Usuário:{" "}
          <span className="font-semibold text-slate-100">
            {profile?.nome || profile?.email}
          </span>
        </div>
        <button 
          onClick={onExport} 
          className="mt-2 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 text-sm"
        >
          Exportar para XLSX
        </button>
      </div>
    </header>
  );
}
