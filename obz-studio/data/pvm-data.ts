export interface PvmData {
  conta: string;
  efeitoPreco: number;
  efeitoVolume: number;
  efeitoMix: number;
  impactoTotal: number;
}

export const pvmData: PvmData[] = [
  {
    conta: 'Engenharia Clínica',
    efeitoPreco: 20000,
    efeitoVolume: 15000,
    efeitoMix: -5000,
    impactoTotal: 30000,
  },
  {
    conta: 'Serviços Terceirizados',
    efeitoPreco: 10000,
    efeitoVolume: 25000,
    efeitoMix: 2000,
    impactoTotal: 37000,
  },
  {
    conta: 'Materiais Hospitalares',
    efeitoPreco: 50000,
    efeitoVolume: -10000,
    efeitoMix: 8000,
    impactoTotal: 48000,
  },
];
