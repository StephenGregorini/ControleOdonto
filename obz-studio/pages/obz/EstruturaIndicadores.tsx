import React from "react";
import IndicatorTree from "@/components/dashboard/IndicatorTree";
import { indicatorData } from "@/data/indicator-data";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";

const EstruturaIndicadores: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estrutura de Indicadores OBZ"
        subtitle="Arvore hierarquica do resultado ate contratos e fornecedores."
        badges={[
          { label: "Ciclo OBZ 2025", variant: "secondary" },
          { label: "63% capturado", variant: "success" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Resultado OBZ" value="R$ 12,8M" helper="Meta anual" />
        <InfoStat label="Desvio atual" value="+5,9%" helper="Gasto acima do planejado" tone="warning" />
        <InfoStat label="Responsaveis ativos" value="28 lideres" helper="Gestores por unidade" />
      </div>
      <IndicatorTree indicator={indicatorData} />
    </div>
  );
};

export default EstruturaIndicadores;
