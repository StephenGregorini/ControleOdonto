alter table public.antecipacoes
  add column if not exists data_reembolso_programada date,
  add column if not exists data_pagamento_antecipacao date,
  add column if not exists data_pagamento_reembolso date,
  add column if not exists data_evento date,
  add column if not exists data_solicitacao date,
  add column if not exists valor_bruto numeric;
