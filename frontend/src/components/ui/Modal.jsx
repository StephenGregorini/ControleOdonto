// /frontend/src/components/ui/Modal.jsx
import React from "react";

export default function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6 max-w-4xl w-full">
        {children}
      </div>
    </div>
  );
}