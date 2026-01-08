export type TipoGanho = 'Redução de custo' | 'Evitar aumento' | 'Eficiência operacional';

export interface GainSaving {
  id: string;
  acao: string;
  tipoGanho: TipoGanho;
  savingMensalEstimado: number;
  savingAnualizado: number;
  savingCapturadoPeriodo: number;
  gapCaptura: number;
}

export const gainsSavingData: GainSaving[] = [
  {
    id: 'GS001',
    acao: 'Otimização de contrato de energia',
    tipoGanho: 'Redução de custo',
    savingMensalEstimado: 10000,
    savingAnualizado: 120000,
    savingCapturadoPeriodo: 8000,
    gapCaptura: 2000,
  },
  {
    id: 'GS002',
    acao: 'Implementação de telemedicina',
    tipoGanho: 'Evitar aumento',
    savingMensalEstimado: 15000,
    savingAnualizado: 180000,
    savingCapturadoPeriodo: 10000,
    gapCaptura: 5000,
  },
  {
    id: 'GS003',
    acao: 'Melhoria na gestão de estoque de medicamentos',
    tipoGanho: 'Eficiência operacional',
    savingMensalEstimado: 8000,
    savingAnualizado: 96000,
    savingCapturadoPeriodo: 8000,
    gapCaptura: 0,
  },
];
