import React, { useState, useMemo } from "react";
import { useDashboard } from "../DashboardContext";
import { formatMesRef } from "../utils/formatters";
import ExportModal from "../components/ui/ExportModal";

// Helper function to generate month list
const generateMonths = (startDate, endDate) => {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];
  
  // Set to the first day of the month to avoid timezone issues
  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      value: monthStr,
      // Formatting for display, e.g., "Jan/2023"
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(current),
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Reverse to show most recent first, which is more common
  return months.reverse();
};


export default function DashboardHeader({ onExport }) {
  const { profile, dados, clinicaId } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const periodo = dados?.filtros?.periodo;
  const contexto = dados?.contexto;

  const availableMonths = useMemo(() => {
    return generateMonths(periodo?.min_mes_ref, periodo?.max_mes_ref)
  }, [periodo]);

  // This function will be called from the modal
  const handleConfirmExport = (exportOptions) => {
    console.log("Iniciando exportação com opções:", exportOptions);
    // The original onExport function is called here with the new options
    onExport(exportOptions);
    setIsModalOpen(false); // Close modal after starting
  };

  return (
    <>
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
            onClick={() => setIsModalOpen(true)} 
            className="mt-2 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 text-sm"
          >
            Exportar para XLSX
          </button>
        </div>
      </header>
      <ExportModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExport={handleConfirmExport}
        availableMonths={availableMonths}
        defaultClinicaId={clinicaId}
      />
    </>
  );
}
