import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ritualsData, type Ritual } from "@/data/rituals-data";
import { Badge } from "@/components/ui/Badge";

const RitualsAgenda: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {ritualsData.map((ritual: Ritual) => (
        <Card key={ritual.id} className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {ritual.nome}
              <Badge variant="secondary">{ritual.frequencia}</Badge>
            </CardTitle>
            <CardDescription>Proxima data: {ritual.proximaData}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-2xl border bg-secondary/40 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Indicadores por ritual
              </h3>
              <ul className="mt-2 space-y-2 text-sm">
                {ritual.indicadoresChave.map((indicator, index) => (
                  <li key={index} className="rounded-lg border bg-white px-3 py-2 shadow-sm">
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4 rounded-2xl border bg-card/80 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Decisoes registradas
              </h3>
              <ul className="mt-2 space-y-2 text-sm">
                {ritual.decisoesRegistradas.map((decision, index) => (
                  <li key={index} className="rounded-lg border bg-white px-3 py-2 shadow-sm">
                    {decision}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-rose-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                Pendencias
              </h3>
              <ul className="mt-2 space-y-2 text-sm">
                {ritual.pendencias.map((pendency, index) => (
                  <li key={index} className="rounded-lg border bg-white px-3 py-2 shadow-sm">
                    {pendency.descricao} (Responsavel: {pendency.responsavel})
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RitualsAgenda;
