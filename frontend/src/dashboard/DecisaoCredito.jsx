// /dashboard/DecisaoCredito.jsx
import React from "react";
import { formatCurrency, formatPercent } from "../utils/formatters";

export default function DecisaoCredito({ dados, onAbrirLimite, clinicaSelecionada }) {
  const k = dados.kpis || {};
  const h = dados.historico_limite || [];

  return (
    <section className="space-y-6">

      <h2 className="text-slate-300 text-sm uppercase font-semibold tracking-wide">
        02 · Decisão de crédito
      </h2>

      {/* GRID PRINCIPAL */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Score */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
          <p className="text-slate-400 text-xs mb-1">Score ajustado</p>
          <h3 className="text-3xl font-semibold text-sky-300">
            {k.score_atual?.toFixed(3) ?? "-"}
          </h3>
          <p className="text-[11px] text-slate-500">
            Categoria: <span className="text-slate-200">{k.categoria_risco}</span>
          </p>
        </div>

        {/* Limites */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-xs">Limite aprovado</p>
            {clinicaSelecionada && (
              <button
                onClick={onAbrirLimite}
                className="px-3 py-1.5 rounded-full text-[11px] border border-sky-500 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
              >
                Aprovar limite
              </button>
            )}
          </div>

          <h3 className="text-xl font-semibold text-emerald-300">
            {formatCurrency(k.limite_aprovado)}
          </h3>

          <p className="text-slate-400 text-xs mt-2">Sugestão do motor:</p>
          <p className="text-xl font-semibold text-sky-300">
            {formatCurrency(k.limite_sugerido)}
          </p>

          {k.limite_sugerido_fator && (
            <p className="text-[10px] text-slate-500 mt-1">
              Fator de risco aplicado: {k.limite_sugerido_fator.toFixed(2)}
            </p>
          )}
        </div>

        {/* Inad + Pago no Venc */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
          <p className="text-slate-400 text-xs">Inadimplência real (12M)</p>
          <h3 className="text-2xl font-semibold text-rose-300">
            {formatPercent(k.inadimplencia_media_12m)}
          </h3>

          <p className="text-[11px] text-slate-500 mt-1">
            Pago no vencimento:{" "}
            <span className="text-emerald-300">
              {formatPercent(k.taxa_pago_no_vencimento_media_12m)}
            </span>
          </p>
        </div>
      </div>

      {/* BASE DO LIMITE SUGERIDO */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
        <h3 className="text-slate-300 text-xs uppercase font-semibold mb-3">
          Como o limite sugerido é calculado
        </h3>

        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
          <div>
            <p>Média mensal (12M):</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(k.limite_sugerido_base_media12m)}
            </p>
          </div>

          <div>
            <p>Média mensal (3M):</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(k.limite_sugerido_base_media3m)}
            </p>
          </div>

          <div>
            <p>Último mês:</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(k.limite_sugerido_base_ultimo_mes)}
            </p>
          </div>

          <div>
            <p>Base combinada:</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(k.limite_sugerido_base_mensal_mix)}
            </p>
          </div>

          <div>
            <p>Fator por score:</p>
            <p className="text-sky-300 font-medium">
              {k.limite_sugerido_fator?.toFixed(2)}
            </p>
          </div>

          <div>
            <p>Teto global:</p>
            <p className="text-slate-200 font-medium">
              {formatCurrency(k.limite_sugerido_teto_global)}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-3">
          Cálculo conservador: 12M (50%), 3M (30%), último mês (20%).
        </p>
      </div>

    </section>
  );
}
