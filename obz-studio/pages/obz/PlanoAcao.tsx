import React from "react";
import ActionPlanTable from "@/components/dashboard/ActionPlanTable";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";
import { actionPlanData } from "@/data/action-plan-data";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const PlanoAcao: React.FC = () => {
  const [actions] = useLocalStorageState("obz.action-plan.v1", actionPlanData);
  const totalAcoes = actions.length;
  const atrasadas = actions.filter((item) => item.status === "Atrasado").length;
  const impacto = actions.reduce((acc, item) => acc + item.impactoEstimado, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de Acao Estruturado"
        subtitle="Carteira de iniciativas com macro etapas, responsaveis e impactos."
        badges={[
          { label: `${totalAcoes} acoes ativas`, variant: "secondary" },
          { label: `${atrasadas} atrasadas`, variant: atrasadas ? "warning" : "success" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Impacto estimado" value={`R$ ${Math.round(impacto / 1000000)}M`} helper="Saving potencial" />
        <InfoStat label="Acoes em execucao" value="19 iniciativas" helper="Macro etapa 2 e 3" />
        <InfoStat label="Ritual proximo" value="Comite operacional" helper="Segunda-feira 08:30" />
      </div>
      <ActionPlanTable />
    </div>
  );
};

export default PlanoAcao;
