import React from "react";
import RitualsAgenda from "@/components/dashboard/RitualsAgenda";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";

const GovernancaRituais: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Governanca e Rituais"
        subtitle="Agenda executiva, decisoes registradas e pendencias."
        badges={[
          { label: "Ritual semanal ativo", variant: "secondary" },
          { label: "2 pendencias criticas", variant: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoStat label="Reunioes do mes" value="6 rituais" helper="Operacional e executivo" />
        <InfoStat label="Decisoes recentes" value="18 registros" helper="Ultimos 30 dias" />
        <InfoStat label="Pendencias" value="5 itens" helper="2 atrasadas" tone="warning" />
      </div>
      <RitualsAgenda />
    </div>
  );
};

export default GovernancaRituais;
