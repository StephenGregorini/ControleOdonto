import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardFilters from "./DashboardFilters";
import Overview from "./Overview";
import DecisaoCredito from "./DecisaoCredito";
import Comportamento from "./Comportamento";
import Carteira from "./Carteira";
import SidebarLimite from "./SidebarLimite";


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [limiteAberto, setLimiteAberto] = useState(false);

  return (
    <div className="w-full space-y-8">
      <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <DashboardFilters />

      {activeTab === "overview" && (
        <Overview onAbrirLimite={() => setLimiteAberto(true)} />
      )}

      {activeTab === "decisao" && (
        <DecisaoCredito onAbrirLimite={() => setLimiteAberto(true)} />
      )}

      {activeTab === "comportamento" && <Comportamento />}

      {activeTab === "carteira" && <Carteira />}

      {limiteAberto && (
        <SidebarLimite
          open={limiteAberto}
          onClose={() => setLimiteAberto(false)}
        />
      )}
    </div>
  );
}
