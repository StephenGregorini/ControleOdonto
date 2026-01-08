import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartTooltip from "@/components/ui/ChartTooltip";

interface SavingsChartProps {
    title: string;
    data: { name: string; value: number }[];
}

const SavingsChart: React.FC<SavingsChartProps> = ({ title, data }) => {
  return (
    <Card className="shadow-sm flex flex-col h-full">
        <CardHeader>
            <CardTitle className="text-base font-medium text-card-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="6 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        interval={0}
                    />
                    <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => (value / 1000000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + 'M'}
                    />
                    <Tooltip
                        cursor={{ fill: "hsl(var(--accent))" }}
                        content={
                          <ChartTooltip
                            valueFormatter={(value) =>
                              Number(value).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            }
                          />
                        }
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Escopo" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
};

export default SavingsChart;
