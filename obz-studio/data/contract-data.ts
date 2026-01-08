export interface Contract {
  id: string;
  conta: string;
  fornecedor: string;
  unidade: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  valorContratado: number;
  valorExecutado: number;
  sla: 'Atendido' | 'Não Atendido';
  desvioFinanceiro: number;
  alertaVencimento: boolean;
  alertaConsumo: boolean;
}

export const contractData: Contract[] = [
  {
    id: 'C001',
    conta: 'Manutenção Predial',
    fornecedor: 'Manutec S.A.',
    unidade: 'Hospital Central',
    vigenciaInicio: '2023-01-01',
    vigenciaFim: '2024-12-31',
    valorContratado: 120000,
    valorExecutado: 110000,
    sla: 'Atendido',
    desvioFinanceiro: -10000,
    alertaVencimento: false,
    alertaConsumo: false,
  },
  {
    id: 'C002',
    conta: 'Serviços de Limpeza',
    fornecedor: 'Clean Solutions',
    unidade: 'Hospital Infantil',
    vigenciaInicio: '2024-03-01',
    vigenciaFim: '2025-02-28',
    valorContratado: 80000,
    valorExecutado: 85000,
    sla: 'Não Atendido',
    desvioFinanceiro: 5000,
    alertaVencimento: true,
    alertaConsumo: true,
  },
  {
    id: 'C003',
    conta: 'Consultoria TI',
    fornecedor: 'Tech Advisors',
    unidade: 'Ambos',
    vigenciaInicio: '2024-01-15',
    vigenciaFim: '2024-07-15',
    valorContratado: 50000,
    valorExecutado: 48000,
    sla: 'Atendido',
    desvioFinanceiro: -2000,
    alertaVencimento: true,
    alertaConsumo: false,
  },
];
