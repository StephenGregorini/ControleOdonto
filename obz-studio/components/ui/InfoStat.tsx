import React from "react";
import { cn } from "@/lib/utils";

interface InfoStatProps {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "success" | "warning" | "critical";
}

const toneStyles: Record<NonNullable<InfoStatProps["tone"]>, string> = {
  default: "border-border",
  success: "border-emerald-200/80 bg-emerald-50/60",
  warning: "border-amber-200/80 bg-amber-50/60",
  critical: "border-rose-200/80 bg-rose-50/60",
};

const InfoStat: React.FC<InfoStatProps> = ({ label, value, helper, tone = "default" }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur",
        toneStyles[tone]
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
};

export default InfoStat;
