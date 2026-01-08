-- 1) vw_indicadores_gerais (sem external_id)
create or replace view public.vw_indicadores_gerais as
with base_boletos as (
  select b.clinica_id,
         b.mes_ref,
         to_date(b.mes_ref, 'YYYY-MM') as mes_ref_date,
         b.qtde as qtde_boletos,
         b.valor_total as valor_total_emitido,
         b.created_at,
         row_number() over (partition by b.clinica_id, b.mes_ref order by b.created_at desc) as rn
  from boletos_emitidos b
),
base_taxa_venc as (
  select t.clinica_id,
         t.mes_ref,
         to_date(t.mes_ref, 'YYYY-MM') as mes_ref_date,
         t.taxa as taxa_pago_no_vencimento,
         t.created_at,
         row_number() over (partition by t.clinica_id, t.mes_ref order by t.created_at desc) as rn
  from taxa_pago_no_vencimento t
),
base_tempo_pag as (
  select p.clinica_id,
         p.mes_ref,
         to_date(p.mes_ref, 'YYYY-MM') as mes_ref_date,
         p.dias as tempo_medio_pagamento_dias,
         p.created_at,
         row_number() over (partition by p.clinica_id, p.mes_ref order by p.created_at desc) as rn
  from tempo_medio_pagamento p
),
base_inadimplencia as (
  select i.clinica_id,
         i.mes_ref,
         to_date(i.mes_ref, 'YYYY-MM') as mes_ref_date,
         i.taxa as taxa_inadimplencia,
         i.created_at,
         row_number() over (partition by i.clinica_id, i.mes_ref order by i.created_at desc) as rn
  from inadimplencia i
)
select c.id as clinica_id,
       c.nome as clinica_nome,
       c.cnpj,
       coalesce(b.mes_ref_date, tv.mes_ref_date, tp.mes_ref_date, ina.mes_ref_date) as mes_ref_date,
       to_char(coalesce(b.mes_ref_date, tv.mes_ref_date, tp.mes_ref_date, ina.mes_ref_date)::timestamptz, 'YYYY-MM') as mes_ref,
       b.qtde_boletos,
       b.valor_total_emitido,
       case
         when b.qtde_boletos > 0 then b.valor_total_emitido / b.qtde_boletos::numeric
         else null::numeric
       end as valor_medio_boleto,
       tv.taxa_pago_no_vencimento,
       tp.tempo_medio_pagamento_dias,
       ina.taxa_inadimplencia
from clinicas c
left join base_boletos b on b.clinica_id = c.id and b.rn = 1
left join base_taxa_venc tv on tv.clinica_id = c.id and tv.mes_ref = b.mes_ref and tv.rn = 1
left join base_tempo_pag tp on tp.clinica_id = c.id and tp.mes_ref = b.mes_ref and tp.rn = 1
left join base_inadimplencia ina on ina.clinica_id = c.id and ina.mes_ref = b.mes_ref and ina.rn = 1
where b.rn = 1
order by c.nome, coalesce(b.mes_ref_date, tv.mes_ref_date, tp.mes_ref_date, ina.mes_ref_date);

-- 2) vw_score_credito (sem external_id)
create or replace view public.vw_score_credito as
with ind as (
  select
    clinica_id,
    clinica_nome,
    cnpj,
    mes_ref_date,
    mes_ref,
    qtde_boletos,
    valor_total_emitido,
    valor_medio_boleto,
    taxa_pago_no_vencimento,
    tempo_medio_pagamento_dias,
    taxa_inadimplencia
  from vw_indicadores_gerais
),
parc as (
  select
    clinica_id,
    mes_ref,
    mes_ref_date,
    qtde_registros,
    media_parcelas_pond,
    max_parcelas_mes,
    norm_parcelas
  from vw_parcelamentos
),
global_max as (
  select max(ind.taxa_inadimplencia) as max_inadimplencia,
         max(ind.valor_medio_boleto) as max_valor_medio
  from ind
),
base as (
  select
    i.clinica_id,
    i.clinica_nome,
    i.cnpj,
    i.mes_ref,
    i.mes_ref_date,
    i.qtde_boletos,
    i.valor_total_emitido,
    i.valor_medio_boleto,
    i.taxa_pago_no_vencimento,
    i.tempo_medio_pagamento_dias,
    i.taxa_inadimplencia,
    p.qtde_registros,
    p.media_parcelas_pond,
    p.max_parcelas_mes,
    p.norm_parcelas,
    gm.max_inadimplencia,
    gm.max_valor_medio
  from ind i
  left join parc p on p.clinica_id = i.clinica_id and p.mes_ref = i.mes_ref
  cross join global_max gm
),
norm as (
  select
    base.*,
    case
      when base.max_inadimplencia > 0 and base.taxa_inadimplencia is not null
        then greatest(0, least(1, 1 - (base.taxa_inadimplencia / base.max_inadimplencia)))
      else null::numeric
    end as norm_inadimplencia,
    case
      when base.max_valor_medio > 0 and base.valor_medio_boleto is not null
        then greatest(0, least(1, base.valor_medio_boleto / base.max_valor_medio))
      else null::numeric
    end as norm_valor_medio
  from base
),
score_calc as (
  select
    norm.*,
    ((0.5 * norm.norm_inadimplencia) + (0.3 * norm.norm_parcelas) + (0.2 * norm.norm_valor_medio)) as score_credito
  from norm
),
score_m1 as (
  select
    s1.*,
    (select s2.score_credito
       from score_calc s2
      where s2.clinica_id = s1.clinica_id
        and s2.mes_ref_date = (s1.mes_ref_date - interval '1 mon')
      limit 1) as score_mes_anterior
  from score_calc s1
),
final as (
  select
    score_m1.clinica_id,
    score_m1.clinica_nome,
    score_m1.cnpj,
    score_m1.mes_ref,
    score_m1.mes_ref_date,
    score_m1.qtde_boletos,
    score_m1.valor_total_emitido,
    score_m1.valor_medio_boleto,
    score_m1.taxa_pago_no_vencimento,
    score_m1.tempo_medio_pagamento_dias,
    score_m1.taxa_inadimplencia,
    score_m1.qtde_registros,
    score_m1.media_parcelas_pond,
    score_m1.max_parcelas_mes,
    score_m1.norm_parcelas,
    score_m1.max_inadimplencia,
    score_m1.max_valor_medio,
    score_m1.norm_inadimplencia,
    score_m1.norm_valor_medio,
    score_m1.score_credito,
    score_m1.score_mes_anterior,
    (score_m1.score_credito - score_m1.score_mes_anterior) as score_variacao_vs_m1,
    case
      when score_m1.score_credito >= 0.80 then 'A (Excelente)'
      when score_m1.score_credito >= 0.60 then 'B (Bom)'
      when score_m1.score_credito >= 0.45 then 'C (Regular)'
      when score_m1.score_credito >= 0.30 then 'D (Ruim)'
      else 'E (Crítico)'
    end as categoria_risco
  from score_m1
)
select *
from final
order by clinica_id, mes_ref_date;

-- 3) vw_dashboard_final (sem external_id)
create or replace view public.vw_dashboard_final as
with ind as (
  select
    clinica_id,
    clinica_nome,
    cnpj,
    mes_ref_date,
    mes_ref,
    qtde_boletos,
    valor_total_emitido,
    valor_medio_boleto,
    taxa_pago_no_vencimento,
    tempo_medio_pagamento_dias,
    taxa_inadimplencia
  from vw_indicadores_gerais
),
parc as (
  select
    clinica_id,
    mes_ref,
    mes_ref_date,
    qtde_registros,
    media_parcelas_pond,
    max_parcelas_mes,
    norm_parcelas
  from vw_parcelamentos
),
pag as (
  select
    clinica_id,
    mes_ref,
    mes_ref_date,
    taxa_pago_no_vencimento,
    tempo_medio_pagamento_dias,
    percentual_faixa_0_30,
    percentual_faixa_31_60,
    percentual_faixa_61_90,
    percentual_faixa_90_plus
  from vw_pagamentos
),
score as (
  select * from vw_score_credito
),
limite as (
  select
    cl.clinica_id,
    cl.limite_aprovado,
    cl.faturamento_base,
    cl.score_base,
    cl.aprovado_em,
    cl.aprovado_por,
    cl.observacao,
    row_number() over (partition by cl.clinica_id order by cl.aprovado_em desc) as rn
  from clinica_limite cl
)
select
  s.clinica_id,
  s.clinica_nome,
  s.cnpj,
  s.mes_ref,
  s.mes_ref_date,
  i.qtde_boletos,
  i.valor_total_emitido,
  i.valor_medio_boleto,
  i.taxa_pago_no_vencimento,
  i.tempo_medio_pagamento_dias,
  i.taxa_inadimplencia,
  p.qtde_registros as parc_qtde_registros,
  p.media_parcelas_pond as parc_media_parcelas_pond,
  p.max_parcelas_mes as parc_max_parcelas_mes,
  p.norm_parcelas as parc_norm_parcelas,
  pg.taxa_pago_no_vencimento as pag_taxa_pago_no_vencimento,
  pg.tempo_medio_pagamento_dias as pag_tempo_medio_pagamento_dias,
  pg.percentual_faixa_0_30,
  pg.percentual_faixa_31_60,
  pg.percentual_faixa_61_90,
  pg.percentual_faixa_90_plus,
  s.norm_inadimplencia,
  s.norm_parcelas as score_norm_parcelas,
  s.norm_valor_medio,
  s.score_credito,
  s.score_mes_anterior,
  s.score_variacao_vs_m1,
  s.categoria_risco,
  l.limite_aprovado,
  l.faturamento_base,
  l.score_base,
  l.aprovado_em as limite_aprovado_em,
  l.aprovado_por,
  l.observacao as limite_observacao
from score s
left join ind i on i.clinica_id = s.clinica_id and i.mes_ref = s.mes_ref
left join parc p on p.clinica_id = s.clinica_id and p.mes_ref = s.mes_ref
left join pag pg on pg.clinica_id = s.clinica_id and pg.mes_ref = s.mes_ref
left join limite l on l.clinica_id = s.clinica_id and l.rn = 1
order by s.clinica_nome, s.mes_ref_date;

-- 4) dropar coluna
alter table public.clinicas drop column if exists external_id;
