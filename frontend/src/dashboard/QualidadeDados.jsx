import React from 'react';
import { useQualidadeDados } from '../utils/useQualidadeDados';
import Section from '../components/ui/Section';

export default function QualidadeDados() {
  const { inconsistencias, loading, error } = useQualidadeDados();

  if (loading) {
    return <p className="text-slate-300">Analisando dados...</p>;
  }

  if (error) {
    return <p className="text-rose-400">Erro ao carregar análise: {error}</p>;
  }

  return (
    <div className="space-y-6">
      <Section title="Análise de Qualidade dos Dados">
        <p className="text-slate-400 text-sm mt-1">
          Esta análise verifica inconsistências nos dados importados. Problemas aqui podem afetar a precisão dos KPIs e limites de crédito.
        </p>
      </Section>
      
      {inconsistencias.length === 0 && (
        <Section>
           <div className="p-6 bg-slate-800/50 rounded-lg text-center border border-emerald-500/30">
            <h3 className="text-lg font-semibold text-emerald-400">Tudo Certo!</h3>
            <p className="text-slate-300 mt-1">Nenhuma inconsistência encontrada nos dados de todas as clínicas.</p>
          </div>
        </Section>
      )}

      {inconsistencias.map((clinica) => (
        <div key={clinica.clinica_id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="font-semibold text-lg text-slate-100 mb-3">{clinica.clinica_nome}</h3>
          <ul className="space-y-2">
            {clinica.inconsistencias.map((item, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-slate-900/70 rounded-md border border-slate-700/50">
                <span className={`flex-shrink-0 font-mono text-xs px-2 py-1 rounded-md ${
                    item.tipo === 'Mês Faltante' ? 'bg-amber-500/20 text-amber-300' : 
                    item.tipo === 'Valor Inválido' ? 'bg-rose-500/20 text-rose-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                  {item.tipo}
                </span>
                <div className="text-sm text-slate-300">
                  {item.mes_ref && <span className="font-semibold text-slate-400 mr-2">[{item.mes_ref}]</span>}
                  {item.detalhe}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
