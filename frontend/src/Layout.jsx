import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LogoEscuro from "./assets/logo_escuro.svg";
import LogoClaro from "./assets/logo_claro.svg";

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function logout() {
    signOut();
    navigate("/login");
  }

const menu = [
  { label: "Upload", to: "/" },
  { label: "Dashboard", to: "/admin/dashboard", admin: true },
  { label: "Clínicas", to: "/admin/clinicas", admin: true },
  { label: "Antecipações", to: "/admin/antecipacoes", admin: true },
  { label: "Perfil", to: "/perfil" },
];

  const logoSrc = theme === "light" ? LogoClaro : LogoEscuro;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">

      {/* SIDEBAR */}
      <aside className="w-60 bg-slate-900/60 border-r border-slate-800 backdrop-blur-xl flex flex-col fixed h-screen">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <img src={logoSrc} className="h-10 opacity-90" alt="MedSimples" />
        </div>

        {/* MENU */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {menu.map((item) => {
            if (item.admin && profile?.role !== "admin") return null;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-500 text-slate-900"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* RODAPÉ */}
        <div className="border-t border-slate-800 px-4 py-4 text-xs text-slate-400">
          <div className="mb-3">
            Usuário:{" "}
            <span className="text-sky-300">{profile?.nome || "—"}</span>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition mb-2"
          >
            Tema: {theme === "dark" ? "Escuro" : "Claro"}
          </button>

          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-300 text-xs transition"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 flex flex-col items-stretch ml-60 min-w-0">
        {children}
      </main>
    </div>
  );
}
