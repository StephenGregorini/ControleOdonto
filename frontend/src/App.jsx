import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Upload from "./Upload";
import Historico from "./Historico";
import Dashboard from "./dashboard/Dashboard"; // <<< usa o dashboard novo
import Login from "./Login";
import Clinicas from "./Clinicas";
import Dados from "./Dados";
import Perfil from "./Perfil";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "./AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  return <Login onLogin={() => navigate("/")} />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* UPLOAD (padrão) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        }
      />

      {/* HISTÓRICO */}
      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <Historico />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD NOVO */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* CLÍNICAS */}
      <Route
        path="/admin/clinicas"
        element={
          <ProtectedRoute requireAdmin>
            <Clinicas />
          </ProtectedRoute>
        }
      />

      {/* DADOS / DEBUG */}
      <Route
        path="/admin/dados"
        element={
          <ProtectedRoute requireAdmin>
            <Dados />
          </ProtectedRoute>
        }
      />

      {/* PERFIL */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />

      {/* QUALQUER OUTRA ROTA → LOGIN OU UPLOAD */}
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
