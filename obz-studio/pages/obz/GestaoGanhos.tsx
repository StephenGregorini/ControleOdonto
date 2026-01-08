import React from "react";
import GainsSavingTable from "@/components/dashboard/GainsSavingTable";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";
import { gainsSavingData } from "@/data/gains-saving-data";

const GestaoGanhos: React.FC = () => {
  const totalSaving = gainsSavingData.reduce((acc, item) => acc + item.savingAnualizado, 0);
  const gap = gainsSavingData.reduce((acc, item) => acc + item.gapCaptura, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Ganhos e Saving"
        subtitle="Controle de ganhos com evidencia e captura real no DRE."
        badges={[
          { label: "Regra: ganho so conta com evidencia", variant: "secondary" },
          { label: "Auditoria mensal", variant: "outline" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Saving anualizado" value={`R$ ${Math.round(totalSaving / 1000000)}M`} helper="Carteira atual" />
        <InfoStat label="Gap de captura" value={`R$ ${Math.round(gap / 1000000)}M`} helper="Necessita evidencias" tone="warning" />
        <InfoStat label="Acoes validadas" value="14 iniciativas" helper="Comprovadas no DRE" tone="success" />
      </div>
      <GainsSavingTable />
    </div>
  );
};

export default GestaoGanhos;
