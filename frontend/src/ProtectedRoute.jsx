import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, initializing } = useAuth();

  // 1. Aguarda inicialização
  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <p>Carregando...</p>
      </div>
    );
  }

  // 2. Se não tem usuário, vai para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se exige admin e o perfil não é de admin, nega acesso (ou redireciona)
  if (requireAdmin && profile?.role !== "admin") {
    // Pode ser uma página de "Acesso Negado" ou redirecionar para a home
    return <Navigate to="/" replace />;
  }

  // 4. Se passou por tudo, renderiza o conteúdo protegido
  return children;
}