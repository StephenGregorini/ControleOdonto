import React from "react";

export default function PageLayout({ children }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
      {children}
    </div>
  );
}

// NOTA: O `max-w-7xl` e o padding `px` podem ser ajustados para se adequar
// ao design geral do seu dashboard. Este é um padrão comum e robusto.
