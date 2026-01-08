export interface Ritual {
  id: string;
  nome: string;
  frequencia: 'Semanal Operacional' | 'Mensal Executivo';
  proximaData: string;
  indicadoresChave: string[];
  decisoesRegistradas: string[];
  pendencias: { descricao: string; responsavel: string }[];
}

export const ritualsData: Ritual[] = [
  {
    id: 'R001',
    nome: 'Reunião Operacional Semanal OBZ',
    frequencia: 'Semanal Operacional',
    proximaData: '2025-01-03',
    indicadoresChave: ['Gasto Total', 'Variação Volume', 'Status Plano de Ação'],
    decisoesRegistradas: ['Priorizar ação A002', 'Revisar fornecedor X'],
    pendencias: [{ descricao: 'Levantar dados de consumo de insumos', responsavel: 'Analista Financeiro' }],
  },
  {
    id: 'R002',
    nome: 'Comitê Executivo OBZ',
    frequencia: 'Mensal Executivo',
    proximaData: '2025-01-15',
    indicadoresChave: ['Cockpit Executivo', 'Saving Capturado DRE', 'Phasing Ganho'],
    decisoesRegistradas: ['Aprovar meta de saving Q1', 'Realocar budget para projeto Y'],
    pendencias: [{ descricao: 'Apresentar proposta de novo contrato TI', responsavel: 'Diretor TI' }],
  },
];
