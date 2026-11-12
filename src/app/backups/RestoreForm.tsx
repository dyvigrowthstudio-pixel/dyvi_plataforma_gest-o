"use client";

import { useActionState } from "react";
import { restoreBackup, type RestoreState } from "./actions";

export default function RestoreForm() {
  const [state, action, pending] = useActionState<RestoreState, FormData>(restoreBackup, null);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label">Ficheiro de backup (.json)</label>
        <input name="file" type="file" accept="application/json,.json" required className="input file:mr-3 file:rounded-lg file:border-0 file:bg-cyan/15 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-cyan" />
      </div>
      <div>
        <label className="label">Escreve RESTAURAR para confirmar</label>
        <input name="confirm" className="input" autoComplete="off" placeholder="RESTAURAR" />
      </div>
      <button className="btn" disabled={pending}>{pending ? "A restaurar..." : "Restaurar backup"}</button>
      {state && (
        <div className={`rounded-xl border p-3 text-sm ${state.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-magenta/40 bg-magenta/10 text-slate-200"}`}>
          <div className="font-semibold">{state.text}</div>
          {state.details && state.details.length > 0 && (
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-slate-300">
              {state.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
