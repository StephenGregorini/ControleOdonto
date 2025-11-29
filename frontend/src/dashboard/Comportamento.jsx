// /dashboard/Comportamento.jsx
import React, { useMemo } from "react";
import { useDashboard } from "../DashboardContext";
import { formatCurrency, formatPercent } from "../utils/formatters";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const chartColors = {
  inad: "#fb7185",
  pagoVenc: "#22c55e",
  tempo: "#f97316",
  parcelas: "#a855f7",
};

export default function Comportamento() {
  const { dados } = useDashboard();

  if (!dados) return null;

  const k = dados.kpis || {};
  const s = dados.series || {};

  const series = useMemo(() => {
    const map = new Map();
    // inad
    s.inadimplencia_por_mes?.forEach((i) => {
      const row = map.get(i.mes_ref) || { mes_ref: i.mes_ref };
      row.inad = i.taxa_inadimplencia;
      map.set(i.mes_ref, row);
    });
    // pago venc
    s.taxa_pago_no_vencimento_por_mes?.forEach((i) => {
      const row = map.get(i.mes_ref) || { mes_ref: i.mes_ref };
      row.pagoVenc = i.taxa_pago_no_vencimento;
      map.set(i.mes_ref, row);
    });
    return [...map.values()].sort((a, b) =>
      String(a.mes_ref).localeCompare(b.mes_ref)
    );
  }, [s]);

  return (
    <section className="space-y-6">
      <h2 className="text-slate-300 text-sm uppercase font-semibold tracking-wide">
        03 · Comportamento de pagamento
      </h2>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <p className="text-slate-400 text-xs">Inadimplência (12M)</p>
          <h3 className="text-2xl font-semibold text-rose-300">
            {formatPercent(k.inadimplencia_media_12m)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Último mês: {formatPercent(k.inadimplencia_ultimo_mes)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <p className="text-slate-400 text-xs">Pago no vencimento</p>
          <h3 className="text-2xl font-semibold text-emerald-300">
            {formatPercent(k.taxa_pago_no_vencimento_media_12m)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Último mês:{" "}
            <span className="text-emerald-300">
              {formatPercent(k.taxa_pago_no_vencimento_ultimo_mes)}
            </span>
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <p className="text-slate-400 text-xs">Ticket médio</p>
          <h3 className="text-2xl font-semibold text-sky-300">
            {formatCurrency(k.ticket_medio_12m)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Último mês: {formatCurrency(k.ticket_medio_ultimo_mes)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <p className="text-slate-400 text-xs">Dias médios após vencimento</p>
          <h3 className="text-2xl font-semibold text-slate-50">
            {k.tempo_medio_pagamento_media_12m?.toFixed(1) ?? "-"} dias
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Último mês:{" "}
            {k.tempo_medio_pagamento_ultimo_mes?.toFixed(1) ?? "-"} dias
          </p>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <h3 className="text-slate-300 text-xs mb-3">Inadimplência x Pago no vencimento</h3>

        {series.length === 0 ? (
          <p className="text-slate-500 text-xs">Sem dados.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="mes_ref" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip />
                <Line type="monotone" dataKey="inad" stroke={chartColors.inad} strokeWidth={2} />
                <Line type="monotone" dataKey="pagoVenc" stroke={chartColors.pagoVenc} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
