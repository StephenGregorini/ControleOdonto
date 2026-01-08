import React from "react";
import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  valueFormatter?: (value: number | string) => string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-xs shadow-lg">
      {label ? <p className="mb-2 text-sm font-semibold text-foreground">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const value =
            item.value !== undefined && valueFormatter ? valueFormatter(item.value) : item.value;
          return (
            <div key={`${item.name ?? "item"}-${index}`} className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full")}
                style={{ backgroundColor: item.color ?? "hsl(var(--primary))" }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="ml-auto font-semibold text-foreground">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltip;
