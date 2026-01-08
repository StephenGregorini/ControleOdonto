import React from "react";
import EntityTree from "@/components/dashboard/EntityTree";
import PageHeader from "@/components/ui/PageHeader";
import InfoStat from "@/components/ui/InfoStat";
import { entitySummary, entityTree } from "@/data/entity-tree";

const ArvoreEntidades: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Arvore de Entidades"
        subtitle="Estrutura organizacional com hospitais, diretorias e centros de custo."
        badges={[
          { label: `${entitySummary.network} • ${entitySummary.hospitals} hospitais`, variant: "secondary" },
          { label: `${entitySummary.costCenters} centros de custo`, variant: "outline" },
          { label: entitySummary.updatedAt, variant: "success" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoStat
          label="Hospitais monitorados"
          value={String(entitySummary.hospitals)}
          helper="Clientes hipoteticos"
        />
        <InfoStat
          label="Diretorias mapeadas"
          value={String(entitySummary.directorias)}
          helper="Assistencial, administrativa e financeira"
        />
        <InfoStat
          label="Centros de custo"
          value={String(entitySummary.costCenters)}
          helper="Aberturas por unidade"
        />
        <InfoStat
          label="Escopo OBZ"
          value={entitySummary.scopeBudget}
          helper="Orcamento anual consolidado"
          tone="warning"
        />
      </div>
      <EntityTree entity={entityTree} />
    </div>
  );
};

export default ArvoreEntidades;
