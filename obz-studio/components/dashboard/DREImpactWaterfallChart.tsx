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
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartTooltip from "@/components/ui/ChartTooltip";
import { dreImpactData } from "@/data/phasing-data";

// Helper to format currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const DREImpactWaterfallChart: React.FC = () => {
  // Data for a simple bar chart showing components
  const chartData = dreImpactData.filter(item => item.name !== 'Base de Custo' && item.name !== 'Resultado Líquido');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Impacto no DRE Detalhado</CardTitle>
        <CardDescription>Componentes de ganho e evitados</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              content={<ChartTooltip valueFormatter={(value) => formatCurrency(Number(value))} />}
            />
            <Legend verticalAlign="top" align="right" height={32} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DREImpactWaterfallChart;
