import React from "react";
import PvmTable from "@/components/dashboard/PvmTable";
import PvmChart from "@/components/dashboard/PvmChart";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";
import { pvmData } from "@/data/pvm-data";

const AnaliseDesvio: React.FC = () => {
  const totalImpacto = pvmData.reduce((acc, item) => acc + item.impactoTotal, 0);
  const topConta = [...pvmData].sort((a, b) => b.impactoTotal - a.impactoTotal)[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analise de Desvio Preco x Volume"
        subtitle="Drivers de variacao por conta e impacto total no OBZ."
        badges={[
          { label: "Periodo Jan-Jun 2025", variant: "secondary" },
          { label: "Atualizado hoje", variant: "outline" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Impacto total" value={`R$ ${Math.round(totalImpacto / 1000)}k`} helper="Soma do semestre" />
        <InfoStat label="Conta mais critica" value={topConta?.conta ?? "-"} helper="Maior impacto total" tone="warning" />
        <InfoStat label="Mix negativo" value="2 contas" helper="Requer revisao imediata" tone="critical" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PvmTable />
        <PvmChart />
      </div>
    </div>
  );
};

export default AnaliseDesvio;
