import React, { useEffect, useState } from "react";
import { format } from "date-fns";

export default function Dados() {
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:8000";

  async function carregarHistorico() {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/historico`);
      const data = await r.json();
      setHist(data);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  return (
    <section className="space-y-6">
      <h2 className="text-slate-300 text-sm uppercase font-semibold tracking-wide">
        Dados & Importações
      </h2>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <h3 className="text-slate-300 text-xs uppercase font-semibold mb-4">
          Histórico de importações
        </h3>

        {loading ? (
          <p className="text-slate-500 text-sm">Carregando…</p>
        ) : hist.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum dado importado ainda.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 text-left">Data</th>
                <th className="py-2 pr-3 text-left">Clínica</th>
                <th className="py-2 pr-3 text-left">Arquivo</th>
                <th className="py-2 pr-3 text-left">Total Registros</th>
                <th className="py-2 pr-3 text-left">Boletos Emitidos</th>
                <th className="py-2 pr-3 text-left">Inadimplência Média</th>
              </tr>
            </thead>

            <tbody>
              {hist.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-800/40 text-slate-300"
                >
                  <td className="py-2 pr-3">
                    {row.criado_em
                      ? format(new Date(row.criado_em), "dd/MM/yyyy")
                      : "--"}
                  </td>
                  <td className="py-2 pr-3">
                    {row.clinicas?.nome || "—"}
                  </td>
                  <td className="py-2 pr-3">{row.arquivo_nome}</td>
                  <td className="py-2 pr-3">{row.total_registros}</td>
                  <td className="py-2 pr-3">{row.total_boletos_emitidos}</td>
                  <td className="py-2 pr-3">
                    {row.total_inadimplencia
                      ? (row.total_inadimplencia * 100).toFixed(1) + "%"
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
