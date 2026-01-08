import {
  Activity,
  BadgeCheck,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Network,
  ShieldCheck,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  description: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    id: "cockpit",
    label: "Cockpit Executivo",
    path: "/",
    description: "Visao geral de resultados e riscos OBZ",
    icon: LayoutDashboard,
  },
  {
    id: "indicadores",
    label: "Estrutura de Indicadores",
    path: "/indicadores",
    description: "Arvore de contas, metas e responsaveis",
    icon: Workflow,
  },
  {
    id: "arvore-entidades",
    label: "Arvore de Entidades",
    path: "/entidades",
    description: "Hospitais, diretorias e centros de custo",
    icon: Network,
  },
  {
    id: "analise-desvio",
    label: "Analise Preco x Volume",
    path: "/analise-desvio",
    description: "Drivers de gasto e impacto financeiro",
    icon: LineChart,
  },
  {
    id: "contratos",
    label: "Gestao de Contratos",
    path: "/contratos",
    description: "KPI por contrato, SLA e alertas",
    icon: ShieldCheck,
  },
  {
    id: "plano-acao",
    label: "Plano de Acao",
    path: "/plano-acao",
    description: "Macro etapas e progresso das iniciativas",
    icon: ListChecks,
  },
  {
    id: "gestao-ganhos",
    label: "Gestao de Ganhos",
    path: "/gestao-ganhos",
    description: "Saving mensal, anualizado e capturado",
    icon: Target,
  },
  {
    id: "phasing-ganho",
    label: "Phasing do Ganho",
    path: "/phasing-ganho",
    description: "Implantado x capturado e DRE",
    icon: Activity,
  },
  {
    id: "governanca",
    label: "Governanca",
    path: "/governanca",
    description: "Rituais, decisoes e pendencias",
    icon: BadgeCheck,
  },
];
