import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

export function useQualidadeDados() {
  const [inconsistencias, setInconsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/dashboard/qualidade-dados`);
        if (!response.ok) {
          throw new Error(`Erro no servidor: HTTP ${response.status}`);
        }
        const data = await response.json();
        setInconsistencias(data);
      } catch (e) {
        setError(e.toString());
        console.error("Erro ao carregar dados de qualidade:", e);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  return { inconsistencias, loading, error };
}
