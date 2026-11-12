"use client";

import { useActionState, useState } from "react";
import { recover, signIn, signUp, type LoginState } from "./actions";

type Mode = "entrar" | "criar" | "recuperar";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("entrar");
  const [inState, inAction, inPending] = useActionState<LoginState, FormData>(signIn, null);
  const [upState, upAction, upPending] = useActionState<LoginState, FormData>(signUp, null);
  const [reState, reAction, rePending] = useActionState<LoginState, FormData>(recover, null);

  const msg = mode === "entrar" ? inState : mode === "criar" ? upState : reState;
  const pending = mode === "entrar" ? inPending : mode === "criar" ? upPending : rePending;
  const action = mode === "entrar" ? inAction : mode === "criar" ? upAction : reAction;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-bold text-white">
            dyvi<span className="text-cyan">.</span>
          </div>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Growth Studio · Plataforma</p>
        </div>
        <form key={mode} action={action} className="card space-y-4">
          <h1 className="h2">
            {mode === "entrar" ? "Entrar" : mode === "criar" ? "Primeiro acesso" : "Recuperar password"}
          </h1>

          {mode === "criar" ? (
            <>
              <div>
                <label className="label">Email</label>
                <input name="email" className="input" type="email" required autoComplete="email" />
              </div>
              <div>
                <label className="label">Nome de utilizador</label>
                <input
                  name="username"
                  className="input"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9._\-]+"
                  placeholder="ex.: rui"
                  autoComplete="username"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="label">Nome de utilizador</label>
              <input name="identifier" className="input" required autoComplete="username" autoCapitalize="none" placeholder="ou email" />
            </div>
          )}

          {mode !== "recuperar" && (
            <div>
              <label className="label">Password</label>
              <input
                name="password"
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "criar" ? "new-password" : "current-password"}
              />
            </div>
          )}

          {msg?.text && <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-[#ff7aa8]"}`}>{msg.text}</p>}

          <button className="btn w-full" disabled={pending}>
            {pending ? "Um momento..." : mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Enviar link"}
          </button>
          <div className="flex justify-between text-xs text-muted">
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
