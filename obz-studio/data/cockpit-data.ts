export const cockpitSummary = {
  cycle: "Ciclo OBZ 2025",
  updatedAt: "Atualizado ha 3 min",
  period: "Jan - Jun 2025",
  network: "Rede Atlas (3 hospitais)",
};

export const cockpitKpis = [
  {
    id: "gasto-total",
    title: "Gasto Total Real x Planejado",
    value: "R$ 48,2M",
    subtitle: "Planejado: R$ 45,5M",
    delta: "+5,9% vs meta",
    trend: "up",
    status: "warning",
    details: {
      highlight: "O desvio e puxado por assistencial e suprimentos cirurgicos.",
      drivers: [
        { label: "Assistencial", value: "R$ 1,6M", trend: "+4,2%" },
        { label: "Indireto", value: "R$ 820k", trend: "+2,1%" },
        { label: "Suprimentos", value: "R$ 540k", trend: "+6,5%" },
      ],
    },
  },
  {
    id: "saving-planejado",
    title: "Saving Planejado",
    value: "R$ 12,8M",
    subtitle: "Meta anual total",
    delta: "68% alocado",
    trend: "flat",
    status: "good",
    details: {
      highlight: "Carteira distribuida em 41 iniciativas priorizadas.",
      drivers: [
        { label: "Contratos criticos", value: "R$ 4,1M", trend: "24 acoes" },
        { label: "Volume assistencial", value: "R$ 3,5M", trend: "12 acoes" },
        { label: "Mix assistencial", value: "R$ 2,6M", trend: "5 acoes" },
      ],
    },
  },
  {
    id: "saving-capturado",
    title: "Saving Capturado no DRE",
    value: "R$ 6,4M",
    subtitle: "Captura validada",
    delta: "50% da meta",
    trend: "up",
    status: "good",
    details: {
      highlight: "Captura acelerou com renegociacao de gases e OPME.",
      drivers: [
        { label: "Renegociacao OPME", value: "R$ 1,9M", trend: "em dia" },
        { label: "Gases medicinais", value: "R$ 1,2M", trend: "em dia" },
        { label: "Manutencao predial", value: "R$ 780k", trend: "parcial" },
      ],
    },
  },
  {
    id: "gap-captura",
    title: "Gap de Captura",
    value: "R$ 6,4M",
    subtitle: "Restante para DRE",
    delta: "28 iniciativas criticas",
    trend: "down",
    status: "critical",
    details: {
      highlight: "Gap concentrado em 3 unidades com atraso de governanca.",
      drivers: [
        { label: "Unidade Mooca", value: "R$ 1,8M", trend: "atraso 45d" },
        { label: "Unidade Belvedere", value: "R$ 1,2M", trend: "em ajuste" },
        { label: "Unidade Recife", value: "R$ 980k", trend: "pendente SLA" },
      ],
    },
  },
];

export const monthlyTrendData = [
  { name: "Jan", real: 7.2, planejado: 6.8 },
  { name: "Fev", real: 7.6, planejado: 7.1 },
  { name: "Mar", real: 8.4, planejado: 7.9 },
  { name: "Abr", real: 7.9, planejado: 7.6 },
  { name: "Mai", real: 8.8, planejado: 8.1 },
  { name: "Jun", real: 8.3, planejado: 8.0 },
];

export const dreWaterfallData = [
  { name: "Base OBZ", value: 48.2 },
  { name: "Renegociacoes", value: -2.6 },
  { name: "Volume evitado", value: -1.8 },
  { name: "Mix assistencial", value: -1.4 },
  { name: "Incrementos evitados", value: 0.9 },
  { name: "Resultado no DRE", value: 42.3 },
];

export const typicalIndicators = [
  { label: "Gasto assistencial", value: "R$ 28,4M", delta: "+3,2%" },
  { label: "Gasto indireto", value: "R$ 9,7M", delta: "-1,1%" },
  { label: "% variacao preco", value: "+1,8%", delta: "estavel" },
  { label: "% variacao volume", value: "+2,4%", delta: "+0,6pp" },
  { label: "Impacto EBITDA", value: "-R$ 4,3M", delta: "-0,7pp" },
];

export const agentInsights = [
  {
    id: "lider-virtual",
    title: "Lider Virtual",
    role: "Resumo executivo e riscos",
    highlights: [
      "Desvio de gasto concentrado em OPME e materiais de alta complexidade.",
      "3 contratos criticos vencem em ate 60 dias sem plano de renegociacao.",
      "Ritual mensal atrasado em 2 unidades chave.",
    ],
    priorities: [
      "Garantir renegociacao de OPME em 15 dias.",
      "Reforcar governanca nas unidades Mooca e Recife.",
      "Ajustar meta de volume assistencial para Q3.",
    ],
  },
  {
    id: "analista-financeiro",
    title: "Analista Financeiro",
    role: "Real x planejado e impacto DRE",
    highlights: [
      "Captura no DRE ficou 6,4M abaixo do planejado para o semestre.",
      "Economias mais consistentes vieram de contratos corporativos.",
      "Gap de captura pode reduzir EBITDA em 0,7pp.",
    ],
    priorities: [
      "Acelerar 12 iniciativas com maior impacto financeiro.",
      "Revisar mix assistencial e preco medio por procedimento.",
      "Validar evidencias antes do fechamento mensal.",
    ],
  },
];

export const hospitalSnapshots = [
  {
    id: "atlas-mooca",
    name: "Hospital Atlas Mooca",
    city: "Sao Paulo",
    profile: "Alta complexidade",
    beds: 220,
    budget: "R$ 19,6M",
    real: "R$ 20,9M",
    delta: "+6,5%",
    capture: "R$ 2,3M",
    status: "attention",
  },
  {
    id: "atlas-belvedere",
    name: "Hospital Atlas Belvedere",
    city: "Belo Horizonte",
    profile: "Media complexidade",
    beds: 180,
    budget: "R$ 17,8M",
    real: "R$ 18,3M",
    delta: "+3,1%",
    capture: "R$ 2,1M",
    status: "ok",
  },
  {
    id: "atlas-recife",
    name: "Hospital Atlas Recife",
    city: "Recife",
    profile: "Especializado",
    beds: 200,
    budget: "R$ 14,6M",
    real: "R$ 14,3M",
    delta: "-1,8%",
    capture: "R$ 2,0M",
    status: "ok",
  },
];

export const hospitalComparative = [
  {
    metric: "Gasto total vs OBZ",
    mooca: "+6,5%",
    belvedere: "+3,1%",
    recife: "-1,8%",
    destaque: "Recife",
  },
  {
    metric: "Custo assistencial / leito",
    mooca: "R$ 118k",
    belvedere: "R$ 104k",
    recife: "R$ 96k",
    destaque: "Recife",
  },
  {
    metric: "Saving capturado (semestre)",
    mooca: "R$ 2,3M",
    belvedere: "R$ 2,1M",
    recife: "R$ 2,0M",
    destaque: "Mooca",
  },
  {
    metric: "Atrasos de contratos",
    mooca: "6",
    belvedere: "4",
    recife: "2",
    destaque: "Recife",
  },
];
