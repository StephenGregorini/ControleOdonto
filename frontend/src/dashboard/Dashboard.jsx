import React from "react";
import { useDashboard } from "../DashboardContext";
import DashboardHeader from "./DashboardHeader";
import DashboardFilters from "./DashboardFilters";
import Overview from "./Overview";
import DecisaoCredito from "./DecisaoCredito";
import Comportamento from "./Comportamento";
import Carteira from "./Carteira";
import SidebarLimite from "./SidebarLimite";
import Tabs from "../components/ui/Tabs";

const TABS = [
  { id: "overview", label: "Visão Geral" },
  { id: "decisao", label: "Decisão de Crédito" },
  { id: "comportamento", label: "Comportamento" },
  { id: "carteira", label: "Carteira" },
];

export default function Dashboard() {
  const { 
    dados, 
    loadingDashboard, 
    erro, 
    panelLimiteAberto, 
    setPanelLimiteAberto, 
    activeTab, 
    setActiveTab 
  } = useDashboard();

  return (
    <div className="w-full space-y-8">
      <DashboardHeader />
      <DashboardFilters />
      
      <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

      {loadingDashboard && <p>Carregando...</p>}
      {erro && <p className="text-rose-400">{erro}</p>}

      {dados && !loadingDashboard && !erro && (
        <>
          {activeTab === "overview" && <Overview />}
          {activeTab === "decisao" && <DecisaoCredito />}
          {activeTab === "comportamento" && <Comportamento />}
          {activeTab === "carteira" && <Carteira />}
        </>
      )}

      <SidebarLimite
        open={panelLimiteAberto}
        onClose={() => setPanelLimiteAberto(false)}
      />
    </div>
  );
}
