import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [initializing, setInitializing] = useState(true); // 🔥 novo
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ============================================
  // LOGIN
  // ============================================
  async function signIn(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) return { error };

    // NÃO setar user aqui — deixamos o onAuthStateChange cuidar
    return { error: null };
  }

  function signOut() {
    supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  // ============================================
  // CARREGAR PERFIL
  // ============================================
  async function loadProfile(userId) {
    if (!userId) return;

    setLoadingProfile(true);

    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setProfile(data || null);
    setLoadingProfile(false);
  }

  // ============================================
  // RESTAURAR SESSÃO AO INICIAR O APP
  // ============================================
  useEffect(() => {
    let active = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }

      setInitializing(false); // 📌 só agora liberamos o ProtectedRoute
    }

    init();

    // LISTENER DE AUTENTICAÇÃO
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id); // sem await
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        initializing,
        loadingProfile,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
