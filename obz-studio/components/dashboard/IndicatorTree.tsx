import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Indicator } from "@/data/indicator-data";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface IndicatorTreeProps {
  indicator: Indicator;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === "up") return <ArrowUp className="h-5 w-5 text-emerald-500" />;
  if (trend === "down") return <ArrowDown className="h-5 w-5 text-rose-500" />;
  return <Minus className="h-5 w-5 text-gray-500" />;
};

const IndicatorCard: React.FC<{ indicator: Indicator }> = ({ indicator }) => {
  return (
    <Card className="shadow-sm mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{indicator.name}</CardTitle>
        <CardDescription>Resultado e metas do ciclo OBZ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta OBZ</p>
            <p>{indicator.meta}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Real</p>
            <p>{indicator.real}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desvio</p>
            <p>{indicator.desvio}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tendencia</p>
            <TrendIcon trend={indicator.tendencia} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Responsavel</p>
            <Badge variant="outline">{indicator.responsavel}</Badge>
          </div>
        </div>
        {indicator.children && (
          <div className="mt-4 rounded-2xl border-l-2 border-primary/20 pl-6">
            {indicator.children.map((child) => (
              <IndicatorCard key={child.name} indicator={child} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const IndicatorTree: React.FC<IndicatorTreeProps> = ({ indicator }) => {
  return <IndicatorCard indicator={indicator} />;
};

export default IndicatorTree;
