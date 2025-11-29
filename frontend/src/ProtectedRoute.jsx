import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, initializing, loadingProfile } = useAuth();

  // 1) Enquanto o Supabase ainda está restaurando sessão...
  if (initializing || loadingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <p className="text-slate-400">Carregando sessão...</p>
      </div>
    );
  }

  // 2) Se ainda não existe usuário após carregar -> rota protegida
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3) Rota que exige admin
  if (requireAdmin) {
    if (!profile) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950">
          <p className="text-slate-400">Carregando permissões...</p>
        </div>
      );
    }

    if (profile.role !== "admin") {
      return <Navigate to="/" replace />;
    }
  }

  // 4) Liberado
  return children;
}
