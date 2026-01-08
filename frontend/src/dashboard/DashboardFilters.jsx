import React from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../DashboardContext";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import { formatMesRef } from "../utils/formatters";

export default function DashboardFilters() {
  const {
    clinicas,
    loadingClinicas,
    clinicaId,
    setClinicaId,
    periodoInicio,
    setPeriodoInicio,
    periodoFim,
    setPeriodoFim,
    dados,
  } = useDashboard();

  const navigate = useNavigate();

  const handleClinicaChange = (newClinicaId) => {
    setClinicaId(newClinicaId);
    const newSearch =
      newClinicaId === "todas" ? "" : `?clinica=${newClinicaId}`;
    navigate(`/admin/dashboard${newSearch}`, { replace: true });
  };

  const listaClinicas = Array.isArray(clinicas) ? clinicas : [];
  const formatClinicaLabel = (clinica) => {
    const codigo = clinica.codigo_clinica || clinica.nome || "";
    const nome = clinica.nome || "";
    const cnpj = clinica.cnpj || "";
    const base = nome ? `${codigo} · ${nome}` : codigo;
    return cnpj ? `${base} — ${cnpj}` : base;
  };

  const periodoCustom = !!(periodoInicio && periodoFim);

  const periodoMin = dados?.filtros?.periodo?.min_mes_ref;
  const periodoMax = dados?.filtros?.periodo?.max_mes_ref;
  const disponivelMin = dados?.filtros?.periodo?.disponivel_min;
  const disponivelMax = dados?.filtros?.periodo?.disponivel_max;
  const mesesFaltantes = dados?.filtros?.periodo?.meses_faltantes || [];

  return (
    <Card className="p-6 mb-6">
      {/* TÍTULO */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Filtros do Painel
        </h2>

        <div className="text-[11px] text-slate-500">
          {periodoMin && periodoMax ? (
            <>
              Período solicitado:{" "}
              <span className="text-sky-300 font-medium">
                {formatMesRef(periodoMin)} — {formatMesRef(periodoMax)}
              </span>
            </>
          ) : (
            "Carregando período..."
          )}
          {disponivelMin && disponivelMax && (
            <div className="text-[10px] text-slate-400 mt-1">
              Meses com dados: {formatMesRef(disponivelMin)} — {formatMesRef(disponivelMax)}
            </div>
          )}
          {mesesFaltantes.length > 0 && (
            <div className="text-[10px] text-amber-400 mt-1">
              {mesesFaltantes.length} mês(es) sem dados no período.
            </div>
          )}
          <div className="text-[10px] text-slate-400 mt-1">
            Filtros afetam apenas a visão do período. O limite sugerido usa mês fechado.
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ======================= */}
        {/* CLÍNICA */}
        {/* ======================= */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Código da clínica
          </span>

          <Select
            value={clinicaId ?? "todas"}
            onChange={handleClinicaChange}
            loading={loadingClinicas}
            searchable
            searchPlaceholder="Buscar código, nome ou CNPJ..."
            options={[
              { label: "Todas as clínicas", value: "todas" },
              ...listaClinicas.map((c) => ({
                label: formatClinicaLabel(c),
                value: c.id,
              })),
            ]}
          />

          {loadingClinicas && (
            <span className="text-[10px] text-slate-500">Carregando...</span>
          )}
        </div>

        {/* ======================= */}
        {/* PERÍODO PERSONALIZADO */}
        {/* ======================= */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Período personalizado
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-500">De</label>
              <input
                type="month"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-500">Até</label>
              <input
                type="month"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <span className="text-[10px] text-slate-500 mt-1">
            Selecione mês/ano inicial e final para filtrar.
          </span>

          {periodoCustom && (
            <button
              onClick={() => {
                setPeriodoInicio("");
                setPeriodoFim("");
              }}
              className="mt-2 w-full px-3 py-1.5 rounded-md text-xs border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            >
              Limpar período
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
