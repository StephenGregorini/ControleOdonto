// /frontend/src/components/ui/Modal.jsx
import React from "react";

export default function Modal({ open, onClose, children, wide }) {
  if (!open) return null;

  const widthClass = wide ? 'max-w-6xl' : 'max-w-4xl';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6 w-full ${widthClass}`}>
        {children}
      </div>
    </div>
  );
}