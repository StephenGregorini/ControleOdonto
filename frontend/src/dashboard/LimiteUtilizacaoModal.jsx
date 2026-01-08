import React, { useEffect, useState } from "react";
import Modal from "../components/ui/Modal";
import { API_BASE_URL } from "../apiConfig";
import { useDashboard } from "../DashboardContext";
import { formatCurrency } from "../utils/formatters";

function parseBrazilianCurrency(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function formatDateInput(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function LimiteUtilizacaoModal({
  open,
  onClose,
  clinicaId,
  limiteAprovado,
  limiteUtilizado,
  onSaved,
}) {
  const { profile } = useDashboard();
  const [valor, setValor] = useState("");
  const [dataRef, setDataRef] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    if (!open || !clinicaId) return;
    setDataRef(formatDateInput(new Date()));
    carregarHistorico();
  }, [open, clinicaId]);

  async function carregarHistorico() {
    try {
      setLoading(true);
      setErro(null);
      const r = await fetch(`${API_BASE_URL}/clinicas/${clinicaId}/limite_utilizacao`);
      if (!r.ok) throw new Error("Erro ao carregar histórico");
      const json = await r.json();
      setHistorico(Array.isArray(json) ? json : []);
    } catch (e) {
      setErro("Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvar() {
    if (limiteAprovado == null) {
      setErro("Aprove um limite antes de registrar uso.");
      return;
    }
    const numericValue = parseBrazilianCurrency(valor);
    const disponivel = Math.max((limiteAprovado || 0) - (limiteUtilizado || 0), 0);
    if (!numericValue || numericValue <= 0) {
      setErro("Informe um valor válido para o uso.");
      return;
    }
    if (numericValue > disponivel) {
      setErro("Valor utilizado excede o limite disponível.");
      return;
    }
    try {
      setSaving(true);
      setErro(null);
      const payload = {
        valor_utilizado: numericValue,
        data_referencia: dataRef || null,
        observacao: obs || null,
        registrado_por: profile?.nome || profile?.email || "admin",
      };
      const r = await fetch(
        `${API_BASE_URL}/clinicas/${clinicaId}/limite_utilizacao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!r.ok) throw new Error("Erro ao salvar");
      await carregarHistorico();
      if (onSaved) await onSaved();
      setValor("");
      setObs("");
    } catch (e) {
      setErro("Erro ao registrar uso.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Registrar uso de limite
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Use este painel para registrar o consumo do limite aprovado.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
            <p>
              Limite aprovado:{" "}
              <span className="text-slate-200">{formatCurrency(limiteAprovado)}</span>
            </p>
            <p className="mt-1">
              Limite utilizado:{" "}
              <span className="text-slate-200">{formatCurrency(limiteUtilizado)}</span>
            </p>
            <p className="mt-1">
              Limite disponível:{" "}
              <span className="text-slate-200">
                {formatCurrency(Math.max((limiteAprovado || 0) - (limiteUtilizado || 0), 0))}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Valor utilizado (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              placeholder="Ex.: 12.500,00"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Data de referência
            </label>
            <input
              type="date"
              value={dataRef}
              onChange={(e) => setDataRef(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Observação (opcional)
            </label>
            <textarea
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-[11px] text-slate-100 outline-none focus:border-sky-500 resize-none"
              placeholder="Ex.: uso de limite no lote X..."
            />
          </div>

          {limiteAprovado == null && (
            <div className="rounded-lg px-3 py-2 text-xs border bg-amber-900/40 border-amber-500/60 text-amber-100">
              Aprove um limite antes de registrar uso.
            </div>
          )}

          {erro && (
            <div className="rounded-lg px-3 py-2 text-xs border bg-rose-900/40 border-rose-500/60 text-rose-100">
              {erro}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving || limiteAprovado == null}
              onClick={handleSalvar}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] border border-emerald-500 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Registrar uso"}
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
            Histórico recente
          </h4>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-500">Carregando...</p>
            ) : historico.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum uso registrado.</p>
            ) : (
              <ul className="space-y-2 text-xs text-slate-300">
                {historico.map((item, idx) => (
                  <li key={`${item.criado_em || "uso"}-${idx}`} className="border-b border-slate-800/60 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-100">
                        {formatCurrency(item.valor_utilizado)}
                      </span>
                      <span className="text-slate-500">
                        {formatDateInput(item.data_referencia || item.criado_em)}
                      </span>
                    </div>
                    {item.observacao && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.observacao}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
