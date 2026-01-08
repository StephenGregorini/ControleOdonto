import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  delta: string;
  trend: "up" | "down" | "flat";
  status: "good" | "warning" | "critical";
  onClick?: () => void;
}

const statusMap = {
  good: "success",
  warning: "warning",
  critical: "destructive",
} as const;

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  trend,
  status,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex h-full w-full flex-col rounded-2xl border bg-card p-5 text-left shadow-sm transition",
        onClick ? "hover:shadow-lg" : "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant={statusMap[status]} className="text-[10px] uppercase tracking-wide">
          {status === "good" ? "Ok" : status === "warning" ? "Atencao" : "Critico"}
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{delta}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            trend === "up" && "bg-emerald-500/10 text-emerald-700",
            trend === "down" && "bg-rose-500/10 text-rose-700",
            trend === "flat" && "bg-slate-400/10 text-slate-600"
          )}
        >
          {trend === "up" ? "em alta" : trend === "down" ? "em queda" : "estavel"}
        </span>
      </div>
    </motion.button>
  );
};

export default KpiCard;
