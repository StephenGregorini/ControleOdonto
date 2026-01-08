import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/data/navigation";
import Logo from "@/assets/logo_claro.svg";
import { X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu"
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r bg-card/95 backdrop-blur transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="MedSimples" className="h-8" />
            <div>
              <p className="text-sm font-semibold text-foreground">OBZ MedSimples</p>
              <p className="text-xs text-muted-foreground">Controle de gastos hospitalares</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border bg-background p-2 text-muted-foreground lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="rounded-2xl border bg-gradient-to-br from-white via-white to-blue-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ciclo OBZ 2025
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Saving alvo: R$ 12,8M
            </p>
            <p className="text-xs text-muted-foreground">Captura atual: 63% no DRE</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 pb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "mt-0.5 rounded-lg border bg-white/80 p-2 transition",
                        isActive
                          ? "border-white/40 bg-white/20 text-primary-foreground"
                          : "text-foreground/70 group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">{item.label}</span>
                      <span
                        className={cn(
                          "text-xs",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t px-6 py-4">
          <div className="rounded-xl bg-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Proximo ritual
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">Comite Executivo OBZ</p>
            <p className="text-xs text-muted-foreground">Quinta, 09:30 - Sala A</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
