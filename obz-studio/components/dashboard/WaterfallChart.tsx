import React from "react";
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
import { ArrowUpRight } from "lucide-react";

interface WaterfallChartProps {
  data?: { name: string; value: number }[];
  onOpenDetail?: () => void;
}

const fallbackData = [
  { name: "Base OBZ", value: 48.2 },
  { name: "Renegociacoes", value: -2.6 },
  { name: "Volume evitado", value: -1.8 },
  { name: "Mix assistencial", value: -1.4 },
  { name: "Incrementos evitados", value: 0.9 },
  { name: "Resultado no DRE", value: 42.3 },
];

const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data = fallbackData,
  onOpenDetail,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Resultado OBZ no DRE</CardTitle>
          <CardDescription>Componentes de captura e evitados</CardDescription>
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
          <BarChart data={data}>
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
            <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value}M`} />} />
            <Legend verticalAlign="top" align="right" height={32} />
            <Bar dataKey="value" fill="hsl(var(--primary))" name="Impacto" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WaterfallChart;
