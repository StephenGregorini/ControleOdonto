import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Upload from "./Upload";
import Historico from "./Historico";
import Dashboard from "./dashboard/Dashboard";
import Clinicas from "./dashboard/Clinicas";
import Dados from "./dashboard/Dados";
import Login from "./Login";
import Perfil from "./Perfil";

import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import { DashboardProvider } from "./DashboardContext";
import AdminShell from "./AdminShell";

function LoginPage() {
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* ÁREA PUBLICA */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Upload />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/historico"
          element={
            <ProtectedRoute>
              <Layout>
                <Historico />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ÁREA ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <DashboardProvider>
                <AdminShell />
              </DashboardProvider>
            </ProtectedRoute>
          }
        >

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clinicas" element={<Clinicas />} />
          <Route path="dados" element={<Dados />} />

        </Route>

        {/* PERFIL */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Layout>
                <Perfil />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
