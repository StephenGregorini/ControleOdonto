// /dashboard/DashboardHeader.jsx
import React from "react";
import { formatMesRef } from "../utils/formatters";

export default function DashboardHeader({ profile, periodo, contexto }) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
      
      {/* Título */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 mb-2 border border-sky-500/40">
          <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
          <span className="text-[11px] uppercase tracking-wide text-sky-200">
            Motor de crédito · MedSimples
          </span>
        </div>

        <h1 className="text-3xl font-semibold text-slate-100">
          Painel de <span className="text-sky-400">crédito e risco</span>
        </h1>

        <p className="text-slate-400 mt-1 text-sm max-w-xl">
          Visão de risco, inadimplência, comportamento e limites recomendados para cada clínica.
        </p>
      </div>

      {/* Infos do canto direito */}
      <div className="text-right text-xs text-slate-400 space-y-0.5">
        <div>
          Período disponível:{" "}
          <span className="text-sky-300">
            {periodo?.min_mes_ref ? formatMesRef(periodo.min_mes_ref) : "-"} —{" "}
            {periodo?.max_mes_ref ? formatMesRef(periodo.max_mes_ref) : "-"}
          </span>
        </div>

        <div>
          Contexto:{" "}
          <span className="text-slate-200">
            {contexto?.clinica_nome || "-"}
          </span>
        </div>

        <div>
          Usuário:{" "}
          <span className="text-slate-200">
            {profile?.nome || profile?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
