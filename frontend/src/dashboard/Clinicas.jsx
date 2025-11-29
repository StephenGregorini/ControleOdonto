import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../apiConfig";

export default function Clinicas() {
  const [clinicas, setClinicas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ===========================
  // 1) Carregar lista de clínicas
  // ===========================
  async function carregarClinicas() {
    try {
      setLoading(true);

      const r = await fetch(`${API_BASE_URL}/dashboard/clinicas`);
      const lista = await r.json();

      // 2) Para cada clínica, buscar KPIs do dashboard
      const enriched = await Promise.all(
        lista.map(async (c) => {
          try {
            const r2 = await fetch(`${API_BASE_URL}/dashboard?clinica_id=${c.id}`);
            const dash = await r2.json();

            return {
              ...c,
              score: dash.kpis?.score_atual ?? null,
              categoria: dash.kpis?.categoria_risco ?? null,
              limite_aprovado: dash.kpis?.limite_aprovado ?? null,
              limite_sugerido: dash.kpis?.limite_sugerido ?? null,
              inad_12m: dash.kpis?.inadimplencia_media_12m ?? null,
              ticket_12m: dash.kpis?.ticket_medio_12m ?? null,
              emissao_ultimo_mes: dash.kpis?.valor_total_emitido_ultimo_mes ?? null,
            };
          } catch (err) {
            console.error("Erro ao carregar dashboard da clínica:", err);
            return c;
          }
        })
      );

      // ordena por categoria (A→E) e score desc
      enriched.sort((a, b) => {
        const catOrder = { A: 1, B: 2, C: 3, D: 4, E: 5 };
        const c1 = catOrder[a.categoria] || 999;
        const c2 = catOrder[b.categoria] || 999;

        if (c1 !== c2) return c1 - c2;
        return (b.score ?? 0) - (a.score ?? 0);
      });

      setClinicas(enriched);
    } catch (e) {
      console.error("Erro ao carregar clínicas:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarClinicas();
  }, []);

  // ===========================
  //  Filtragem
  // ===========================
  const filtradas = clinicas.filter((c) =>
    (c.nome || "").toLowerCase().includes(filtro.toLowerCase())
  );

  // ===========================
  // Badge categoria
  // ===========================
  function CategoriaBadge({ cat }) {
    const colors = {
      A: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      B: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      C: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      D: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      E: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[11px] border ${colors[cat] ||
          "bg-slate-700/40 text-slate-300 border-slate-600"
          }`}
      >
        {cat || "-"}
      </span>
    );
  }

  // ===========================
  // Currency formatter
  // ===========================
  const fmt = (v) =>
    v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";

  const fmtPct = (v) =>
    v !== null && v !== undefined ? `${(v * 100).toFixed(1)}%` : "-";

  // ===========================  
  // RENDER
  // ===========================
  return (
    <section className="space-y-6">

      <h2 className="text-slate-300 text-sm uppercase font-semibold tracking-wide">
        Portfólio de Clínicas
      </h2>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-10 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
          placeholder="Buscar clínica..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-slate-500 text-sm">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhuma clínica encontrada.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {filtradas.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-sky-500/40 transition cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-slate-200 font-semibold text-lg group-hover:text-sky-300">
                  {c.nome}
                </p>
                <CategoriaBadge cat={c.categoria} />
              </div>

              {c.cnpj && (
                <p className="text-[11px] text-slate-500 mt-1">{c.cnpj}</p>
              )}

              <div className="mt-4 space-y-1 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">Score:</span>{" "}
                  <span className="text-sky-300 font-medium">
                    {c.score?.toFixed(3) || "-"}
                  </span>
                </p>

                <p>
                  <span className="text-slate-500">Limite aprovado:</span>{" "}
                  <span className="text-emerald-300">{fmt(c.limite_aprovado)}</span>
                </p>

                <p>
                  <span className="text-slate-500">Sugestão:</span>{" "}
                  <span className="text-sky-300">{fmt(c.limite_sugerido)}</span>
                </p>

                <p>
                  <span className="text-slate-500">Inadimplência 12M:</span>{" "}
                  <span className="text-rose-300">{fmtPct(c.inad_12m)}</span>
                </p>

                <p>
                  <span className="text-slate-500">Ticket médio:</span>{" "}
                  <span className="text-sky-300">{fmt(c.ticket_12m)}</span>
                </p>

                <p>
                  <span className="text-slate-500">Último faturamento:</span>{" "}
                  <span className="text-slate-200">{fmt(c.emissao_ultimo_mes)}</span>
                </p>
              </div>

              <button
                onClick={() => navigate(`/admin/dashboard?clinica=${c.id}`)}
                className="mt-4 w-full px-3 py-2 rounded-xl text-[12px] border border-sky-500 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 transition"
              >
                Abrir Dashboard
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
