import React from "react";
import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatters";

export default function HistoricoLimites({ historico }) {
  if (!historico || historico.length === 0) {
    return (
      <div className="p-4 text-slate-400 text-sm">
        Nenhum histórico disponível.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-6">
        HISTÓRICO DE APROVAÇÕES DE LIMITE
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-slate-400 text-sm border-b border-slate-800">
              <th className="py-3 text-left font-medium">Data</th>
              <th className="py-3 text-left font-medium">Limite Aprovado</th>
              <th className="py-3 text-left font-medium">Aprovado Por</th>
              <th className="py-3 text-left font-medium">Observação</th>
            </tr>
          </thead>

          <tbody>
            {historico.map((row, idx) => {
              const isRevogado = row.limite_aprovado === null;

              return (
                <tr
                  key={idx}
                  className="text-slate-300 text-sm border-b border-slate-800/50"
                >
                  <td className="py-3">
                    {row.aprovado_em
                      ? format(new Date(row.aprovado_em), "dd/MM/yyyy")
                      : "--"}
                  </td>

                  <td className="py-3">
                    {isRevogado ? (
                      <span className="inline-flex items-center gap-2 px-2 py-1 text-[11px] 
                        font-medium rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        Revogado
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-medium">
                        {formatCurrency(row.limite_aprovado)}
                      </span>
                    )}
                  </td>

                  <td className="py-3">{row.aprovado_por || "--"}</td>

                  <td className="py-3 text-slate-400 text-xs">
                    {isRevogado ? "Limite revogado" : (row.observacao || "")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
