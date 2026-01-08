import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartTooltip from "@/components/ui/ChartTooltip";
import { phasingData } from "@/data/phasing-data";

const PhasingChart: React.FC = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Phasing do Ganho Mensal</CardTitle>
        <CardDescription>Planejado x implantado x capturado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={phasingData}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
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
              tickFormatter={(value) => `${value}M`}
            />
            <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value}M`} />} />
            <Legend verticalAlign="top" align="right" height={32} />
            <Line
              type="monotone"
              dataKey="planejado"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              name="Planejado"
            />
            <Line
              type="monotone"
              dataKey="implantado"
              stroke="hsl(var(--secondary-foreground))"
              strokeWidth={2}
              dot={false}
              name="Implantado"
            />
            <Line
              type="monotone"
              dataKey="capturado"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
              name="Capturado"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PhasingChart;
