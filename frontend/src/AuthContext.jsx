import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [initializing, setInitializing] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // =============================
  // LOGIN
  // =============================
  async function signIn(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) return { error };

    setUser(data.user);
    await loadProfile(data.user.id);

    return { error: null };
  }

  // =============================
  // LOGOUT
  // =============================
  function signOut() {
    supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  // =============================
  // LOAD PROFILE
  // =============================
  async function loadProfile(userId) {
    if (!userId) return;

    setLoadingProfile(true);

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error) setProfile(data);
    setLoadingProfile(false);
    return data;
  }

  // =============================
  // REFRESH PROFILE (IMEDIATO)
  // =============================
  async function refreshProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error) {
      setProfile(data);
    }

    return data;
  }

  // =============================
  // RESTORE SESSION ON APP START
  // =============================
  useEffect(() => {
    let active = true;

    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      if (data.session?.user) {
        setUser(data.session.user);
        await loadProfile(data.session.user.id);
      }

      setInitializing(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;

        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        initializing,
        loadingProfile,
        user,
        profile,
        signIn,
        signOut,
        refreshProfile, // ADICIONADO AQUI
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
