export type EntityStatus = "ok" | "attention" | "risk";

export interface EntityNode {
  id: string;
  name: string;
  type: string;
  leader: string;
  costCenter?: string;
  budget?: string;
  headcount?: string;
  status?: EntityStatus;
  note?: string;
  children?: EntityNode[];
}

export const entitySummary = {
  network: "Rede Atlas de Saude",
  hospitals: 3,
  directorias: 9,
  costCenters: 48,
  scopeBudget: "R$ 62,0M",
  updatedAt: "Atualizado ha 2 dias",
};

export const entityTree: EntityNode = {
  id: "rede-atlas",
  name: "Rede Atlas de Saude",
  type: "Holding Hospitalar",
  leader: "Diretoria Corporativa",
  budget: "R$ 62,0M",
  headcount: "3.450 colaboradores",
  status: "ok",
  note: "Exemplo hipotetico para estrutura OBZ multi-hospitais.",
  children: [
    {
      id: "atlas-mooca",
      name: "Hospital Atlas Mooca",
      type: "Hospital - Alta Complexidade",
      leader: "Diretoria Geral - Carla M.",
      costCenter: "HSP-100",
      budget: "R$ 19,6M",
      headcount: "1.100 colaboradores",
      status: "attention",
      children: [
        {
          id: "mooca-assistencial",
          name: "Diretoria Assistencial",
          type: "Diretoria",
          leader: "Dr. Andre L.",
          budget: "R$ 11,2M",
          headcount: "720 colaboradores",
          status: "attention",
          children: [
            {
              id: "mooca-uti",
              name: "UTI Adulto",
              type: "Centro de Custo",
              leader: "Enf. Paula R.",
              costCenter: "CC-1101",
              budget: "R$ 2,4M",
              headcount: "120 colaboradores",
              status: "risk",
              note: "OPME acima do benchmark em 2,8%.",
            },
            {
              id: "mooca-ps",
              name: "Pronto Atendimento",
              type: "Centro de Custo",
              leader: "Dr. Marcos G.",
              costCenter: "CC-1103",
              budget: "R$ 1,9M",
              headcount: "95 colaboradores",
              status: "attention",
            },
          ],
        },
        {
          id: "mooca-adm",
          name: "Diretoria Administrativa",
          type: "Diretoria",
          leader: "Patricia S.",
          budget: "R$ 4,1M",
          headcount: "240 colaboradores",
          status: "ok",
          children: [
            {
              id: "mooca-facilities",
              name: "Facilities e Manutencao",
              type: "Centro de Custo",
              leader: "Rafael M.",
              costCenter: "CC-1201",
              budget: "R$ 980k",
              headcount: "48 colaboradores",
              status: "ok",
            },
            {
              id: "mooca-rouparia",
              name: "Rouparia e Hotelaria",
              type: "Centro de Custo",
              leader: "Silvia P.",
              costCenter: "CC-1204",
              budget: "R$ 640k",
              headcount: "32 colaboradores",
              status: "attention",
            },
          ],
        },
      ],
    },
    {
      id: "atlas-belvedere",
      name: "Hospital Atlas Belvedere",
      type: "Hospital - Media Complexidade",
      leader: "Diretoria Geral - Bruno F.",
      costCenter: "HSP-200",
      budget: "R$ 17,8M",
      headcount: "980 colaboradores",
      status: "ok",
      children: [
        {
          id: "belvedere-assistencial",
          name: "Diretoria Assistencial",
          type: "Diretoria",
          leader: "Dra. Helena C.",
          budget: "R$ 9,6M",
          headcount: "610 colaboradores",
          status: "ok",
          children: [
            {
              id: "belvedere-onco",
              name: "Oncologia",
              type: "Centro de Custo",
              leader: "Dr. Tiago V.",
              costCenter: "CC-2107",
              budget: "R$ 1,6M",
              headcount: "70 colaboradores",
              status: "attention",
              note: "Renegociacao de quimioterapicos em andamento.",
            },
            {
              id: "belvedere-bloco",
              name: "Bloco Cirurgico",
              type: "Centro de Custo",
              leader: "Enf. Joana N.",
              costCenter: "CC-2102",
              budget: "R$ 2,1M",
              headcount: "88 colaboradores",
              status: "ok",
            },
          ],
        },
        {
          id: "belvedere-supri",
          name: "Diretoria de Suprimentos",
          type: "Diretoria",
          leader: "Ricardo T.",
          budget: "R$ 3,2M",
          headcount: "140 colaboradores",
          status: "attention",
          children: [
            {
              id: "belvedere-opme",
              name: "Compras OPME",
              type: "Centro de Custo",
              leader: "Juliana Q.",
              costCenter: "CC-2205",
              budget: "R$ 1,1M",
              headcount: "22 colaboradores",
              status: "attention",
            },
          ],
        },
      ],
    },
    {
      id: "atlas-recife",
      name: "Hospital Atlas Recife",
      type: "Hospital - Especializado",
      leader: "Diretoria Geral - Diego P.",
      costCenter: "HSP-300",
      budget: "R$ 14,6M",
      headcount: "1.020 colaboradores",
      status: "ok",
      children: [
        {
          id: "recife-assistencial",
          name: "Diretoria Assistencial",
          type: "Diretoria",
          leader: "Dra. Camila A.",
          budget: "R$ 8,4M",
          headcount: "640 colaboradores",
          status: "ok",
          children: [
            {
              id: "recife-cardiologia",
              name: "Cardiologia",
              type: "Centro de Custo",
              leader: "Dr. Lucas E.",
              costCenter: "CC-3104",
              budget: "R$ 1,5M",
              headcount: "64 colaboradores",
              status: "ok",
            },
            {
              id: "recife-uti",
              name: "UTI Coronariana",
              type: "Centro de Custo",
              leader: "Enf. Renato M.",
              costCenter: "CC-3108",
              budget: "R$ 1,2M",
              headcount: "58 colaboradores",
              status: "ok",
            },
          ],
        },
        {
          id: "recife-financeira",
          name: "Diretoria Financeira",
          type: "Diretoria",
          leader: "Luciana P.",
          budget: "R$ 2,4M",
          headcount: "96 colaboradores",
          status: "ok",
          children: [
            {
              id: "recife-faturamento",
              name: "Faturamento e Contas",
              type: "Centro de Custo",
              leader: "Paulo R.",
              costCenter: "CC-3202",
              budget: "R$ 820k",
              headcount: "38 colaboradores",
              status: "ok",
            },
          ],
        },
      ],
    },
  ],
};
