"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "entrar" | "criar" | "recuperar";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const origin = window.location.origin;

    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ ok: false, text: "Email ou password incorretos, ou conta ainda por confirmar." });
      else {
        router.push("/");
        router.refresh();
      }
    } else if (mode === "criar") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) setMsg({ ok: false, text: error.message });
      else setMsg({ ok: true, text: "Conta criada. Confirma o email com o link que te enviámos." });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/conta`,
      });
      if (error) setMsg({ ok: false, text: error.message });
      else setMsg({ ok: true, text: "Enviámos um link para definires uma password nova." });
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-bold text-white">
            dyvi<span className="text-cyan">.</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Plataforma de gestão</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <h1 className="h2">
            {mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Recuperar password"}
          </h1>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "recuperar" && (
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
          <button className="btn w-full" disabled={loading}>
            {loading ? "Um momento..." : mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Enviar link"}
          </button>
          <div className="flex justify-between text-xs text-slate-500">
            {mode !== "entrar" ? (
              <button type="button" onClick={() => setMode("entrar")}>Já tenho conta</button>
            ) : (
              <button type="button" onClick={() => setMode("criar")}>Primeiro acesso</button>
            )}
            {mode !== "recuperar" && (
              <button type="button" onClick={() => setMode("recuperar")}>Esqueci a password</button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
