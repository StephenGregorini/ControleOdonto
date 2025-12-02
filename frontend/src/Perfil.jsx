import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import PageLayout from "./components/ui/PageLayout";
import { supabase } from "./supabaseClient";
import { Pencil, KeyRound, Loader2 } from "lucide-react";

export default function Perfil() {
  const { user, profile, refreshProfile } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.nome || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-slate-200">
        <h1 className="text-2xl font-semibold mb-4">Meu Perfil</h1>
        <p className="text-slate-400 text-sm">
          Você precisa estar autenticado para ver esta página.
        </p>
      </div>
    );
  }

  // =========================
  // SALVAR NOME NO SUPABASE + ATUALIZAR FRONT
  // =========================
  async function handleSaveName(e) {
    e.preventDefault();
    setNameMessage(null);

    if (!newName.trim()) {
      setNameMessage({
        type: "error",
        text: "O nome não pode ficar em branco.",
      });
      return;
    }

    try {
      setSavingName(true);

      const { error } = await supabase
        .from("usuarios")
        .update({ nome: newName.trim() })
        .eq("id", user.id);

      if (error) {
        setNameMessage({
          type: "error",
          text: "Não foi possível salvar o nome. Tente novamente.",
        });
        return;
      }

      // ATUALIZA PERFIL LOCALMENTE (SEM RELOAD)
      await refreshProfile();

      setNameMessage({
        type: "success",
        text: "Nome atualizado com sucesso!",
      });

      setEditingName(false);

    } catch (err) {
      setNameMessage({
        type: "error",
        text: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setSavingName(false);
    }
  }

  // =========================
  // ALTERAR SENHA (AUTH)
  // =========================
  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage(null);

    if (!newPassword || !confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Preencha a nova senha e a confirmação.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "As senhas não conferem.",
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "A senha deve ter pelo menos 8 caracteres.",
      });
      return;
    }

    try {
      setSavingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordMessage({
          type: "error",
          text: "Não foi possível alterar a senha. Tente novamente.",
        });
        return;
      }

      setPasswordMessage({
        type: "success",
        text: "Senha alterada com sucesso! Use a nova senha no próximo login.",
      });

      setChangingPassword(false);
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <PageLayout>
      <div className="w-full max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Meu <span className="text-sky-400">Perfil</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-3xl">
            Informações da sua conta no MedSimples.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-7 space-y-6">

          {/* EMAIL */}
          <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Email</span>
          <span className="text-sky-300 text-sm font-medium">
            {user?.email}
          </span>
        </div>

        {/* NOME */}
          <div className="flex justify-between items-center gap-4">
            <div>
            <span className="text-slate-400 text-sm">Nome</span>
            <div className="text-slate-200 text-sm font-medium">
              {profile?.nome || "—"}
            </div>
          </div>

          <button
              type="button"
            onClick={() => {
              setEditingName(true);
              setNameMessage(null);
              setNewName(profile?.nome || "");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300 transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar nome
          </button>
        </div>

          {/* PAPEL */}
          <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Papel</span>
          <span
            className={`text-sm font-medium ${
              profile?.role === "admin" ? "text-emerald-300" : "text-slate-300"
            }`}
          >
            {profile?.role || "—"}
          </span>
        </div>

          {/* ID */}
          <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">ID do usuário</span>
          <span className="text-slate-600 text-xs sm:text-sm font-mono break-all text-right">
            {user?.id}
          </span>
        </div>

          {/* DIVISOR */}
          <div className="border-t border-slate-800 pt-4" />

          {/* AÇÕES */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
            <p className="text-slate-300 text-sm font-medium">Segurança da conta</p>
            <p className="text-slate-500 text-xs sm:text-[13px]">
              Atualize seu nome de exibição e altere sua senha.
            </p>
            </div>

          <button
            type="button"
            onClick={() => {
              setChangingPassword(true);
              setPasswordMessage(null);
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300 transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Alterar senha
          </button>
        </div>

          {/* FORM EDITAR NOME */}
          {editingName && (
            <form
            onSubmit={handleSaveName}
            className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3"
          >
            <p className="text-slate-200 text-sm font-medium">Atualizar nome</p>

            <input
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameMessage(null);
                  setNewName(profile?.nome || "");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-400"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingName}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-sky-500 text-slate-950"
              >
                {savingName && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar nome
              </button>
            </div>

            {nameMessage && (
              <p
                className={`text-xs ${
                  nameMessage.type === "error"
                    ? "text-rose-400"
                    : "text-emerald-400"
                }`}
              >
                {nameMessage.text}
              </p>
            )}
            </form>
          )}

          {/* FORM ALTERAR SENHA */}
          {changingPassword && (
            <form
            onSubmit={handleChangePassword}
            className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3"
          >
            <p className="text-slate-200 text-sm font-medium">Alterar senha</p>

            <input
              type="password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha"
            />

            <input
              type="password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar senha"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordMessage(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-400"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-sky-500 text-slate-950"
              >
                {savingPassword && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Salvar nova senha
              </button>
            </div>

            {passwordMessage && (
              <p
                className={`text-xs ${
                  passwordMessage.type === "error"
                    ? "text-rose-400"
                    : "text-emerald-400"
                }`}
              >
                {passwordMessage.text}
              </p>
            )}
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
