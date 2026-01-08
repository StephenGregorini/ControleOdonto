import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartTooltip from "@/components/ui/ChartTooltip";
import { ArrowUpRight } from "lucide-react";

const fallbackData = [
  { name: "Jan", real: 4.0, planejado: 4.2 },
  { name: "Fev", real: 3.4, planejado: 3.6 },
  { name: "Mar", real: 4.8, planejado: 4.6 },
  { name: "Abr", real: 4.5, planejado: 4.6 },
  { name: "Mai", real: 6.2, planejado: 6.0 },
  { name: "Jun", real: 5.8, planejado: 5.9 },
];

interface MonthlyTrendChartProps {
  data?: { name: string; real: number; planejado: number }[];
  onOpenDetail?: () => void;
}

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data = fallbackData,
  onOpenDetail,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Gasto Mensal: Real x Planejado</CardTitle>
          <CardDescription>Evolucao mensal em milhoes (R$)</CardDescription>
        </div>
        {onOpenDetail ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            onClick={onOpenDetail}
          >
            Ver detalhes
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(value) => `${value}M`}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              content={<ChartTooltip valueFormatter={(value) => `${value}M`} />}
              cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "4 4" }}
            />
            <Legend verticalAlign="top" align="right" height={32} />
            <Line
              type="monotone"
              dataKey="real"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              name="Gasto Real"
            />
            <Line
              type="monotone"
              dataKey="planejado"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
              name="Gasto Planejado"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;
