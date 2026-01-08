import React from "react";
import { Badge, type BadgeProps } from "@/components/ui/Badge";

interface PageHeaderBadge {
  label: string;
  variant?: BadgeProps["variant"];
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badges?: PageHeaderBadge[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badges, actions }) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card/80 px-6 py-5 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        {badges?.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge.label}
                variant={badge.variant ?? "secondary"}
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
