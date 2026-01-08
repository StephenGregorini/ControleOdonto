import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface IndicatorCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ title, value, change }) => {
  const progress = parseInt(value.replace('%', '')) || 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{change}</p>
            </div>
            <div style={{width: 60, height: 60}}>
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                innerRadius="80%"
                outerRadius="100%"
                barSize={6}
                data={[{ name: title, value: progress, fill: 'hsl(var(--primary))' }]}
                startAngle={90}
                endAngle={-270}
                >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'hsl(var(--secondary))' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndicatorCard;
