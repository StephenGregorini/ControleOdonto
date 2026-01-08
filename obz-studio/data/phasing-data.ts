export interface PhasingDataItem {
  month: string;
  planejado: number;
  implantado: number;
  capturado: number;
}

export const phasingData: PhasingDataItem[] = [
  { month: 'Jan', planejado: 10000, implantado: 8000, capturado: 6000 },
  { month: 'Fev', planejado: 12000, implantado: 10000, capturado: 8000 },
  { month: 'Mar', planejado: 15000, implantado: 13000, capturado: 11000 },
  { month: 'Abr', planejado: 18000, implantado: 16000, capturado: 14000 },
  { month: 'Mai', planejado: 20000, implantado: 19000, capturado: 18000 },
  { month: 'Jun', planejado: 22000, implantado: 21000, capturado: 20000 },
];

export interface DREImpactDataItem {
  name: string;
  value: number;
  // For waterfall chart, 'start' and 'end' can define the bar segments
  start?: number;
  end?: number;
}

export const dreImpactData: DREImpactDataItem[] = [
  { name: 'Base de Custo', value: 500000 },
  { name: 'Reduções', value: -50000, start: 500000, end: 450000 },
  { name: 'Incrementos Evitados', value: -20000, start: 450000, end: 430000 },
  { name: 'Resultado Líquido', value: 430000 },
];
