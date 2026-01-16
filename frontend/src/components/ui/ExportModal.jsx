import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { API_BASE_URL } from '../../apiConfig';

const ALL_COLUMNS = [
    { id: 'clinica_nome', label: 'Nome da Clínica' },
    { id: 'cnpj', label: 'CNPJ' },
    { id: 'mes_ref', label: 'Mês de Referência' },
    { id: 'score_credito', label: 'Score de Crédito' },
    { id: 'categoria_risco', label: 'Categoria de Risco' },
    { id: 'limite_aprovado', label: 'Limite Aprovado' },
    { id: 'limite_sugerido', label: 'Limite Sugerido' },
    { id: 'valor_total_emitido', label: 'Valor Total Emitido' },
    { id: 'valor_emitido_ultimo_mes_fechado', label: 'Valor emitido no ultimo mes fechado' },
    { id: 'taxa_inadimplencia_real', label: 'Inadimplência Real' },
    { id: 'taxa_pago_no_vencimento', label: 'Taxa Pago no Vencimento' },
    { id: 'valor_medio_boleto', label: 'Ticket Médio' },
    { id: 'tempo_medio_pagamento_dias', label: 'Tempo Médio de Pagamento (dias)' },
    { id: 'parc_media_parcelas_pond', label: 'Parcela Média' },
];

const ExportModal = ({ isOpen, onClose, onExport, availableMonths, defaultClinicaId }) => {
  const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS.map(c => c.id));
  
  const [allClinicas, setAllClinicas] = useState([]);
  const [filteredClinicas, setFilteredClinicas] = useState([]);
  const [selectedClinicas, setSelectedClinicas] = useState([]);
  const [loadingClinicas, setLoadingClinicas] = useState(false);
  const [clinicSearch, setClinicSearch] = useState("");

  const [viewType, setViewType] = useState('consolidado');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const monthsByNumber = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Fev" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Abr" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Ago" },
    { value: "09", label: "Set" },
    { value: "10", label: "Out" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dez" },
  ];

  const parseYearMonth = (ym) => {
    if (!ym) return null;
    const [y, m] = String(ym).split("-");
    if (!y || !m) return null;
    return { year: Number(y), month: Number(m) };
  };

  const makeYearMonth = (year, month) => {
    if (!year || !month) return null;
    const mm = String(month).padStart(2, "0");
    return `${year}-${mm}`;
  };

  const buildMonthRange = (startYm, endYm) => {
    const start = parseYearMonth(startYm);
    const end = parseYearMonth(endYm);
    if (!start || !end) return [];
    const startDate = new Date(start.year, start.month - 1, 1);
    const endDate = new Date(end.year, end.month - 1, 1);
    if (startDate > endDate) return [];
    const months = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const value = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      months.push(value);
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const availableBounds = useMemo(() => {
    if (!availableMonths || availableMonths.length === 0) return null;
    const values = availableMonths.map((m) => m.value).filter(Boolean).sort();
    return {
      min: values[0],
      max: values[values.length - 1],
    };
  }, [availableMonths]);

  const yearOptions = useMemo(() => {
    if (!availableBounds) return [];
    const minYear = Number(String(availableBounds.min).split("-")[0]);
    const maxYearBase = Number(String(availableBounds.max).split("-")[0]);
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(maxYearBase, currentYear);
    const years = [];
    for (let y = minYear; y <= maxYear; y += 1) {
      years.push(String(y));
    }
    return years;
  }, [availableBounds]);

  const selectedRange = useMemo(() => {
    const startYm = makeYearMonth(startYear, startMonth);
    const endYm = makeYearMonth(endYear, endMonth);
    return buildMonthRange(startYm, endYm);
  }, [startYear, startMonth, endYear, endMonth]);

  const invalidRange =
    startYear &&
    startMonth &&
    endYear &&
    endMonth &&
    selectedRange.length === 0;

  useEffect(() => {
    if (isOpen) {
      const fetchClinicas = async () => {
        setLoadingClinicas(true);
        try {
          const res = await fetch(`${API_BASE_URL}/dashboard/clinicas`);
          if (res.ok) {
            const data = await res.json();
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.nome.localeCompare(b.nome)) : [];
            setAllClinicas(sortedData);
            setFilteredClinicas(sortedData);
            if (defaultClinicaId && defaultClinicaId !== "todas") {
              setSelectedClinicas([defaultClinicaId]);
            } else {
              setSelectedClinicas(sortedData.map(c => c.id));
            }
          }
        } catch (error) {
          console.error("Erro ao carregar clínicas", error);
        }
        setLoadingClinicas(false);
      };
      fetchClinicas();

      setSelectedColumns(ALL_COLUMNS.map(c => c.id));
      setViewType('consolidado');
      setClinicSearch("");
      if (availableBounds) {
        const [minY, minM] = availableBounds.min.split("-");
        const [maxY, maxM] = availableBounds.max.split("-");
        setStartYear(minY);
        setStartMonth(minM);
        setEndYear(maxY);
        setEndMonth(maxM);
      }
    }
  }, [isOpen, availableBounds, defaultClinicaId]);

  useEffect(() => {
    setSelectedMonths(selectedRange);
  }, [selectedRange]);

  useEffect(() => {
    const lowerCaseSearch = clinicSearch.toLowerCase();
    setFilteredClinicas(
      allClinicas.filter((c) => {
        const normalize = (txt) =>
          String(txt || "")
            .toLowerCase()
            .replace(/[.\-\/\s]/g, "");
        const target = `${c.codigo_clinica || ""} ${c.nome || ""} ${c.cnpj || ""}`;
        return (
          target.toLowerCase().includes(lowerCaseSearch) ||
          normalize(target).includes(normalize(clinicSearch))
        );
      })
    );
  }, [clinicSearch, allClinicas]);

  const formatClinicaLabel = (clinica) => {
    const codigo = clinica.codigo_clinica || clinica.nome || "";
    const nome = clinica.nome || "";
    const cnpj = clinica.cnpj || "";
    const base = nome ? `${codigo} · ${nome}` : codigo;
    return cnpj ? `${base} — ${cnpj}` : base;
  };


  const handleColumnChange = (columnId) => {
    setSelectedColumns(prev => prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]);
  };
  
  const handleClinicChange = (clinicId) => {
    setSelectedClinicas(prev => prev.includes(clinicId) ? prev.filter(id => id !== clinicId) : [...prev, clinicId]);
  };

  const handleSelectAllClinics = (e) => {
    if (e.target.checked) {
      setSelectedClinicas(allClinicas.map(c => c.id));
    } else {
      setSelectedClinicas([]);
    }
  };

  const createPayload = () => ({
    columns: selectedColumns,
    months: selectedMonths,
    view_type: viewType,
    clinica_ids: selectedClinicas,
  });

  const handleGeneratePreview = async () => {
    setIsLoadingPreview(true);
    setPreviewData(null);
    try {
        const response = await fetch(`${API_BASE_URL}/export/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createPayload()),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setPreviewData(data);
    } catch (error) {
        console.error("Erro ao gerar pré-visualização", error);
    }
    setIsLoadingPreview(false);
  };

  const handleExport = () => {
    onExport(createPayload());
  };

  return (
    <Modal open={isOpen} onClose={onClose} wide={true}>
      <div className="text-slate-100">
        <h2 className="text-2xl font-bold mb-6">Montar Relatório (Base de Dados)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
          {/* Coluna 1: Clínicas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-sky-300">Quais clínicas incluir?</h3>
            <input 
              type="text"
              placeholder="Buscar código, nome ou CNPJ..."
              value={clinicSearch}
              onChange={(e) => setClinicSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 mb-2"
            />
            <div className="border border-slate-700 p-3 rounded-lg">
                <Checkbox 
                    name="select-all-clinics"
                    label="Selecionar Todas"
                    checked={selectedClinicas.length === allClinicas.length && allClinicas.length > 0}
                    onChange={handleSelectAllClinics}
                />
                <hr className="border-slate-700 my-2"/>
                <div className='max-h-40 overflow-y-auto space-y-2'>
                {loadingClinicas ? <p className='text-slate-400'>Carregando...</p> : 
                    filteredClinicas.map(c => (
                    <Checkbox
                        key={c.id}
                        name={c.id}
                        label={formatClinicaLabel(c)}
                        checked={selectedClinicas.includes(c.id)}
                        onChange={() => handleClinicChange(c.id)}
                    />
                    ))
                }
                </div>
            </div>
          </div>

          {/* Coluna 2: Colunas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-sky-300">Quais colunas incluir?</h3>
            <div className="grid grid-cols-1 gap-x-4 max-h-60 overflow-y-auto border border-slate-700 p-3 rounded-lg">
              {ALL_COLUMNS.map(col => (
                <Checkbox 
                  key={col.id}
                  name={col.id} 
                  label={col.label}
                  checked={selectedColumns.includes(col.id)}
                  onChange={() => handleColumnChange(col.id)}
                />
              ))}
            </div>
          </div>

          {/* Coluna 3: Agrupamento e Período */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-sky-300">Como agrupar o tempo?</h3>
            <div className="space-y-3 mb-4">
                <Radio name="viewType" label="Dados Consolidados" value="consolidado" checked={viewType === 'consolidado'} onChange={setViewType} />
                <Radio name="viewType" label="Dados Separados por Mês" value="separado" checked={viewType === 'separado'} onChange={setViewType} />
            </div>

            <h3 className="text-lg font-semibold mb-3 text-sky-300">Qual período incluir?</h3>
            <div className="border border-slate-700 p-3 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    De
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-md px-2 py-2 text-sm"
                    >
                      {monthsByNumber.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-md px-2 py-2 text-sm"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Até
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-md px-2 py-2 text-sm"
                    >
                      {monthsByNumber.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-md px-2 py-2 text-sm"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                {selectedRange.length > 0
                  ? `Período selecionado: ${selectedRange[0]} — ${selectedRange[selectedRange.length - 1]} (${selectedRange.length} meses)`
                  : "Selecione um intervalo válido."}
              </p>

              {invalidRange && (
                <p className="text-[11px] text-rose-300">
                  O período inicial não pode ser maior que o final.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ações e Preview */}
        <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-sky-300">Pré-visualização</h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-md">
                        Clique para gerar uma amostra da base de dados com as opções selecionadas.
                    </p>
                </div>
                <div className='flex gap-4'>
                    <button onClick={handleGeneratePreview} disabled={isLoadingPreview || invalidRange} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-bold text-white disabled:bg-indigo-800 disabled:cursor-not-allowed">
                        {isLoadingPreview ? 'Gerando...' : 'Gerar Pré-visualização'}
                    </button>
                    <button onClick={handleExport} disabled={invalidRange} className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 transition-colors text-sm font-bold text-white disabled:bg-sky-800 disabled:cursor-not-allowed">
                        Gerar e Baixar XLSX
                    </button>
                     <button onClick={onClose} className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
             {previewData && (
                <div className="mt-4">
                    {previewData.length > 0 ? (
                        <div className="max-h-64 overflow-auto bg-slate-900 p-1 rounded-lg border border-slate-700">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-800 sticky top-0">
                                    <tr>{Object.keys(previewData[0]).map(key => <th key={key} className="p-2 font-semibold">{key}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, index) => (
                                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-700/50">
                                            {Object.values(row).map((value, i) => <td key={i} className="p-2 whitespace-nowrap">{String(value)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-8">Nenhum dado de pré-visualização para exibir com as opções selecionadas.</p>
                    )}
                </div>
            )}
        </div>
      </div>
    </Modal>
  );
};

const Checkbox = ({ name, label, checked, onChange }) => (
    <label className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-800/60 cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500"/>
      <span className="text-slate-300 text-sm">{label}</span>
    </label>
);
  
const Radio = ({ name, label, value, checked, onChange }) => (
    <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer">
        <input type="radio" name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.value)} className="h-5 w-5 bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500"/>
        <span className="text-slate-300">{label}</span>
    </label>
);

export default ExportModal;
