import React from "react";
import { useDashboard } from "../DashboardContext";
import { formatCurrency, formatPercent, formatMesRef } from "../utils/formatters";
import HistoricoLimites from "../components/ui/HistoricoLimites";

export default function DecisaoCredito() {
  const { dados, setPanelLimiteAberto, clinicaId } = useDashboard();

  if (!dados) return null;

  const k = dados.kpis || {};
  const limite = dados.limite_motor || {};
  const historico = dados.historico_limite || [];

  // ----------------------------
  // LÓGICA CORRIGIDA DO LIMITE
  // ----------------------------

  const nuncaTeveLimite = historico.length === 0;

  // ultimoEvento é o mais recente – backend deve vir ordenado
  const ultimoEvento = historico[0] || null;

  // Se houver histórico e o último evento tiver limite_aprovado null → revogado
  const foiRevogado = !!ultimoEvento && ultimoEvento.limite_aprovado === null;

  // Se houver limite_aprovado atual no kpis → é o limite ativo
  const limiteAtualAtivo =
    k.limite_aprovado != null && !Number.isNaN(k.limite_aprovado);

  return (
    <section className="space-y-6">

      {/* TÍTULO */}
      <h2 className="text-slate-300 text-sm uppercase font-semibold tracking-wide">
        02 · Decisão de crédito
      </h2>

      {/* GRID PRINCIPAL */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* SCORE */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
          <p className="text-slate-400 text-xs mb-1">Score ajustado</p>
          <h3 className="text-3xl font-semibold text-sky-300">
            {k.score_atual?.toFixed(3) ?? "-"}
          </h3>
          <p className="text-[11px] text-slate-500">
            Categoria: <span className="text-emerald-300">{k.categoria_risco}</span>
          </p>
        </div>

        {/* LIMITE APROVADO */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-xs">Limite aprovado</p>

            {clinicaId !== "todas" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPanelLimiteAberto(true)}
                  className="px-3 py-1.5 rounded-full text-[11px] border border-sky-500 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
                >
                  Aprovar limite
                </button>
              </div>
            )}
          </div>

          {/* Caso 1 — Nunca teve limite aprovado */}
          {nuncaTeveLimite && (
            <div className="inline-flex items-center gap-2 mt-2">
              <span className="text-slate-400 text-sm">Sem limite aprovado</span>
            </div>
          )}

          {/* Caso 2 — Já teve limite e foi revogado */}
          {!nuncaTeveLimite && foiRevogado && (
            <div className="inline-flex items-center gap-2 mt-2">
              <span className="text-slate-400 text-sm">Sem limite ativo</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Revogado
              </span>
            </div>
          )}

          {/* Caso 3 — Tem limite ativo */}
          {limiteAtualAtivo && (
            <>
              <h3 className="text-xl font-semibold text-emerald-300">
                {formatCurrency(k.limite_aprovado)}
              </h3>
              <p className="text-[11px] text-slate-500">
                Utilizado:{" "}
                <span className="text-slate-200">{formatCurrency(k.limite_utilizado)}</span>{" "}
                · Disponível:{" "}
                <span className="text-slate-200">{formatCurrency(k.limite_disponivel)}</span>
              </p>
            </>
          )}

          {/* Sugestão */}
          <p className="text-slate-400 text-xs mt-2">Sugestão do motor:</p>
          <p className="text-xl font-semibold text-sky-300">
            {formatCurrency(limite.limite_sugerido)}
          </p>

          {limite.limite_sugerido_fator && (
            <p className="text-[10px] text-slate-500 mt-1">
              Fator de risco aplicado: {limite.limite_sugerido_fator.toFixed(2)}
            </p>
          )}
          {limite.mes_ref_base && (
            <p className="text-[10px] text-slate-500 mt-1">
              Base fechada em: {limite.mes_ref_base}
            </p>
          )}

          {k.limite_aprovado != null && (
            <div className="mt-3 space-y-1">
              <p className="text-[11px] text-slate-500">Limite disponível</p>
              <p className="text-lg font-semibold text-emerald-300">
                {formatCurrency(k.limite_disponivel)}
              </p>
              <p className="text-[10px] text-slate-500">
                Utilizado: {formatCurrency(k.limite_utilizado || 0)}
              </p>
            </div>
          )}
        </div>

        {/* INAD + PAGO NO VENC */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
          <p className="text-slate-400 text-xs">Inadimplência real (período)</p>
          <h3 className="text-2xl font-semibold text-rose-300">
            {formatPercent(k.inadimplencia_media_periodo)}
          </h3>

          <p className="text-[11px] text-slate-500 mt-1">
            Pago no vencimento:{" "}
            <span className="text-emerald-300">
              {formatPercent(k.taxa_pago_no_vencimento_media_periodo)}
            </span>
          </p>
        </div>
      </div>

      {/* BASE DO LIMITE SUGERIDO */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
        <h3 className="text-slate-300 text-xs uppercase font-semibold mb-3">
          Como o limite sugerido é calculado
        </h3>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 mb-4">
          <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside">
            <li>Definimos o mês fechado: é o mês anterior ao último upload da clínica.</li>
            <li>Calculamos 3 bases de faturamento: média 12M, média 3M e último mês.</li>
            <li>Fazemos um mix conservador: 12M (50%), 3M (30%), último mês (20%).</li>
            <li>Aplicamos o fator de risco do score para chegar no limite bruto.</li>
            <li>Aplicamos teto dinâmico (1.5x maior base) e teto global (R$ 3.000.000).</li>
          </ol>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
          <div>
            <p>Upload mais recente:</p>
            <p className="text-slate-200 font-medium">
              {formatMesRef(limite.mes_upload_referencia)}
            </p>
          </div>

          <div>
            <p>Mês fechado da regra:</p>
            <p className="text-slate-200 font-medium">
              {formatMesRef(limite.mes_ref_regra)}
            </p>
          </div>

          <div>
            <p>Mês base usado:</p>
            <p className="text-slate-200 font-medium">
              {formatMesRef(limite.mes_ref_base)}
            </p>
          </div>

          <div>
            <p>Média mensal (12M):</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(limite.limite_sugerido_base_media12m)}
            </p>
          </div>

          <div>
            <p>Média mensal (3M):</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(limite.limite_sugerido_base_media3m)}
            </p>
          </div>

          <div>
            <p>Último mês:</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(limite.limite_sugerido_base_ultimo_mes)}
            </p>
          </div>

          <div>
            <p>Base combinada:</p>
            <p className="text-sky-300 font-medium">
              {formatCurrency(limite.limite_sugerido_base_mensal_mix)}
            </p>
          </div>

          <div>
            <p>Fator por score:</p>
            <p className="text-sky-300 font-medium">
              {limite.limite_sugerido_fator?.toFixed(2)}
            </p>
          </div>

          <div>
            <p>Teto global:</p>
            <p className="text-slate-200 font-medium">
              {formatCurrency(limite.limite_sugerido_teto_global)}
            </p>
          </div>
        </div>
      </div>

      {/* HISTÓRICO */}
      <HistoricoLimites historico={historico} />

    </section>
  );
}
