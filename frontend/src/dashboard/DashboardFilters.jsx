import React from "react";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import { MESES, ANOS } from "../utils/theme";
import { formatMesRef } from "../utils/formatters";

export default function DashboardFilters({
  clinicas = [],
  clinicaId,
  setClinicaId,

  janelaMeses,
  setJanelaMeses,

  inicio,
  fim,
  setInicio,
  setFim,

  loadingClinicas,
  periodoMin,
  periodoMax,
}) {
  // fallback seguro
  const listaClinicas = Array.isArray(clinicas) ? clinicas : [];

  const inicioAno = inicio?.split("-")[0] ?? "";
  const inicioMes = inicio?.split("-")[1] ?? "";

  const fimAno = fim?.split("-")[0] ?? "";
  const fimMes = fim?.split("-")[1] ?? "";

  const periodoCustom = !!(inicio && fim);

  return (
    <Card className="p-6 mb-6">
      {/* Título */}
      <div className="flex items-center justify-between mb-4">
        <h2 classname="text-sm font-semibold text-slate-200">
          Filtros do Painel
        </h2>

        <p className="text-[11px] text-slate-500">
          {periodoMin && periodoMax ? (
            <>
              Dados disponíveis:{" "}
              <span className="text-sky-300 font-medium">
                {formatMesRef(periodoMin)} — {formatMesRef(periodoMax)}
              </span>
            </>
          ) : (
            "Carregando período..."
          )}
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CLÍNICA */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Clínica
          </span>

          <Select
            value={clinicaId}
            onChange={setClinicaId}
            loading={loadingClinicas}
            options={[
              { label: "Todas as clínicas", value: "todas" },
              ...listaClinicas.map((c) => ({
                label: c.nome,
                value: c.id,
              })),
            ]}
          />

          {loadingClinicas && (
            <span className="text-[10px] text-slate-500">Carregando...</span>
          )}
        </div>

        {/* JANELA TEMPORAL */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Janela móvel
          </span>

          <Select
            disabled={periodoCustom}
            value={janelaMeses}
            onChange={setJanelaMeses}
            options={[
              { label: "Últimos 6 meses", value: 6 },
              { label: "Últimos 12 meses", value: 12 },
              { label: "Últimos 24 meses", value: 24 },
            ]}
          />

          {periodoCustom && (
            <span className="text-[10px] text-amber-400">
              Janela desativada: período personalizado ativo.
            </span>
          )}
        </div>

        {/* PERÍODO PERSONALIZADO */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Período personalizado
          </span>

          {/* Linha 1 */}
          <div className="flex items-center gap-3">
            <Select
              value={inicioMes}
              onChange={(mes) => mes && setInicio(`${inicioAno || ANOS[0]}-${mes}`)}
              options={[{ label: "Mês", value: "" }, ...MESES]}
            />

            <Select
              value={inicioAno}
              onChange={(ano) => ano && setInicio(`${ano}-${inicioMes || "01"}`)}
              options={[{ label: "Ano", value: "" }, ...ANOS.map((a) => ({ label: a, value: a }))]}
            />
          </div>

          {/* Linha 2 */}
          <div className="flex items-center gap-3 mt-2">
            <Select
              value={fimMes}
              onChange={(mes) => mes && setFim(`${fimAno || ANOS.at(-1)}-${mes}`)}
              options={[{ label: "Mês", value: "" }, ...MESES]}
            />

            <Select
              value={fimAno}
              onChange={(ano) => ano && setFim(`${ano}-${fimMes || "12"}`)}
              options={[{ label: "Ano", value: "" }, ...ANOS.map((a) => ({ label: a, value: a }))]}
            />
          </div>

          <span className="text-[10px] text-slate-500 mt-1">
            Preencha início e fim para ativar o período personalizado.
          </span>
        </div>
      </div>
    </Card>
  );
}
