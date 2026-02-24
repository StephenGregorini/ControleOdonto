// /dashboard/Dashboard.jsx
import React from "react";
import { useDashboard } from "../DashboardContext";
import DashboardHeader from "./DashboardHeader";
import DashboardFilters from "./DashboardFilters";
import Overview from "./Overview";
import DecisaoCredito from "./DecisaoCredito";
import Comportamento from "./Comportamento";
import Carteira from "./Carteira";
import Limites from "./Limites";
import QualidadeDados from "./QualidadeDados";
import Tabs from "../components/ui/Tabs";
import { API_BASE_URL } from "../apiConfig";
import { useEffect } from "react";
import PageLayout from "../components/ui/PageLayout";
import Card from "../components/ui/Card";
import { formatMesRef } from "../utils/formatters";


const TABS = [
  { id: "overview", label: "Visão Geral" },
  { id: "qualidade", label: "Qualidade dos Dados" },
  { id: "limites", label: "Limites" },
  { id: "decisao", label: "Decisão de Crédito" },
  { id: "comportamento", label: "Comportamento" },
  { id: "carteira", label: "Carteira" },
];

export default function Dashboard() {
  const { 
    dados,
    loadingDashboard,
    erro,
    activeTab,
    setActiveTab,
    clinicaId // 🔥 AGORA IMPORTADO CORRETAMENTE
  } = useDashboard();

  useEffect(() => {
  if (dados) {
    window.dados_debug = dados;  // 🔥 joga no escopo global
    console.log("DEBUG GLOBAL ATUALIZADO:", window.dados_debug);
  }
}, [dados]);


  const handleExport = async (exportOptions) => {
    try {
      const response = await fetch(`${API_BASE_URL}/export-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportOptions),
      });

      if (!response.ok) {
        throw new Error("Failed to export data.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dashboard_data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Erro ao exportar dados: " + error.message);
    }
  };

  return (
    <PageLayout>
      <div className="w-full space-y-8">

        <DashboardHeader onExport={handleExport} />

        {dados && (
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Período visual (filtros do dashboard)
                </p>
                <p className="text-sm text-slate-200">
                  Solicitado:{" "}
                  <span className="text-sky-300 font-medium">
                    {formatMesRef(dados.filtros?.periodo?.solicitado_min)} —{" "}
                    {formatMesRef(dados.filtros?.periodo?.solicitado_max)}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Afeta apenas KPIs e gráficos. O limite sugerido não muda com esses filtros.
                </p>
                {Array.isArray(dados.filtros?.periodo?.meses_faltantes) &&
                  dados.filtros.periodo.meses_faltantes.length > 0 && (
                    <p className="text-[11px] text-amber-300">
                      Meses sem dados no período:{" "}
                      {dados.filtros.periodo.meses_faltantes
                        .slice(0, 4)
                        .map((m) => formatMesRef(m))
                        .join(", ")}
                      {dados.filtros.periodo.meses_faltantes.length > 4
                        ? "…"
                        : ""}
                    </p>
                  )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Motor de limite sugerido
                </p>
                {clinicaId && clinicaId !== "todas" ? (
                  <>
                    <p className="text-sm text-slate-200">
                      Regra: mês fechado anterior ao upload mais recente.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Upload mais recente:{" "}
                      <span className="text-slate-200">
                        {formatMesRef(dados.limite_motor?.mes_upload_referencia)}
                      </span>{" "}
                      · Mês fechado da regra:{" "}
                      <span className="text-slate-200">
                        {formatMesRef(dados.limite_motor?.mes_ref_regra)}
                      </span>{" "}
                      · Último mês com dados usado:{" "}
                      <span className="text-slate-200">
                        {formatMesRef(dados.limite_motor?.mes_ref_base)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Selecione uma clínica para ver a referência de cálculo do limite.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <DashboardFilters />

        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

        {loadingDashboard && <p>Carregando...</p>}
        {erro && <p className="text-rose-400">{erro}</p>}

        {/* QUALIDADE DOS DADOS (não depende do 'dados' principal) */}
        {activeTab === "qualidade" && <QualidadeDados />}

        {dados && !loadingDashboard && !erro && (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && <Overview />}

            {/* LIMITES */}
            {activeTab === "limites" && <Limites />}

            {/* DECISÃO DE CRÉDITO */}
            {activeTab === "decisao" && clinicaId && clinicaId !== "todas" && (
              <DecisaoCredito />
            )}

            {activeTab === "decisao" && (!clinicaId || clinicaId === "todas") && (
              <p className="text-slate-400 text-sm">
                Selecione uma clínica específica para visualizar a decisão de crédito.
              </p>
            )}

            {/* COMPORTAMENTO */}
            {activeTab === "comportamento" && <Comportamento />}

            {/* CARTEIRA */}
            {activeTab === "carteira" && <Carteira />}
          </>
        )}
      </div>
    </PageLayout>
  );
}
