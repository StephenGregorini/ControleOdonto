import React from "react";
import PhasingChart from "@/components/dashboard/PhasingChart";
import DREImpactWaterfallChart from "@/components/dashboard/DREImpactWaterfallChart";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";

const PhasingGanho: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Phasing do Ganho e Impacto no DRE"
        subtitle="Curva mensal de implantacao e captura validada."
        badges={[
          { label: "Maturidade 63%", variant: "success" },
          { label: "Captura esperada Q3", variant: "secondary" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Planejado 2025" value="R$ 12,8M" helper="Saving anual" />
        <InfoStat label="Implantado ate agora" value="R$ 7,9M" helper="62% do plano" tone="success" />
        <InfoStat label="Capturado no DRE" value="R$ 6,4M" helper="50% do plano" tone="warning" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhasingChart />
        <DREImpactWaterfallChart />
      </div>
    </div>
  );
};

export default PhasingGanho;
