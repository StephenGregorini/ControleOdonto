import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartTooltip from "@/components/ui/ChartTooltip";
import { pvmData } from "@/data/pvm-data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PvmChart: React.FC = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Analise de Efeitos (Preco, Volume, Mix)</CardTitle>
        <CardDescription>Impacto total por conta e tendencia comparativa</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={pvmData}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="conta"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip content={<ChartTooltip valueFormatter={(value) => formatCurrency(Number(value))} />} />
            <Legend verticalAlign="top" align="right" height={32} />
            <Bar
              dataKey="efeitoPreco"
              stackId="a"
              fill="hsl(var(--primary))"
              name="Efeito Preco"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="efeitoVolume"
              stackId="a"
              fill="hsl(var(--secondary))"
              name="Efeito Volume"
            />
            <Bar
              dataKey="efeitoMix"
              stackId="a"
              fill="hsl(var(--destructive))"
              name="Efeito Mix"
            />
            <Line
              type="monotone"
              dataKey="impactoTotal"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={false}
              name="Impacto Total"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PvmChart;
