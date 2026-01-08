export type Indicator = {
  name: string;
  meta: string;
  real: string;
  desvio: string;
  tendencia: 'up' | 'down' | 'stable';
  responsavel: string;
  children?: Indicator[];
}

export const dummyIndicator: Indicator = { name: '', meta: '', real: '', desvio: '', tendencia: 'stable', responsavel: '' };


export const indicatorData: Indicator = {
  name: 'Resultado',
  meta: 'R$ 2.0M',
  real: 'R$ 2.2M',
  desvio: '+10%',
  tendencia: 'up',
  responsavel: 'CFO',
  children: [
    {
      name: 'Gasto Total',
      meta: 'R$ 1.1M',
      real: 'R$ 1.2M',
      desvio: '+9.1%',
      tendencia: 'down',
      responsavel: 'Diretor Operações',
      children: [
        {
          name: 'Manutenção Predial',
          meta: 'R$ 150k',
          real: 'R$ 160k',
          desvio: '+6.7%',
          tendencia: 'down',
          responsavel: 'Gerente Facilities',
        },
        {
          name: 'Serviços de Terceiros',
          meta: 'R$ 300k',
          real: 'R$ 320k',
          desvio: '+6.7%',
          tendencia: 'stable',
          responsavel: 'Gerente Suprimentos',
        },
      ],
    },
  ],
};
