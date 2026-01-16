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
    const txt = String(value);
    const match = txt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
}

function formatDateTimeDisplay(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

function formatCountWithPercent(value, total) {
  if (!total) return `${value || 0} • 0%`;
  const percent = (value / total) * 100;
  return `${value || 0} • ${percent.toFixed(1)}%`;
}

function toggleSelection(list, key) {
  if (list.includes(key)) {
    return list.filter((item) => item !== key);
  }
  return [...list, key];
}

function diffDays(from, to) {
  if (!from || !to) return null;
  const ms = to.getTime() - from.getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0);
}

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" || typeof b === "string") {
    return String(a).localeCompare(String(b), "pt-BR");
  }
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
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
  const [activeTab, setActiveTab] = useState("resumo");
  const [missingLimitsOpen, setMissingLimitsOpen] = useState(false);
  const [missingLimitsValues, setMissingLimitsValues] = useState({});
  const [missingLimitsSuggested, setMissingLimitsSuggested] = useState({});
  const [missingLimitsError, setMissingLimitsError] = useState(null);
  const [missingLimitsSaving, setMissingLimitsSaving] = useState(false);
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
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [operacoesSort, setOperacoesSort] = useState({
    key: "data_antecipacao",
    direction: "desc",
  });
  const [resumoSort, setResumoSort] = useState({
    key: "em_aberto",
    direction: "desc",
  });
  const [resumoView, setResumoView] = useState("table");
  const [operacoesClinicaFiltro, setOperacoesClinicaFiltro] = useState(null);
  const [riscoVencimento, setRiscoVencimento] = useState([]);
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

  const statusOptions = [
    { value: "todos", label: "Todos os status" },
    { value: "Em atraso", label: "Em atraso" },
    { value: "Em aberto", label: "Em aberto" },
    { value: "Pago no prazo", label: "Pago no prazo" },
    { value: "Pago em atraso", label: "Pago em atraso" },
    { value: "Sem vencimento", label: "Sem vencimento" },
  ];

  const riscoLabels = {
    "0-7": "0-7 dias",
    "8-15": "8-15 dias",
    "16-30": "16-30 dias",
  };

  const handleSort = (setter, key) => {
    setter((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortIndicator = (config, key) => {
    if (config.key !== key) return "";
    return config.direction === "asc" ? "^" : "v";
  };

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

  const missingClinicas = Array.isArray(importResult?.missing_clinicas)
    ? importResult.missing_clinicas
    : [];

  const openMissingLimitsModal = () => {
    setMissingLimitsError(null);
    setMissingLimitsValues((prev) => {
      const next = { ...prev };
      missingClinicas.forEach((row) => {
        if (next[row.clinica_id] == null) next[row.clinica_id] = "";
      });
      return next;
    });
    setMissingLimitsOpen(true);
  };

  useEffect(() => {
    if (!missingLimitsOpen || missingClinicas.length === 0) return;
    let cancelled = false;
    const loadSuggestions = async () => {
      try {
        const entries = await Promise.all(
          missingClinicas.map(async (row) => {
            const res = await fetch(
              `${API_BASE_URL}/dashboard?meses=12&clinica_id=${row.clinica_id}`
            );
            if (!res.ok) return [row.clinica_id, null];
            const json = await res.json();
            return [row.clinica_id, json?.kpis?.limite_sugerido ?? null];
          })
        );
        if (cancelled) return;
        const suggestedMap = {};
        const valueUpdates = {};
        entries.forEach(([cid, value]) => {
          if (value != null) {
            suggestedMap[cid] = value;
            if (!missingLimitsValues[cid]) {
              valueUpdates[cid] = Number(value).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            }
          }
        });
        setMissingLimitsSuggested((prev) => ({ ...prev, ...suggestedMap }));
        if (Object.keys(valueUpdates).length > 0) {
          setMissingLimitsValues((prev) => ({ ...prev, ...valueUpdates }));
        }
      } catch {
        if (!cancelled) {
          setMissingLimitsSuggested({});
        }
      }
    };
    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [missingLimitsOpen, missingClinicas, missingLimitsValues]);

  const handleApproveMissingLimits = async () => {
    try {
      setMissingLimitsSaving(true);
      setMissingLimitsError(null);
      const approvals = [];
      for (const row of missingClinicas) {
        const rawValue = missingLimitsValues[row.clinica_id];
        const valor = parseBrazilianCurrency(rawValue);
        if (!valor || Number.isNaN(valor) || valor <= 0) {
          setMissingLimitsError("Informe um limite válido para todas as clínicas.");
          return;
        }
        approvals.push({
          clinicaId: row.clinica_id,
          limite: valor,
        });
      }
      const who = profile?.nome || profile?.email;
      await Promise.all(
        approvals.map((item) =>
          fetch(`${API_BASE_URL}/clinicas/${item.clinicaId}/limite_aprovado`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              limite_aprovado: item.limite,
              aprovado_por: who,
              observacao: "Aprovado via sincronização Redash",
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const json = await res.json().catch(() => ({}));
              throw new Error(json.detail || "Erro ao aprovar limite.");
            }
          })
        )
      );
      setMissingLimitsOpen(false);
      await handleImportRedash();
    } catch (e) {
      setMissingLimitsError(e.message || "Erro ao aprovar limites.");
    } finally {
      setMissingLimitsSaving(false);
    }
  };

  const operacoesEnriched = useMemo(() => {
    const hoje = new Date();
    return operacoes.map((op) => {
      const dataVenc = op.data_reembolso_programada
        ? new Date(op.data_reembolso_programada)
        : null;
      const dataReemb = op.data_pagamento_reembolso || op.data_reembolso
        ? new Date(op.data_pagamento_reembolso || op.data_reembolso)
        : null;
      let status = "Sem vencimento";
      let atrasoDias = 0;
      if (dataVenc) {
        if (dataReemb) {
          const atraso = diffDays(dataVenc, dataReemb);
          if (atraso != null && atraso > 0) {
            status = "Pago em atraso";
            atrasoDias = atraso;
          } else {
            status = "Pago no prazo";
            atrasoDias = 0;
          }
        } else {
          const atrasoAtual = diffDays(dataVenc, hoje);
          if (atrasoAtual != null && atrasoAtual > 0) {
            status = "Em atraso";
            atrasoDias = atrasoAtual;
          } else {
            status = "Em aberto";
            atrasoDias = 0;
          }
        }
      }
      return {
        ...op,
        status_pagamento: status,
        dias_atraso: atrasoDias,
        dias_total: dataVenc ? atrasoDias : null,
      };
    });
  }, [operacoes]);

  const inadimplenteMap = useMemo(() => {
    const map = new Map();
    operacoesEnriched.forEach((op) => {
      if (op.status_pagamento === "Em atraso") {
        map.set(String(op.clinica_id), true);
      }
    });
    return map;
  }, [operacoesEnriched]);

  const totals = useMemo(() => {
    let antecipado = 0;
    let reembolsado = 0;
    let aberto = 0;
    let saldo = 0;
    let saldoBloqueado = 0;
    resumoFiltrado.forEach((r) => {
      antecipado += r.total_antecipado || 0;
      reembolsado += r.total_reembolsado || 0;
      aberto += r.em_aberto || 0;
      const cid = String(r.clinica_id);
      const saldoClinica = r.saldo_antecipavel || 0;
      if (inadimplenteMap.get(cid)) {
        saldoBloqueado += saldoClinica;
      } else {
        saldo += saldoClinica;
      }
    });
    return { antecipado, reembolsado, aberto, saldo, saldoBloqueado };
  }, [resumoFiltrado, inadimplenteMap]);

  const reembolsoStats = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const overdue = {
      d1_7: 0,
      d8_15: 0,
      d16_30: 0,
      d31_60: 0,
      d60: 0,
    };
    const upcoming = {
      d0_7: 0,
      d8_15: 0,
      d16_30: 0,
      d31_60: 0,
      d60: 0,
    };
    const upcomingCount = {
      d0_7: 0,
      d8_15: 0,
      d16_30: 0,
      d31_60: 0,
      d60: 0,
    };
    let abertoTotal = 0;
    let abertoVencido = 0;
    let abertoEmDia = 0;
    let abertoSemVenc = 0;
    let pagoNoPrazo = 0;
    let pagoAtraso = 0;
    let abertoVencidoCount = 0;
    let abertoEmDiaCount = 0;
    let abertoSemVencCount = 0;
    let pagoNoPrazoCount = 0;
    let pagoAtrasoCount = 0;
    let atrasoDiasTotal = 0;
    let atrasoCount = 0;

    operacoesEnriched.forEach((op) => {
      const valor = Number(op.valor_liquido) || 0;
      const vencimento = toDateOnly(op.data_reembolso_programada);
      const pagamento = toDateOnly(op.data_pagamento_reembolso || op.data_reembolso);
      const isPago = Boolean(pagamento);

      if (!isPago) {
        abertoTotal += valor;
        if (vencimento) {
          if (vencimento < hoje) {
            abertoVencido += valor;
            abertoVencidoCount += 1;
            const dias = diffDays(vencimento, hoje);
            if (dias <= 7) overdue.d1_7 += valor;
            else if (dias <= 15) overdue.d8_15 += valor;
            else if (dias <= 30) overdue.d16_30 += valor;
            else if (dias <= 60) overdue.d31_60 += valor;
            else overdue.d60 += valor;
          } else {
            abertoEmDia += valor;
            abertoEmDiaCount += 1;
            const dias = diffDays(hoje, vencimento);
            if (dias <= 7) {
              upcoming.d0_7 += valor;
              upcomingCount.d0_7 += 1;
            } else if (dias <= 15) {
              upcoming.d8_15 += valor;
              upcomingCount.d8_15 += 1;
            } else if (dias <= 30) {
              upcoming.d16_30 += valor;
              upcomingCount.d16_30 += 1;
            } else if (dias <= 60) {
              upcoming.d31_60 += valor;
              upcomingCount.d31_60 += 1;
            } else {
              upcoming.d60 += valor;
              upcomingCount.d60 += 1;
            }
          }
        } else {
          abertoSemVenc += valor;
          abertoSemVencCount += 1;
        }
        return;
      }

      if (vencimento) {
        const atraso = diffDays(vencimento, pagamento);
        if (atraso > 0) {
          pagoAtraso += valor;
          pagoAtrasoCount += 1;
          atrasoDiasTotal += atraso;
          atrasoCount += 1;
        } else {
          pagoNoPrazo += valor;
          pagoNoPrazoCount += 1;
        }
      } else {
        pagoNoPrazo += valor;
        pagoNoPrazoCount += 1;
      }
    });

    const abertoComVenc = abertoVencido + abertoEmDia;
    const taxaAtraso = abertoComVenc > 0 ? abertoVencido / abertoComVenc : 0;
    const previsto30 = upcoming.d0_7 + upcoming.d8_15 + upcoming.d16_30;
    const previsto60 = previsto30 + upcoming.d31_60;
    const atrasoMedioDias = atrasoCount > 0 ? atrasoDiasTotal / atrasoCount : 0;

    return {
      overdue,
      upcoming,
      upcomingCount,
      abertoTotal,
      abertoVencido,
      abertoEmDia,
      abertoSemVenc,
      pagoNoPrazo,
      pagoAtraso,
      abertoVencidoCount,
      abertoEmDiaCount,
      abertoSemVencCount,
      pagoNoPrazoCount,
      pagoAtrasoCount,
      taxaAtraso,
      previsto30,
      previsto60,
      atrasoMedioDias,
    };
  }, [operacoesEnriched]);

  const atrasoPorClinica = useMemo(() => {
    const map = new Map();
    operacoesEnriched.forEach((op) => {
      const cid = String(op.clinica_id || "");
      if (!cid) return;
      const valor = Number(op.valor_liquido) || 0;
      const current = map.get(cid) || { total: 0, emAtraso: 0 };
      current.total += valor;
      if (op.status_pagamento === "Em atraso" || op.status_pagamento === "Pago em atraso") {
        current.emAtraso += valor;
      }
      map.set(cid, current);
    });
    return map;
  }, [operacoesEnriched]);

  const resumoEnriched = useMemo(() => {
    return resumoFiltrado.map((row) => {
      const stats = atrasoPorClinica.get(String(row.clinica_id));
      const valorAtraso = stats?.emAtraso || 0;
      const percAtraso = stats && stats.total > 0 ? valorAtraso / stats.total : null;
      return {
        ...row,
        valorAtraso,
        percAtraso,
        clinicaLabel:
          row.clinica_nome ||
          clinicaMap.get(String(row.clinica_id)) ||
          row.cnpj ||
          row.clinica_id,
      };
    });
  }, [resumoFiltrado, atrasoPorClinica, clinicaMap]);

  const resumoOrdenado = useMemo(() => {
    const rows = [...resumoEnriched];
    const direction = resumoSort.direction === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let av;
      let bv;
      switch (resumoSort.key) {
        case "clinica":
          av = a.clinicaLabel;
          bv = b.clinicaLabel;
          break;
        case "limite":
          av = a.limite_aprovado;
          bv = b.limite_aprovado;
          break;
        case "antecipado":
          av = a.total_antecipado;
          bv = b.total_antecipado;
          break;
        case "reembolsado":
          av = a.total_reembolsado;
          bv = b.total_reembolsado;
          break;
        case "em_aberto":
          av = a.em_aberto;
          bv = b.em_aberto;
          break;
        case "em_atraso":
          av = a.valorAtraso;
          bv = b.valorAtraso;
          break;
        case "perc_atraso":
          av = a.percAtraso;
          bv = b.percAtraso;
          break;
        case "saldo":
          av = a.saldo_antecipavel;
          bv = b.saldo_antecipavel;
          break;
        case "perc_saldo":
          av = a.percent_antecipavel;
          bv = b.percent_antecipavel;
          break;
        default:
          av = a.clinicaLabel;
          bv = b.clinicaLabel;
      }
      return compareValues(av, bv) * direction;
    });
    return rows;
  }, [resumoEnriched, resumoSort]);

  const operacoesFiltradas = useMemo(() => {
    const rows = operacoesEnriched.filter((op) => {
      if (
        operacoesClinicaFiltro &&
        String(op.clinica_id) !== String(operacoesClinicaFiltro)
      ) {
        return false;
      }
      if (statusFiltro === "todos") return true;
      return op.status_pagamento === statusFiltro;
    });
    if (riscoVencimento.length > 0) {
      const ranges = riscoVencimento
        .map((key) => key.split("-").map(Number))
        .filter((range) => range.length === 2 && range.every(Number.isFinite));
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return rows.filter((op) => {
        const pagamento = toDateOnly(op.data_pagamento_reembolso || op.data_reembolso);
        if (pagamento) return false;
        const venc = toDateOnly(op.data_reembolso_programada);
        if (!venc) return false;
        if (venc < hoje) return false;
        const dias = diffDays(hoje, venc);
        if (dias == null) return false;
        return ranges.some(([min, max]) => dias >= min && dias <= max);
      });
    }
    const direction = operacoesSort.direction === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const getDateValue = (value) => {
        const d = toDateOnly(value);
        return d ? d.getTime() : null;
      };
      let av;
      let bv;
      switch (operacoesSort.key) {
        case "clinica":
          av = clinicaMap.get(String(a.clinica_id)) || a.cnpj || a.clinica_id;
          bv = clinicaMap.get(String(b.clinica_id)) || b.cnpj || b.clinica_id;
          break;
        case "cnpj":
          av = a.cnpj;
          bv = b.cnpj;
          break;
        case "evento":
          av = getDateValue(a.data_evento);
          bv = getDateValue(b.data_evento);
          break;
        case "solicitacao":
          av = getDateValue(a.data_solicitacao);
          bv = getDateValue(b.data_solicitacao);
          break;
        case "antecipacao":
          av = getDateValue(a.data_antecipacao);
          bv = getDateValue(b.data_antecipacao);
          break;
        case "pgto_antecipacao":
          av = getDateValue(a.data_pagamento_antecipacao || a.data_antecipacao);
          bv = getDateValue(b.data_pagamento_antecipacao || b.data_antecipacao);
          break;
        case "valor_liquido":
          av = a.valor_liquido;
          bv = b.valor_liquido;
          break;
        case "valor_taxa":
          av = a.valor_taxa;
          bv = b.valor_taxa;
          break;
        case "valor_pagar":
          av = a.valor_a_pagar;
          bv = b.valor_a_pagar;
          break;
        case "reembolso_prog":
          av = getDateValue(a.data_reembolso_programada);
          bv = getDateValue(b.data_reembolso_programada);
          break;
        case "reembolso":
          av = getDateValue(a.data_pagamento_reembolso || a.data_reembolso);
          bv = getDateValue(b.data_pagamento_reembolso || b.data_reembolso);
          break;
        case "status":
          av = a.status_pagamento;
          bv = b.status_pagamento;
          break;
        case "dias":
          av = a.dias_total;
          bv = b.dias_total;
          break;
        case "redash":
          av = a.redash_id;
          bv = b.redash_id;
          break;
        case "registrado":
          av = a.registrado_por;
          bv = b.registrado_por;
          break;
        default:
          av = getDateValue(a.data_antecipacao);
          bv = getDateValue(b.data_antecipacao);
      }
      return compareValues(av, bv) * direction;
    });
    return rows;
  }, [
    operacoesEnriched,
    statusFiltro,
    operacoesSort,
    clinicaMap,
    operacoesClinicaFiltro,
    riscoVencimento,
  ]);

  const topAtraso = useMemo(() => {
    const rows = [];
    atrasoPorClinica.forEach((stats, cid) => {
      if (!stats?.emAtraso) return;
      rows.push({
        clinica_id: cid,
        clinica_nome: clinicaMap.get(cid),
        clinica_nome_real: clinicaNomeRealMap.get(cid),
        valor: stats.emAtraso,
      });
    });
    rows.sort((a, b) => b.valor - a.valor);
    return rows.slice(0, 5);
  }, [atrasoPorClinica, clinicaMap, clinicaNomeRealMap]);

  const clinicaSelecionadaInadimplente =
    formClinica && inadimplenteMap.get(String(formClinica));

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
    if (clinicaSelecionadaInadimplente) {
      setErro("Clínica inadimplente. Regularize antes de antecipar.");
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
      <div className="antecipacoes-page">
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
              {redashStatus?.last_sync ? formatDateTimeDisplay(redashStatus.last_sync) : "-"}
            </span>
            {redashStatus?.last_user && (
              <span className="text-slate-500"> • {redashStatus.last_user}</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Manual
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={openNovaAntecipacao}
                className="px-4 py-2 rounded-xl text-sm border border-sky-500 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
              >
                Nova antecipação
              </button>
              <button
                onClick={openImportModal}
                className="px-4 py-2 rounded-xl text-sm border border-sky-500/70 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 transition"
              >
                Importar CSV
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Automático
            </span>
            <button
              onClick={openSyncModal}
              className="px-4 py-2 rounded-xl text-sm border border-emerald-500/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
            >
              Sincronizar Redash
            </button>
          </div>
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

      <div className="mb-8 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr),minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Reembolsos em aberto
                  </p>
                  <p className="text-sm text-slate-200">
                    O que deveria ter sido reembolsado e o que ainda vence.
                  </p>
                </div>
                <span className="text-[11px] text-slate-500">
                  Base: {operacoesEnriched.length} operações
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-[11px] text-slate-500">Em aberto total</p>
                  <p className="text-amber-200 text-sm font-semibold mt-1">
                    {formatCurrency(reembolsoStats.abertoTotal)}
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-[11px] text-slate-500">Vencido</p>
                  <p className="text-rose-300 text-sm font-semibold mt-1">
                    {formatCurrency(reembolsoStats.abertoVencido)}
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-[11px] text-slate-500">Em dia</p>
                  <p className="text-emerald-300 text-sm font-semibold mt-1">
                    {formatCurrency(reembolsoStats.abertoEmDia)}
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-[11px] text-slate-500">Sem vencimento</p>
                  <p className="text-slate-100 text-sm font-semibold mt-1">
                    {formatCurrency(reembolsoStats.abertoSemVenc)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Aging de atraso
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {[
                  ["1-7 dias", reembolsoStats.overdue.d1_7],
                  ["8-15 dias", reembolsoStats.overdue.d8_15],
                  ["16-30 dias", reembolsoStats.overdue.d16_30],
                  ["31-60 dias", reembolsoStats.overdue.d31_60],
                  ["60+ dias", reembolsoStats.overdue.d60],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-rose-200 font-semibold">
                      {formatCurrency(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr),minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-slate-500">Pago no prazo</p>
                <p className="text-slate-100 text-sm font-semibold mt-1">
                  {formatCurrency(reembolsoStats.pagoNoPrazo)}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-slate-500">Pago em atraso</p>
                <p className="text-rose-200 text-sm font-semibold mt-1">
                  {formatCurrency(reembolsoStats.pagoAtraso)}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-slate-500">Taxa de atraso</p>
                <p className="text-rose-300 text-sm font-semibold mt-1">
                  {formatPercent(reembolsoStats.taxaAtraso)}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-slate-500">Previstos</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>30d</span>
                  <span className="text-sky-200 font-semibold">
                    {formatCurrency(reembolsoStats.previsto30)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>60d</span>
                  <span className="text-sky-200 font-semibold">
                    {formatCurrency(reembolsoStats.previsto60)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <p className="text-[11px] text-slate-500">Saldo antecipável</p>
                <p className="text-emerald-300 text-sm font-semibold mt-1">
                  {formatCurrency(totals.saldo)}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-slate-500">Saldo bloqueado</p>
                <p className="text-rose-300 text-sm font-semibold mt-1">
                  {formatCurrency(totals.saldoBloqueado)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                A vencer
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {[
                  ["0-7 dias", reembolsoStats.upcoming.d0_7],
                  ["8-15 dias", reembolsoStats.upcoming.d8_15],
                  ["16-30 dias", reembolsoStats.upcoming.d16_30],
                  ["31-60 dias", reembolsoStats.upcoming.d31_60],
                  ["60+ dias", reembolsoStats.upcoming.d60],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-sky-200 font-semibold">
                      {formatCurrency(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr),minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Insights operacionais
                </p>
                <span className="text-[11px] text-slate-500">
                  Total: {operacoesEnriched.length}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFiltro((prev) =>
                      prev === "Em atraso" ? "todos" : "Em atraso"
                    );
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    statusFiltro === "Em atraso"
                      ? "bg-rose-500/10 border border-rose-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">Em atraso</span>
                  <span className="text-rose-300 font-semibold">
                    {formatCountWithPercent(
                      reembolsoStats.abertoVencidoCount,
                      operacoesEnriched.length
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFiltro((prev) =>
                      prev === "Em aberto" ? "todos" : "Em aberto"
                    );
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    statusFiltro === "Em aberto"
                      ? "bg-amber-500/10 border border-amber-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">Em aberto</span>
                  <span className="text-amber-200 font-semibold">
                    {formatCountWithPercent(
                      reembolsoStats.abertoEmDiaCount,
                      operacoesEnriched.length
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFiltro((prev) =>
                      prev === "Sem vencimento" ? "todos" : "Sem vencimento"
                    );
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    statusFiltro === "Sem vencimento"
                      ? "bg-slate-500/20 border border-slate-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">Sem vencimento</span>
                  <span className="text-slate-200 font-semibold">
                    {formatCountWithPercent(
                      reembolsoStats.abertoSemVencCount,
                      operacoesEnriched.length
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFiltro((prev) =>
                      prev === "Pago no prazo" ? "todos" : "Pago no prazo"
                    );
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    statusFiltro === "Pago no prazo"
                      ? "bg-emerald-500/10 border border-emerald-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">Pago no prazo</span>
                  <span className="text-emerald-200 font-semibold">
                    {formatCountWithPercent(
                      reembolsoStats.pagoNoPrazoCount,
                      operacoesEnriched.length
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFiltro((prev) =>
                      prev === "Pago em atraso" ? "todos" : "Pago em atraso"
                    );
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    statusFiltro === "Pago em atraso"
                      ? "bg-rose-500/10 border border-rose-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">Pago em atraso</span>
                  <span className="text-rose-200 font-semibold">
                    {formatCountWithPercent(
                      reembolsoStats.pagoAtrasoCount,
                      operacoesEnriched.length
                    )}
                  </span>
                </button>
                <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-slate-400">Atraso medio (dias)</span>
                  <span className="text-slate-200 font-semibold">
                    {reembolsoStats.atrasoMedioDias.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Risco por vencimento (quantidade)
                </p>
                <span className="text-[11px] text-slate-500">
                  Somente em aberto
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setRiscoVencimento((prev) => toggleSelection(prev, "0-7"));
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    riscoVencimento.includes("0-7")
                      ? "bg-sky-500/10 border border-sky-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">0-7 dias</span>
                  <span className="text-sky-200 font-semibold">
                    {reembolsoStats.upcomingCount.d0_7}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRiscoVencimento((prev) => toggleSelection(prev, "8-15"));
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    riscoVencimento.includes("8-15")
                      ? "bg-sky-500/10 border border-sky-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">8-15 dias</span>
                  <span className="text-sky-200 font-semibold">
                    {reembolsoStats.upcomingCount.d8_15}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRiscoVencimento((prev) => toggleSelection(prev, "16-30"));
                    setActiveTab("operacoes");
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition text-left ${
                    riscoVencimento.includes("16-30")
                      ? "bg-sky-500/10 border border-sky-400/60"
                      : "bg-slate-950/50 border border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className="text-slate-400">16-30 dias</span>
                  <span className="text-sky-200 font-semibold">
                    {reembolsoStats.upcomingCount.d16_30}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Top clínicas em atraso
              </p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                {topAtraso.length === 0 ? (
                  <p className="text-slate-500 text-xs">
                    Nenhuma clínica em atraso no filtro atual.
                  </p>
                ) : (
                  topAtraso.map((item) => (
                    <div
                      key={item.clinica_id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-slate-200">
                          {item.clinica_nome || item.clinica_id}
                        </span>
                        {item.clinica_nome_real && (
                          <span className="text-[11px] text-slate-500">
                            {item.clinica_nome_real}
                          </span>
                        )}
                      </div>
                      <span className="text-rose-200 font-semibold">
                        {formatCurrency(item.valor)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("resumo")}
          className={`px-3 py-1.5 rounded-full text-xs border ${
            activeTab === "resumo"
              ? "border-sky-400/70 bg-sky-500/15 text-sky-200"
              : "border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          Resumo por clínica
        </button>
        <button
          onClick={() => setActiveTab("operacoes")}
          className={`px-3 py-1.5 rounded-full text-xs border ${
            activeTab === "operacoes"
              ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200"
              : "border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          Operações
        </button>
      </div>

      {activeTab === "resumo" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-8 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-slate-300 text-sm uppercase font-semibold tracking-wide">
              Resumo por clínica
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResumoView("table")}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  resumoView === "table"
                    ? "border-sky-400/70 bg-sky-500/15 text-sky-200"
                    : "border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                Tabela
              </button>
              <button
                type="button"
                onClick={() => setResumoView("cards")}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  resumoView === "cards"
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200"
                    : "border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                Cards
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-slate-500 text-sm">Carregando...</p>
          ) : resumoFiltrado.length === 0 ? (
            <p className="text-slate-500 text-sm">Sem dados.</p>
          ) : resumoView === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {resumoOrdenado.map((row) => (
                <button
                  type="button"
                  key={row.clinica_id}
                  onClick={() => {
                    setOperacoesClinicaFiltro(row.clinica_id);
                    setStatusFiltro("todos");
                    setActiveTab("operacoes");
                  }}
                  className="text-left bg-slate-950/70 border border-slate-800 rounded-2xl p-4 hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-slate-100 text-sm font-semibold">
                        {row.clinicaLabel}
                      </p>
                      {inadimplenteMap.get(String(row.clinica_id)) && (
                        <span className="inline-flex mt-2 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border border-rose-400/70 text-rose-200 bg-rose-500/10">
                          Inadimplente
                        </span>
                      )}
                      {row.clinica_nome_real && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          {row.clinica_nome_real}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-2">
                        {row.cnpj || "CNPJ não informado"}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Ver operações
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Em aberto</p>
                      <p className="text-amber-300 font-semibold">
                        {formatCurrency(row.em_aberto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Em atraso</p>
                      <p className="text-rose-300 font-semibold">
                        {formatCurrency(row.valorAtraso)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Reembolsado</p>
                      <p className="text-slate-200 font-semibold">
                        {formatCurrency(row.total_reembolsado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Saldo</p>
                      {inadimplenteMap.get(String(row.clinica_id)) ? (
                        <p className="text-rose-300 font-semibold">Bloqueado</p>
                      ) : (
                        <p className="text-emerald-300 font-semibold">
                          {formatCurrency(row.saldo_antecipavel)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Limite: {formatCurrency(row.limite_aprovado)}</span>
                    <span>
                      {inadimplenteMap.get(String(row.clinica_id))
                        ? "Limite bloqueado"
                        : `Atraso: ${formatPercent(row.percAtraso)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full min-w-0">
              <table className="min-w-max w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "clinica")}
                        className="flex items-center gap-1"
                      >
                        Codigo
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "clinica")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">CNPJ</th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "limite")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Limite aprovado
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "limite")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "antecipado")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Antecipado
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "antecipado")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "reembolsado")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Reembolsado
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "reembolsado")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "em_aberto")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Em aberto
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "em_aberto")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "em_atraso")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Em atraso
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "em_atraso")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "perc_atraso")}
                        className="ml-auto flex items-center gap-1"
                      >
                        % atraso
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "perc_atraso")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "saldo")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Saldo antecipavel
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "saldo")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setResumoSort, "perc_saldo")}
                        className="ml-auto flex items-center gap-1"
                      >
                        % antecipavel
                        <span className="text-[10px]">
                          {sortIndicator(resumoSort, "perc_saldo")}
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resumoOrdenado.map((row) => {
                    return (
                      <tr key={row.clinica_id} className="border-b border-slate-800/60">
                      <td className="py-2 pr-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>
                              {row.clinicaLabel}
                            </span>
                            {inadimplenteMap.get(String(row.clinica_id)) && (
                              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-rose-400/70 text-rose-200 bg-rose-500/10">
                                Inadimplente
                              </span>
                            )}
                          </div>
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
                      <td className="py-2 pr-3 text-right text-rose-300">
                        {formatCurrency(row.valorAtraso)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPercent(row.percAtraso)}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right ${
                          inadimplenteMap.get(String(row.clinica_id))
                            ? "text-rose-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {inadimplenteMap.get(String(row.clinica_id))
                          ? "Bloqueado"
                          : formatCurrency(row.saldo_antecipavel)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {inadimplenteMap.get(String(row.clinica_id))
                          ? "-"
                          : formatPercent(row.percent_antecipavel)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "operacoes" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-w-0">
          <h3 className="text-slate-300 text-sm uppercase font-semibold tracking-wide mb-3">
            Operações
          </h3>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {operacoesClinicaFiltro && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  Clinica
                </span>
                <span className="text-xs text-slate-200 bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-1.5">
                  {clinicaMap.get(String(operacoesClinicaFiltro)) ||
                    operacoesClinicaFiltro}
                </span>
                <button
                  type="button"
                  onClick={() => setOperacoesClinicaFiltro(null)}
                  className="text-[11px] text-slate-400 underline hover:text-slate-200"
                >
                  Limpar
                </button>
              </div>
            )}
            {riscoVencimento.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  Risco
                </span>
                <span className="text-xs text-slate-200 bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-1.5">
                  {riscoVencimento
                    .map((key) => riscoLabels[key] || `${key} dias`)
                    .join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => setRiscoVencimento([])}
                  className="text-[11px] text-slate-400 underline hover:text-slate-200"
                >
                  Limpar
                </button>
              </div>
            )}
            <div className="text-[11px] text-slate-500">
              Mostrando {operacoesFiltradas.length} de{" "}
              {operacoesEnriched.length} operações
            </div>
            {statusFiltro !== "todos" && (
              <button
                type="button"
                onClick={() => setStatusFiltro("todos")}
                className="text-[11px] text-slate-400 underline hover:text-slate-200"
              >
                Limpar filtro
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-slate-500 text-sm">Carregando...</p>
          ) : operacoesFiltradas.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhuma operação registrada.</p>
          ) : (
            <div className="overflow-x-auto max-w-full min-w-0">
              <table className="min-w-max w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "clinica")}
                        className="flex items-center gap-1"
                      >
                        Codigo
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "clinica")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "cnpj")}
                        className="flex items-center gap-1"
                      >
                        CNPJ
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "cnpj")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "evento")}
                        className="flex items-center gap-1"
                      >
                        Evento
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "evento")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "solicitacao")}
                        className="flex items-center gap-1"
                      >
                        Solicitacao
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "solicitacao")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "antecipacao")}
                        className="flex items-center gap-1"
                      >
                        Antecipacao
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "antecipacao")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleSort(setOperacoesSort, "pgto_antecipacao")
                        }
                        className="flex items-center gap-1"
                      >
                        Pgto antecipacao
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "pgto_antecipacao")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "valor_liquido")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Valor liquido
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "valor_liquido")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "valor_taxa")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Taxa
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "valor_taxa")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "valor_pagar")}
                        className="ml-auto flex items-center gap-1"
                      >
                        A pagar
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "valor_pagar")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleSort(setOperacoesSort, "reembolso_prog")
                        }
                        className="flex items-center gap-1"
                      >
                        Reembolso programado
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "reembolso_prog")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "reembolso")}
                        className="flex items-center gap-1"
                      >
                        Reembolso
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "reembolso")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "status")}
                        className="flex items-center gap-1"
                      >
                        Status
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "status")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "dias")}
                        className="ml-auto flex items-center gap-1"
                      >
                        Dias
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "dias")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "redash")}
                        className="flex items-center gap-1"
                      >
                        Redash ID
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "redash")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(setOperacoesSort, "registrado")}
                        className="flex items-center gap-1"
                      >
                        Registrado por
                        <span className="text-[10px]">
                          {sortIndicator(operacoesSort, "registrado")}
                        </span>
                      </button>
                    </th>
                    <th className="py-2 pr-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {operacoesFiltradas.map((op) => (
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
                      <td className="py-2 pr-3">
                        {formatDateDisplay(op.data_evento)}
                      </td>
                      <td className="py-2 pr-3">
                        {formatDateDisplay(op.data_solicitacao)}
                      </td>
                      <td className="py-2 pr-3">
                        {formatDateDisplay(op.data_antecipacao)}
                      </td>
                      <td className="py-2 pr-3">
                        {formatDateDisplay(
                          op.data_pagamento_antecipacao || op.data_antecipacao
                        )}
                      </td>
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
                        {formatDateDisplay(op.data_reembolso_programada)}
                      </td>
                      <td className="py-2 pr-3">
                        {op.data_pagamento_reembolso || op.data_reembolso
                          ? formatDateDisplay(
                              op.data_pagamento_reembolso || op.data_reembolso
                            )
                          : "Em aberto"}
                      </td>
                      <td className="py-2 pr-3 text-slate-300">
                        {op.status_pagamento || "-"}
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-400">
                        {op.dias_total != null ? op.dias_total : "-"}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {op.redash_id || "-"}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {op.registrado_por || "-"}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        {!op.data_pagamento_reembolso && !op.data_reembolso && (
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
          {clinicaSelecionadaInadimplente && (
            <div className="md:col-span-2 text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              Clínica inadimplente: o limite está bloqueado até regularizar os
              reembolsos em atraso.
            </div>
          )}
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
            disabled={saving || clinicaSelecionadaInadimplente}
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

      <Modal open={missingLimitsOpen} onClose={() => setMissingLimitsOpen(false)}>
        <h3 className="text-lg font-semibold text-slate-100">
          Aprovar limites pendentes
        </h3>
        <p className="text-[12px] text-slate-400 mt-1">
          Existem clínicas sem limite aprovado. Informe os limites para atualizar a
          sincronização do Redash.
        </p>

        {missingLimitsError && (
          <div className="mt-4 rounded-lg px-3 py-2 text-xs border border-rose-500/60 bg-rose-500/10 text-rose-300">
            {missingLimitsError}
          </div>
        )}

        <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
          {missingClinicas.map((row) => (
            <div
              key={row.clinica_id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm text-slate-100">
                  {row.clinica_nome || row.cnpj || row.clinica_id}
                </span>
                {row.clinica_nome_real && (
                  <span className="text-[11px] text-slate-500">
                    {row.clinica_nome_real}
                  </span>
                )}
                {row.cnpj && (
                  <span className="text-[11px] text-slate-500">{row.cnpj}</span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Limite</span>
                <input
                  type="text"
                  value={missingLimitsValues[row.clinica_id] || ""}
                  onChange={(e) =>
                    setMissingLimitsValues((prev) => ({
                      ...prev,
                      [row.clinica_id]: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                  className="w-28 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
                {missingLimitsSuggested[row.clinica_id] != null && (
                  <span className="text-[11px] text-slate-500">
                    Sugestão:{" "}
                    {formatCurrency(missingLimitsSuggested[row.clinica_id])}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setMissingLimitsOpen(false)}
            className="px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleApproveMissingLimits}
            disabled={missingLimitsSaving || missingClinicas.length === 0}
            className="px-4 py-2 rounded-xl text-sm border border-emerald-500/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {missingLimitsSaving ? "Aprovando..." : "Aprovar e sincronizar"}
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
                    {importMode === "redash" && (
                      <button
                        onClick={openMissingLimitsModal}
                        className="ml-3 text-[11px] underline text-emerald-300 hover:text-emerald-200"
                      >
                        Aprovar limites agora
                      </button>
                    )}
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
