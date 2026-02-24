// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { DashboardProvider } from "./DashboardContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* CONTEXTO GLOBAL DE AUTENTICAÇÃO */}
      <AuthProvider>
        {/* CONTEXTO GLOBAL DO DASHBOARD (não desmonta ao trocar abas) */}
        <DashboardProvider>
          {/* ÚNICO Router da aplicação inteira */}
          <App />
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
