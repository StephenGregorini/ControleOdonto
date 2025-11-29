import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export function useClinicas() {
  const [clinicas, setClinicas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dashboard/clinicas`);
      const json = await res.json();
      setClinicas(json || []);
    } catch (err) {
      console.error("Erro ao carregar clínicas:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  return { clinicas, loading, reloadClinicas: carregar };
}
