import * as React from "react";
import type { BaselineDataset } from "@/data/baseline";

const STORAGE_KEY = "obz.baseline.v1";

export function useBaseline() {
  const [dataset, setDataset] = React.useState<BaselineDataset | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      setDataset(JSON.parse(raw));
    } catch {
      // ignora
    }
  }, []);

  const save = React.useCallback((ds: BaselineDataset) => {
    setDataset(ds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ds));
  }, []);

  const clear = React.useCallback(() => {
    setDataset(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { dataset, save, clear };
}
