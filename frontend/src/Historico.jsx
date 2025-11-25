import React, { useEffect, useState } from "react";

export default function Historico() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/historico");
        const json = await res.json();
        setItems(json);
      } catch (e) {
        console.error("Erro ao carregar histórico:", e);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Histórico de importações
        </h2>
        {loading && (
          <span className="text-xs text-slate-400">
            Atualizando...
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 overflow-x-auto">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhuma importação registrada ainda.
          </p>
        ) : (
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="py-2 text-left">Data</th>
                <th className="py-2 text-left">Clínica</th>
                <th className="py-2 text-left">Arquivo</th>
                <th className="py-2 text-left">Linhas</th>
                <th className="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/40 transition"
                >
                  <td className="py-2 align-top">
                    {row.criado_em
                      ? new Date(row.criado_em).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td className="py-2 align-top">
                    {row.clinica_id || "-"}
                  </td>
                  <td className="py-2 align-top">
                    {row.arquivo_nome || "-"}
                  </td>
                  <td className="py-2 align-top">
                    {row.total_linhas ?? "-"}
                  </td>
                  <td className="py-2 align-top">
                    <span
                      className={`px-2 py-1 rounded-full text-[11px] ${
                        row.status === "concluido"
                          ? "bg-emerald-600/30 text-emerald-300"
                          : "bg-rose-600/30 text-rose-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
