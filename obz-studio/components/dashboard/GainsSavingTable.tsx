import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { gainsSavingData, type GainSaving, type TipoGanho } from "@/data/gains-saving-data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getGainTypeBadgeVariant = (type: TipoGanho) => {
  switch (type) {
    case 'Redução de custo':
      return "destructive";
    case "Evitar aumento":
      return "secondary";
    case "Eficiência operacional":
      return "success";
    default:
      return "outline";
  }
};

const GainsSavingTable: React.FC = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Gestão de Ganhos e Saving</CardTitle>
        <CardDescription>Somente ganhos com evidência e reflexo no real</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border bg-card/80">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo de Ganho</TableHead>
              <TableHead className="text-right">Saving Mensal Estimado</TableHead>
              <TableHead className="text-right">Saving Anualizado</TableHead>
              <TableHead className="text-right">Saving Capturado no Período</TableHead>
              <TableHead className="text-right">Gap de Captura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gainsSavingData.map((item: GainSaving) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.acao}</TableCell>
                <TableCell>
                  <Badge variant={getGainTypeBadgeVariant(item.tipoGanho)}>
                    {item.tipoGanho}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.savingMensalEstimado)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.savingAnualizado)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.savingCapturadoPeriodo)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.gapCaptura)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GainsSavingTable;
