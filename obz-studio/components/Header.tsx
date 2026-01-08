import React from "react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { navItems } from "@/data/navigation";
import { Bell, Menu, Search, Sparkles, User } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const active = navItems.find((item) => item.path === location.pathname);

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border bg-card p-2 text-muted-foreground lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {active?.label ?? "Cockpit Executivo"}
              </h1>
              <Badge variant="secondary" className="hidden text-xs font-semibold sm:flex">
                Ciclo OBZ 2025
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{active?.description}</p>
          </div>
        </div>

        <div className="hidden w-full max-w-xs items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm lg:flex">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Buscar indicadores, contratos, acoes..."
            className="h-auto border-none bg-transparent p-0 text-sm focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Atualizado ha 3 min
          </button>
          <button className="rounded-full border bg-card p-2 text-muted-foreground">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-full border bg-card px-3 py-1.5">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground">Stephen</p>
              <p className="text-[11px] text-muted-foreground">MedSimples</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <User className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
