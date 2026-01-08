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
import { pvmData, type PvmData } from "@/data/pvm-data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PvmTable: React.FC = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Tabela Analítica: Preço x Volume x Mix</CardTitle>
        <CardDescription>Componentes que explicam a variacao do gasto</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border bg-card/80">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Efeito Preço</TableHead>
              <TableHead className="text-right">Efeito Volume</TableHead>
              <TableHead className="text-right">Efeito Mix</TableHead>
              <TableHead className="text-right">Impacto Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pvmData.map((item: PvmData) => (
              <TableRow key={item.conta}>
                <TableCell className="font-medium">{item.conta}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.efeitoPreco)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.efeitoVolume)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.efeitoMix)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(item.impactoTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PvmTable;
