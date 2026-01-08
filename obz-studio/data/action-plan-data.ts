export interface ActionItem {
  id: string;
  acao: string;
  macroEtapa: string;
  responsavel: string;
  prazo: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  impactoEstimado: number;
  vinculoIndicador?: string;
  vinculoContrato?: string;
}

export const actionPlanData: ActionItem[] = [
  {
    id: 'A001',
    acao: 'Negociar novo contrato de manutenção predial',
    macroEtapa: 'Negociação',
    responsavel: 'Gerente Suprimentos',
    prazo: '2025-03-31',
    status: 'Em Andamento',
    impactoEstimado: 50000,
    vinculoContrato: 'C001',
  },
  {
    id: 'A002',
    acao: 'Revisar protocolo de uso de materiais cirúrgicos',
    macroEtapa: 'Redesenho de Processo',
    responsavel: 'Chefe de Enfermagem',
    prazo: '2025-04-15',
    status: 'Pendente',
    impactoEstimado: 30000,
    vinculoIndicador: 'Gasto Total - Materiais Hospitalares',
  },
  {
    id: 'A003',
    acao: 'Auditoria de contas de TI',
    macroEtapa: 'Diagnóstico',
    responsavel: 'Controller',
    prazo: '2025-02-28',
    status: 'Concluído',
    impactoEstimado: 15000,
    vinculoContrato: 'C003',
  },
  {
    id: 'A004',
    acao: 'Treinamento para equipe de limpeza',
    macroEtapa: 'Implantação',
    responsavel: 'RH',
    prazo: '2025-03-10',
    status: 'Atrasado',
    impactoEstimado: 5000,
  },
];
