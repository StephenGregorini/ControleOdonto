import { Building, Wrench, HeartPulse, Handshake, Users, type LucideIcon } from 'lucide-react';

export interface Indicator {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

export interface ObzCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  opportunities: string;
  workDynamics: string[];
  resultIndicators: string[];
  monitoringIndicators: string[];
  resultIndicatorData?: Indicator[];
  monitoringIndicatorData?: Indicator[];
}

export const obzData: ObzCategory[] = [
  {
    id: 'manutencao-predial',
    title: 'Manutenção Predial',
    icon: Building,
    description: 'Otimização de gastos e planejamento de manutenção de ativos prediais.',
    opportunities: 'Migrar gasto reativo para gasto planejado, reduzir corretivas emergenciais e eliminar escopos inflados por histórico.',
    workDynamics: [
      'Revisão da carteira de ativos prediais por unidade, idade, criticidade e padrão construtivo.',
      'Análise do mix preventiva x corretiva x emergencial, questionando reincidências.',
      'Challenge técnico sobre planos de manutenção, frequência, escopo e padrão de execução.',
      'Benchmark de custo por metro quadrado e por tipo de edificação hospitalar.',
      'Revisão de contratos de manutenção contínua, escopos, horas contratadas e SLAs.',
      'Redefinição de critérios de acionamento de corretiva e emergencial.',
    ],
    resultIndicators: [
      'Redução do custo de manutenção por metro quadrado.',
      'Redução do volume de manutenções corretivas emergenciais.',
      'Saving anualizado capturado no pacote.',
    ],
    monitoringIndicators: [
      'Percentual de manutenção preventiva sobre o total.',
      'Índice de reincidência de falhas por ativo.',
      'Desvio mensal do gasto versus OBZ aprovado.',
      'Custo médio por ordem de serviço.',
    ],
    resultIndicatorData: [
        { title: 'Custo/m²', value: 'R$ 18,50', change: '-12%', changeType: 'decrease' },
        { title: 'Corretivas Emerg.', value: '38', change: '-25%', changeType: 'decrease' },
        { title: 'Saving Anual', value: 'R$ 1,2M', change: '+8%', changeType: 'increase' },
    ],
    monitoringIndicatorData: [
        { title: '% Preventiva', value: '75%', change: '+15%', changeType: 'increase' },
        { title: 'Reincidência', value: '8%', change: '-3%', changeType: 'decrease' },
        { title: 'Desvio Gasto', value: '+1.5%', change: '-1%', changeType: 'decrease' },
    ]
  },
  {
    id: 'engenharia-predial',
    title: 'Engenharia Predial',
    icon: Wrench,
    description: 'Padronização técnica, racionalização de projetos e planejamento de CAPEX/OPEX.',
    opportunities: 'Padronização técnica, racionalização de projetos e melhor planejamento de CAPEX e OPEX, evitando soluções sob medida e decisões fragmentadas por unidade.',
    workDynamics: [
      'Mapeamento dos projetos recorrentes e soluções técnicas adotadas por unidade.',
      'Padronização de especificações técnicas e fornecedores homologados.',
      'Revisão do modelo de governança de projetos, quem decide, quem aprova, quem executa.',
      'Análise de sobreposição entre engenharia predial, manutenção e terceiros.',
      'Avaliação do custo total de propriedade das soluções adotadas.',
      'Benchmark de custos de projetos por tipo de intervenção.',
    ],
    resultIndicators: [
      'Redução do custo médio por projeto predial.',
      'Redução de retrabalho e aditivos contratuais.',
      'Saving capturado em contratos e projetos padronizados.',
    ],
    monitoringIndicators: [
      'Percentual de projetos executados com padrão técnico definido.',
      'Índice de aditivos sobre contratos originais.',
      'Prazo médio de execução de projetos.',
      'Desvio de CAPEX versus planejamento.',
    ],
     resultIndicatorData: [
        { title: 'Custo Médio/Projeto', value: 'R$ 250k', change: '-10%', changeType: 'decrease' },
        { title: 'Aditivos', value: '4%', change: '-5%', changeType: 'decrease' },
        { title: 'Saving Contratos', value: 'R$ 800k', change: '+15%', changeType: 'increase' },
    ],
    monitoringIndicatorData: [
        { title: '% Projetos Padrão', value: '85%', change: '+20%', changeType: 'increase' },
        { title: 'Prazo Médio', value: '60 dias', change: '-10d', changeType: 'decrease' },
        { title: 'Desvio CAPEX', value: '-0.5%', change: '+2%', changeType: 'increase' },
    ]
  },
  {
    id: 'engenharia-clinica',
    title: 'Engenharia Clínica',
    icon: HeartPulse,
    description: 'Gestão de parque tecnológico, contratos de manutenção e racionalização de tecnologias.',
    opportunities: 'Gestão de parque tecnológico, contratos de manutenção e racionalização de tecnologias, sem impacto assistencial.',
    workDynamics: [
      'Inventário completo do parque de equipamentos por unidade, idade, criticidade e taxa de utilização.',
      'Revisão dos contratos de manutenção, escopo, SLA, peças inclusas e modelo de remuneração.',
      'Análise de equipamentos subutilizados, ociosos ou redundantes.',
      'Challenge técnico sobre políticas de substituição, upgrade e vida útil.',
      'Avaliação make or buy para manutenção interna versus terceirizada.',
      'Benchmark de custo de manutenção por tipo de equipamento.',
    ],
    resultIndicators: [
      'Redução do custo de manutenção por equipamento crítico.',
      'Redução do custo total de engenharia clínica por leito.',
      'Saving anualizado em contratos e parque tecnológico.',
    ],
    monitoringIndicators: [
      'Disponibilidade operacional dos equipamentos críticos.',
      'Percentual de contratos renegociados ou reestruturados.',
      'Idade média do parque tecnológico.',
      'Custo de manutenção como percentual do valor do ativo.',
    ],
    resultIndicatorData: [
        { title: 'Custo Manut./Equip.', value: 'R$ 5.2k', change: '-15%', changeType: 'decrease' },
        { title: 'Custo/Leito', value: 'R$ 18k', change: '-8%', changeType: 'decrease' },
        { title: 'Saving Anual', value: 'R$ 3.5M', change: '+12%', changeType: 'increase' },
    ],
    monitoringIndicatorData: [
        { title: 'Disponibilidade', value: '99.2%', change: '+0.5%', changeType: 'increase' },
        { title: '% Contratos Reneg.', value: '60%', change: '+25%', changeType: 'increase' },
        { title: 'Idade Média Parque', value: '6.5 anos', change: '-0.5a', changeType: 'decrease' },
    ]
  },
  {
    id: 'servicos-terceiros',
    title: 'Serviços de Terceiros',
    icon: Handshake,
    description: 'Racionalização de escopo, modelo de contratação e volume de serviços de terceiros.',
    opportunities: 'Questionar escopo, modelo de contratação, volume contratado e aderência à demanda real, eliminando gordura histórica.',
    workDynamics: [
      'Mapeamento completo dos contratos de terceiros por categoria, escopo e unidade.',
      'Análise de volume contratado versus volume efetivamente utilizado.',
      'Revisão de SLAs, indicadores e penalidades.',
      'Benchmark de custos por tipo de serviço e complexidade hospitalar.',
      'Avaliação de alternativas de internalização ou consolidação de fornecedores.',
      'Revisão de contratos por resultado ou por demanda real.',
    ],
    resultIndicators: [
      'Redução do custo de serviços terceirizados por unidade.',
      'Saving capturado por renegociação e redimensionamento de contratos.',
      'Redução de gastos fora de contrato.',
    ],
    monitoringIndicators: [
      'Percentual de contratos com SLA e KPI ativos.',
      'Desvio de consumo versus volume contratado.',
      'Índice de contratos revisados no ciclo OBZ.',
      'Custo de terceiros como percentual da receita.',
    ],
    resultIndicatorData: [
        { title: 'Custo/Unidade', value: 'R$ 1.2M', change: '-18%', changeType: 'decrease' },
        { title: 'Saving Contratos', value: 'R$ 2.1M', change: '+10%', changeType: 'increase' },
        { title: 'Gastos Fora Contrato', value: '1.2%', change: '-2%', changeType: 'decrease' },
    ],
    monitoringIndicatorData: [
        { title: '% Contratos c/ SLA', value: '92%', change: '+12%', changeType: 'increase' },
        { title: 'Desvio Consumo', value: '-4%', change: '-2%', changeType: 'decrease' },
        { title: '% Contratos Revisados', value: '75%', change: '+30%', changeType: 'increase' },
    ]
  },
  {
    id: 'beneficios-colaboradores',
    title: 'Benefícios dos Colaboradores',
    icon: Users,
    description: 'Readequação de desenho de benefício, coparticipação e elegibilidade.',
    opportunities: 'Readequar desenho de benefício, coparticipação e elegibilidade, equilibrando atratividade e sustentabilidade financeira.',
    workDynamics: [
      'Diagnóstico do portfólio de benefícios por perfil de colaborador e unidade.',
      'Análise de adesão, uso real e custo per capita.',
      'Benchmark de benefícios com redes hospitalares comparáveis.',
      'Revisão de regras de elegibilidade, coparticipação e subsídios.',
      'Avaliação de modelos flexíveis de benefícios.',
      'Renegociação com fornecedores com base em massa crítica da rede.',
    ],
    resultIndicators: [
      'Redução do custo de benefícios por colaborador.',
      'Saving anualizado no pacote de benefícios.',
      'Manutenção ou melhoria do índice de atratividade.',
    ],
    monitoringIndicators: [
      'Custo de benefícios como percentual da folha.',
      'Taxa de adesão aos principais benefícios.',
      'Índice de reajuste anual dos contratos.',
      'Turnover associado a mudanças de benefício.',
    ],
    resultIndicatorData: [
        { title: 'Custo/Colab.', value: 'R$ 1.850', change: '-7%', changeType: 'decrease' },
        { title: 'Saving Anual', value: 'R$ 950k', change: '+5%', changeType: 'increase' },
        { title: 'Índice Atratividade', value: '8.8/10', change: '+0.2', changeType: 'increase' },
    ],
    monitoringIndicatorData: [
        { title: '% Custo/Folha', value: '18%', change: '-1.5%', changeType: 'decrease' },
        { title: 'Taxa Adesão', value: '85%', change: '0%', changeType: 'decrease' },
        { title: 'Reajuste Anual', value: '9.5%', change: '-1%', changeType: 'decrease' },
    ]
  },
];
