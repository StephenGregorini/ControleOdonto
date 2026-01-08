import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { API_BASE_URL } from "../apiConfig";
import PageLayout from "../components/ui/PageLayout";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { useClinicas } from "../utils/useClinicas";
import { formatCurrency, formatPercent } from "../utils/formatters";

function parseBrazilianCurrency(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function formatDateDisplay(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
}

export default function Antecipacoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { clinicas } = useClinicas();
  const [resumo, setResumo] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicaFiltro, setClinicaFiltro] = useState("");
  const [erro, setErro] = useState(null);

  const [modalNovo, setModalNovo] = useState(false);
  const [modalReembolso, setModalReembolso] = useState(false);
  const [registroReembolso, setRegistroReembolso] = useState(null);
  const [modalImport, setModalImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importMode, setImportMode] = useState("csv");
  const [forceImport, setForceImport] = useState(false);
  const [replaceImport, setReplaceImport] = useState(false);
  const [redashStatus, setRedashStatus] = useState(null);

  const [formClinica, setFormClinica] = useState("");
  const [formData, setFormData] = useState("");
  const [formLiquido, setFormLiquido] = useState("");
  const [formTaxa, setFormTaxa] = useState("");
  const [formPagar, setFormPagar] = useState("");
  const [formObs, setFormObs] = useState("");
  const [saving, setSaving] = useState(false);
  const syncUserLabel = profile?.nome || profile?.email || "admin";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clinicaParam = params.get("clinica");
    if (clinicaParam) setClinicaFiltro(clinicaParam);
  }, [location.search]);

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);
      const resumoRes = await fetch(`${API_BASE_URL}/antecipacoes/resumo`);
      if (!resumoRes.ok) throw new Error("Erro ao carregar resumo");
      const resumoJson = await resumoRes.json();
      setResumo(Array.isArray(resumoJson) ? resumoJson : []);

      const opsUrl = clinicaFiltro
        ? `${API_BASE_URL}/antecipacoes?clinica_id=${clinicaFiltro}`
        : `${API_BASE_URL}/antecipacoes`;
      const opsRes = await fetch(opsUrl);
      if (!opsRes.ok) throw new Error("Erro ao carregar operações");
      const opsJson = await opsRes.json();
      setOperacoes(Array.isArray(opsJson) ? opsJson : []);
    } catch (e) {
      setErro("Não foi possível carregar as antecipações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [clinicaFiltro]);

  useEffect(() => {
    loadRedashStatus();
  }, []);

  const resumoFiltrado = useMemo(() => {
    if (!clinicaFiltro) return resumo;
    return resumo.filter((r) => String(r.clinica_id) === String(clinicaFiltro));
  }, [resumo, clinicaFiltro]);

  const clinicaOptions = useMemo(
    () => [
      { label: "Todas as clínicas", value: "" },
      ...clinicas.map((c) => ({
        label: (() => {
          const codigo = c.codigo_clinica || c.nome || "";
          const nome = c.nome || "";
          const base = nome ? `${codigo} · ${nome}` : codigo;
          return c.cnpj ? `${base} — ${c.cnpj}` : base;
        })(),
        value: c.id,
      })),
    ],
    [clinicas]
  );

  const clinicaOptionsSelect = useMemo(
    () => [
      { label: "Selecione", value: "" },
      ...clinicas.map((c) => ({
        label: (() => {
          const codigo = c.codigo_clinica || c.nome || "";
          const nome = c.nome || "";
          const base = nome ? `${codigo} · ${nome}` : codigo;
          return c.cnpj ? `${base} — ${c.cnpj}` : base;
        })(),
        value: c.id,
      })),
    ],
    [clinicas]
  );

  const clinicaMap = useMemo(() => {
    const map = new Map();
    clinicas.forEach((c) => {
      map.set(String(c.id), c.codigo_clinica || c.nome);
    });
    return map;
  }, [clinicas]);

  const clinicaNomeRealMap = useMemo(() => {
    const map = new Map();
    clinicas.forEach((c) => {
      if (c.nome) {
        map.set(String(c.id), c.nome);
      }
    });
    return map;
  }, [clinicas]);

  const totals = useMemo(() => {
    let antecipado = 0;
    let reembolsado = 0;
    let aberto = 0;
    let saldo = 0;
    resumoFiltrado.forEach((r) => {
      antecipado += r.total_antecipado || 0;
      reembolsado += r.total_reembolsado || 0;
      aberto += r.em_aberto || 0;
      saldo += r.saldo_antecipavel || 0;
    });
    return { antecipado, reembolsado, aberto, saldo };
  }, [resumoFiltrado]);

  const openNovaAntecipacao = () => {
    setFormClinica(clinicaFiltro || "");
    setFormData(new Date().toISOString().slice(0, 10));
    setFormLiquido("");
    setFormTaxa("");
    setFormPagar("");
    setFormObs("");
    setModalNovo(true);
  };

  const openImportModal = () => {
    setImportMode("csv");
    setImportFile(null);
    setImportResult(null);
    setForceImport(false);
    setReplaceImport(false);
    setModalImport(true);
  };
  const openSyncModal = () => {
    setImportMode("redash");
    setImportFile(null);
    setImportResult(null);
    setForceImport(false);
    setReplaceImport(true);
    loadRedashStatus();
    setModalImport(true);
  };
  async function loadRedashStatus() {
    try {
      const r = await fetch(`${API_BASE_URL}/antecipacoes/redash-status`);
      if (!r.ok) return;
      const json = await r.json();
      setRedashStatus(json);
    } catch {
      setRedashStatus(null);
    }
  }

  async function salvarAntecipacao() {
    if (!formClinica) {
      setErro("Selecione uma clínica.");
      return;
    }
    const valorLiquido = parseBrazilianCurrency(formLiquido);
    if (!valorLiquido || valorLiquido <= 0) {
      setErro("Informe o valor líquido.");
      return;
    }
    try {
      setSaving(true);
      setErro(null);
      const payload = {
        clinica_id: formClinica,
        data_antecipacao: formData || null,
        valor_liquido: valorLiquido,
        valor_taxa: parseBrazilianCurrency(formTaxa) || null,
        valor_a_pagar: parseBrazilianCurrency(formPagar) || null,
        observacao: formObs || null,
      };
      const r = await fetch(`${API_BASE_URL}/antecipacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const errorJson = await r.json().catch(() => ({}));
        throw new Error(errorJson.detail || "Erro ao registrar antecipação");
      }
      setModalNovo(false);
      await carregar();
    } catch (e) {
      setErro(e.message || "Erro ao registrar antecipação.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmarReembolso() {
    if (!registroReembolso) return;
    try {
      setSaving(true);
      setErro(null);
      const r = await fetch(
        `${API_BASE_URL}/antecipacoes/${registroReembolso.id}/reembolso`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data_reembolso: new Date().toISOString().slice(0, 10) }),
        }
      );
      if (!r.ok) {
        const errorJson = await r.json().catch(() => ({}));
        throw new Error(errorJson.detail || "Erro ao marcar reembolso");
      }
      setModalReembolso(false);
      setRegistroReembolso(null);
      await carregar();
    } catch (e) {
      setErro(e.message || "Erro ao marcar reembolso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImportCsv() {
    if (!importFile) {
      setErro("Selecione um arquivo CSV.");
      return;
    }
    try {
      setSaving(true);
      setErro(null);
      const formData = new FormData();
      formData.append("file", importFile);
      const r = await fetch(`${API_BASE_URL}/antecipacoes/import-csv`, {
        method: "POST",
        body: formData,
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (json?.detail && typeof json.detail === "object") {
          setErro(json.detail.message || "Erro ao importar CSV.");
          setImportResult({
            missing_clinicas: json.detail.missing_clinicas || [],
          });
          return;
        }
        throw new Error(json.detail || "Erro ao importar CSV.");
      }
      setImportResult(json);
      await carregar();
    } catch (e) {
      setErro(e.message || "Erro ao importar CSV.");
    } finally {
      setSaving(false);
    }
  }
  async function handleImportRedash() {
    try {
      setSaving(true);
      setErro(null);
      const params = new URLSearchParams();
      if (forceImport) params.set("force", "true");
      if (replaceImport) params.set("replace", "true");
      const who = profile?.nome || profile?.email;
      if (who) params.set("registered_by", who);
      const url = params.toString()
        ? `${API_BASE_URL}/antecipacoes/import-redash?${params.toString()}`
        : `${API_BASE_URL}/antecipacoes/import-redash`;
      const r = await fetch(url, {
        method: "POST",
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (json?.detail && typeof json.detail === "object") {
          setErro(json.detail.message || "Erro ao sincronizar Redash.");
          setImportResult({
            missing_clinicas: json.detail.missing_clinicas || [],
          });
          return;
        }
        throw new Error(json.detail || "Erro ao sincronizar Redash.");
      }
      setImportResult(json);
      await carregar();
    } catch (e) {
      setErro(e.message || "Erro ao sincronizar Redash.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Antecipações
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-3xl">
            Controle de antecipações por clínica, com governança de limite aprovado.
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Última sincronização Redash:{" "}
            <span className="text-slate-300">
              {redashStatus?.last_sync ? formatDateDisplay(redashStatus.last_sync) : "-"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNovaAntecipacao}
            className="px-4 py-2 rounded-xl text-sm border border-sky-500 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
          >
            Nova antecipação
          </button>
          <button
            onClick={openSyncModal}
            className="px-4 py-2 rounded-xl text-sm border border-emerald-500/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
          >
            Sincronizar Redash
          </button>
          <button
            onClick={openImportModal}
            className="px-4 py-2 rounded-xl text-sm border border-sky-500/70 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 transition"
          >
            Importar CSV
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Select
            value={clinicaFiltro}
            onChange={setClinicaFiltro}
            searchable
            searchPlaceholder="Buscar código, nome ou CNPJ..."
            options={clinicaOptions}
          />
        </div>
        {clinicaFiltro && (
          <button
            onClick={() => navigate(`/admin/dashboard?clinica=${clinicaFiltro}`)}
            className="text-xs text-slate-300 underline hover:text-sky-300"
          >
            Abrir dashboard da clínica
          </button>
        )}
      </div>

      {erro && (
        <div className="mb-6 rounded-lg px-4 py-3 text-xs border bg-rose-900/40 border-rose-500/60 text-rose-100">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-slate-500">Total antecipado</p>
          <p className="text-slate-100 text-sm font-semibold mt-1">
            {formatCurrency(totals.antecipado)}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-slate-500">Total reembolsado</p>
          <p className="text-slate-100 text-sm font-semibold mt-1">
            {formatCurrency(totals.reembolsado)}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-slate-500">Em aberto</p>
          <p className="text-amber-300 text-sm font-semibold mt-1">
            {formatCurrency(totals.aberto)}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-slate-500">Saldo antecipável</p>
          <p className="text-emerald-300 text-sm font-semibold mt-1">
            {formatCurrency(totals.saldo)}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-8">
        <h3 className="text-slate-300 text-sm uppercase font-semibold tracking-wide mb-3">
          Resumo por clínica
        </h3>
        {loading ? (
          <p className="text-slate-500 text-sm">Carregando...</p>
        ) : resumoFiltrado.length === 0 ? (
          <p className="text-slate-500 text-sm">Sem dados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">Código</th>
                  <th className="py-2 pr-3">CNPJ</th>
                  <th className="py-2 pr-3 text-right">Limite aprovado</th>
                  <th className="py-2 pr-3 text-right">Antecipado</th>
                  <th className="py-2 pr-3 text-right">Reembolsado</th>
                  <th className="py-2 pr-3 text-right">Em aberto</th>
                  <th className="py-2 pr-3 text-right">Saldo antecipável</th>
                  <th className="py-2 pr-3 text-right">% antecipável</th>
                </tr>
              </thead>
              <tbody>
                {resumoFiltrado.map((row) => (
                  <tr key={row.clinica_id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3">
                      <div className="flex flex-col">
                        <span>
                          {row.clinica_nome ||
                            clinicaMap.get(String(row.clinica_id)) ||
                            row.cnpj ||
                            row.clinica_id}
                        </span>
                        {(row.clinica_nome_real ||
                          clinicaNomeRealMap.get(String(row.clinica_id))) && (
                          <span className="text-[11px] text-slate-500">
                            {row.clinica_nome_real ||
                              clinicaNomeRealMap.get(String(row.clinica_id))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {row.cnpj || "-"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(row.limite_aprovado)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(row.total_antecipado)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(row.total_reembolsado)}
                    </td>
                    <td className="py-2 pr-3 text-right text-amber-300">
                      {formatCurrency(row.em_aberto)}
                    </td>
                    <td className="py-2 pr-3 text-right text-emerald-300">
                      {formatCurrency(row.saldo_antecipavel)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatPercent(row.percent_antecipavel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-slate-300 text-sm uppercase font-semibold tracking-wide mb-3">
          Operações
        </h3>
        {loading ? (
          <p className="text-slate-500 text-sm">Carregando...</p>
        ) : operacoes.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhuma operação registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">Código</th>
                  <th className="py-2 pr-3">CNPJ</th>
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3 text-right">Valor líquido</th>
                  <th className="py-2 pr-3 text-right">Taxa</th>
                  <th className="py-2 pr-3 text-right">A pagar</th>
                  <th className="py-2 pr-3">Reembolso</th>
                  <th className="py-2 pr-3">Redash ID</th>
                  <th className="py-2 pr-3">Registrado por</th>
                  <th className="py-2 pr-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {operacoes.map((op) => (
                  <tr key={op.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3">
                      <div className="flex flex-col">
                        <span>
                          {clinicaMap.get(String(op.clinica_id)) ||
                            op.cnpj ||
                            op.clinica_id}
                        </span>
                        {clinicaNomeRealMap.get(String(op.clinica_id)) && (
                          <span className="text-[11px] text-slate-500">
                            {clinicaNomeRealMap.get(String(op.clinica_id))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {op.cnpj || "-"}
                    </td>
                    <td className="py-2 pr-3">{formatDateDisplay(op.data_antecipacao)}</td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(op.valor_liquido)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(op.valor_taxa)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(op.valor_a_pagar)}
                    </td>
                    <td className="py-2 pr-3">
                      {op.data_reembolso ? formatDateDisplay(op.data_reembolso) : "Em aberto"}
                    </td>
                    <td className="py-2 pr-3 text-slate-400">{op.redash_id || "-"}</td>
                    <td className="py-2 pr-3 text-slate-400">
                      {op.registrado_por || "-"}
                    </td>
                    <td className="py-2 pr-3 text-center">
                      {!op.data_reembolso && (
                        <button
                          onClick={() => {
                            setRegistroReembolso(op);
                            setModalReembolso(true);
                          }}
                          className="text-emerald-300 hover:underline"
                        >
                          Marcar reembolso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalNovo} onClose={() => setModalNovo(false)}>
        <h3 className="text-lg font-semibold text-slate-100">
          Nova antecipação
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Clínica
            </label>
            <Select
              value={formClinica}
              onChange={setFormClinica}
              searchable
              searchPlaceholder="Buscar código, nome ou CNPJ..."
              options={clinicaOptionsSelect}
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Data da antecipação
            </label>
            <input
              type="date"
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Valor líquido (net)
            </label>
            <input
              type="text"
              value={formLiquido}
              onChange={(e) => setFormLiquido(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
              placeholder="Ex.: 12.500,00"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Taxa
            </label>
            <input
              type="text"
              value={formTaxa}
              onChange={(e) => setFormTaxa(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
              placeholder="Ex.: 350,00"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Valor a pagar
            </label>
            <input
              type="text"
              value={formPagar}
              onChange={(e) => setFormPagar(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
              placeholder="Ex.: 12.850,00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">
              Observação
            </label>
            <textarea
              rows={3}
              value={formObs}
              onChange={(e) => setFormObs(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 resize-none"
              placeholder="Observação opcional"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setModalNovo(false)}
            className="px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={salvarAntecipacao}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm border border-emerald-500 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Registrar"}
          </button>
        </div>
      </Modal>

      <Modal open={modalReembolso} onClose={() => setModalReembolso(false)}>
        <h3 className="text-lg font-semibold text-slate-100">
          Marcar reembolso
        </h3>
        <p className="text-slate-400 text-sm mt-2">
          Confirma o reembolso desta antecipação? A data será registrada como hoje.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setModalReembolso(false)}
            className="px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarReembolso}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm border border-emerald-500 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Confirmar reembolso"}
          </button>
        </div>
      </Modal>

      <Modal open={modalImport} onClose={() => setModalImport(false)}>
        <h3 className="text-lg font-semibold text-slate-100">
          {importMode === "csv"
            ? "Importar antecipações (CSV)"
            : "Sincronizar antecipações (Redash)"}
        </h3>
        {importMode === "csv" ? (
          <>
            <p className="text-slate-400 text-sm mt-2">
              O CSV deve conter as colunas: CNPJ, Data Antecipação, MoneyDetails_Net,
              MoneyDetails_Fee, MoneyDetails_ToBePaid e Data Reembolso.
            </p>
            <div className="mt-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-200"
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm mt-2">
              A sincronização busca o CSV direto no Redash e aplica as mesmas regras de
              governança (limite aprovado e saldo).
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Última sincronização:{" "}
              <span className="text-slate-300">
                {redashStatus?.last_sync
                  ? formatDateDisplay(redashStatus.last_sync)
                  : "-"}
              </span>
            </p>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={replaceImport}
                onChange={(e) => setReplaceImport(e.target.checked)}
              />
              Substituir base Redash (limpa e importa tudo)
            </label>
            <p className="text-[10px] text-slate-500 mt-1">
              Remove apenas antecipações vindas do Redash antes de importar.
            </p>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={forceImport}
                onChange={(e) => setForceImport(e.target.checked)}
              />
              Ignorar validação de limite aprovado
            </label>
          </>
        )}

        {importResult && (
          <div className="mt-4 text-xs text-slate-300 border border-slate-800 rounded-lg p-3">
            <p>Inseridas: {importResult.inserted}</p>
            <p>Ignoradas: {importResult.skipped}</p>
            {importResult.total_rows != null && (
              <p>Total de linhas: {importResult.total_rows}</p>
            )}
            {importMode === "redash" && (
              <p className="text-[11px] text-slate-500 mt-1">
                Sincronizado por:{" "}
                <span className="text-slate-300">{syncUserLabel}</span>
              </p>
            )}
            {Array.isArray(importResult.missing_clinicas) &&
              importResult.missing_clinicas.length > 0 && (
                <div className="mt-3 text-amber-300">
                  <p className="text-[11px] uppercase tracking-wide">
                    Clínicas sem limite aprovado
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={() => navigate("/admin/clinicas")}
                      className="text-[11px] underline text-sky-300 hover:text-sky-200"
                    >
                      Ir para Clínicas para aprovar limites
                    </button>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {importResult.missing_clinicas.map((row, idx) => (
                      <li key={`${row.clinica_id}-${idx}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span>
                            {row.clinica_nome || row.cnpj || row.clinica_id} —{" "}
                            {row.linhas || 0} linhas
                          </span>
                          {row.clinica_nome_real && (
                            <span className="text-[11px] text-slate-400">
                              {row.clinica_nome_real}
                            </span>
                          )}
                          {row.clinica_id && (
                            <button
                              onClick={() =>
                                navigate(`/admin/dashboard?clinica=${row.clinica_id}`)
                              }
                              className="text-[11px] underline text-sky-300 hover:text-sky-200"
                            >
                              Abrir dashboard
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
              <div className="mt-2 text-amber-300">
                <p className="text-[11px] uppercase tracking-wide">Erros (primeiros 20)</p>
                <ul className="mt-1 space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <li key={`${err.linha}-${idx}`}>
                      Linha {err.linha}: {err.cnpj || "-"} — {err.erro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setModalImport(false)}
            className="px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={importMode === "csv" ? handleImportCsv : handleImportRedash}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm border border-emerald-500 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {saving
              ? importMode === "csv"
                ? "Importando..."
                : "Sincronizando..."
              : importMode === "csv"
              ? "Importar"
              : "Sincronizar"}
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}
