import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntityNode, EntityStatus } from "@/data/entity-tree";

const statusMap: Record<
  EntityStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  ok: { label: "Estavel", variant: "success" },
  attention: { label: "Sob observacao", variant: "warning" },
  risk: { label: "Critico", variant: "destructive" },
};

const EntityCard: React.FC<{ entity: EntityNode }> = ({ entity }) => {
  const status = entity.status ? statusMap[entity.status] : null;
  return (
    <Card className="mb-4 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{entity.name}</CardTitle>
            <CardDescription>{entity.type}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {entity.type}
            </Badge>
            {status ? (
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Responsavel
            </p>
            <p>{entity.leader}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Centro de custo
            </p>
            <p>{entity.costCenter ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Orcamento anual
            </p>
            <p>{entity.budget ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Headcount
            </p>
            <p>{entity.headcount ?? "—"}</p>
          </div>
        </div>
        {entity.note ? (
          <div className="mt-4 rounded-xl border bg-secondary/40 p-3 text-xs text-muted-foreground">
            {entity.note}
          </div>
        ) : null}
        {entity.children ? (
          <div className="mt-4 rounded-2xl border-l-2 border-primary/20 pl-6">
            {entity.children.map((child) => (
              <EntityCard key={child.id} entity={child} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const EntityTree: React.FC<{ entity: EntityNode }> = ({ entity }) => {
  return <EntityCard entity={entity} />;
};

export default EntityTree;
