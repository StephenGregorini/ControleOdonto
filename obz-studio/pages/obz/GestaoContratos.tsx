import React from "react";
import ContractList from "@/components/dashboard/ContractList";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";
import { contractData } from "@/data/contract-data";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const GestaoContratos: React.FC = () => {
  const [contracts] = useLocalStorageState("obz.contracts.v1", contractData);
  const totalContratos = contracts.length;
  const alertas = contracts.filter(
    (contract) =>
      contract.alertaConsumo || contract.alertaVencimento || contract.sla === "Não Atendido"
  ).length;
  const totalContratado = contracts.reduce((acc, item) => acc + item.valorContratado, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Contratos Hospitalares"
        subtitle="Monitoramento de SLA, vigencia e desvios financeiros."
        badges={[
          { label: `${totalContratos} contratos ativos`, variant: "secondary" },
          { label: `${alertas} alertas criticos`, variant: alertas ? "warning" : "success" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Valor contratado" value={`R$ ${Math.round(totalContratado / 1000000)}M`} helper="Total anual" />
        <InfoStat label="Contratos em risco" value={`${alertas}`} helper="SLA ou vigencia" tone={alertas ? "critical" : "success"} />
        <InfoStat label="Renegociacao" value="7 contratos" helper="Prioridade imediata" tone="warning" />
      </div>
      <ContractList />
    </div>
  );
};

export default GestaoContratos;
