import { Plus, Trash2 } from "lucide-react";
import { Empty } from "@/components/Shell";
import { ClientShell, Hidden, StatusButtons, loadClient } from "@/components/client";
import { addTask, deleteTask, setTaskStatus } from "@/app/actions";
import { STATUS_COLORS, TASK_STATUS } from "@/lib/constants";
import { todayLisbon } from "@/lib/dates";
import type { Org } from "@/lib/auth";

type Task = { id: string; title: string; description: string | null; owner_side: string; status: string; due_date: string | null };

export default async function Tarefas({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, org, isStaff } = await loadClient(slug, "tarefas");
  const { data } = await supabase.from("tasks").select("*").eq("org_id", org.id).order("due_date", { nullsFirst: false }).order("created_at");
  const tasks = (data ?? []) as Task[];
  const today = todayLisbon();

  const Column = ({ side, title, hint, accent }: { side: string; title: string; hint: string; accent: string }) => {
    const open = tasks.filter((t) => t.owner_side === side && t.status !== "feito");
    const done = tasks.filter((t) => t.owner_side === side && t.status === "feito");
    const canEdit = isStaff || side === "cliente";
    return (
      <section className="card">
        <div className="mb-1 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
          <h2 className="h2">{title}</h2>
          <span className="pill bg-white/5 text-muted">{open.length}</span>
        </div>
        <p className="mb-4 text-xs text-muted">{hint}</p>
        {isStaff && <TaskForm org={org} side={side} />}
        <div className="mt-4 space-y-2.5">
          {open.length === 0 && <Empty>Nada pendente.</Empty>}
          {open.map((t) => <TaskRow key={t.id} t={t} org={org} canEdit={canEdit} isStaff={isStaff} today={today} />)}
        </div>
        {done.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs font-semibold text-muted">Feitas ({done.length})</summary>
            <div className="mt-2 space-y-2 opacity-60">
              {done.map((t) => <TaskRow key={t.id} t={t} org={org} canEdit={canEdit} isStaff={isStaff} today={today} />)}
            </div>
          </details>
        )}
      </section>
    );
  };

  return (
    <ClientShell org={org} isStaff={isStaff} module="tarefas" subtitle={`${org.name} · o que cada lado tem de fazer`}>
      <div className="grid gap-6 xl:grid-cols-2">
        <Column side="dyvi" title="A fazer pela Dyvi" hint="O que a equipa tem de integrar ou entregar" accent="bg-cyan" />
        <Column side="cliente" title="A fazer pelo cliente" hint="Acessos, aprovações, materiais e informações em falta" accent="bg-magenta" />
      </div>
    </ClientShell>
  );
}

function TaskRow({ t, org, canEdit, isStaff, today }: { t: Task; org: Org; canEdit: boolean; isStaff: boolean; today: string }) {
  const late = t.due_date && t.due_date < today && t.status !== "feito";
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${t.status === "feito" ? "text-muted line-through" : "text-white"}`}>{t.title}</div>
          {t.description && <p className="mt-1 whitespace-pre-line text-xs text-slate-300">{t.description}</p>}
          {t.due_date && (
            <div className={`mt-1 text-xs ${late ? "font-bold text-magenta" : "text-muted"}`}>
              Prazo {t.due_date.split("-").reverse().join("/")}{late && " · atrasada"}
            </div>
          )}
        </div>
        {isStaff && (
          <form action={deleteTask}>
            <Hidden org={org} extra={{ id: t.id }} />
            <button className="btn-danger"><Trash2 size={14} /></button>
          </form>
        )}
      </div>
      {canEdit ? (
        <div className="mt-2.5">
          <StatusButtons action={setTaskStatus} id={t.id} org={org} current={t.status} options={TASK_STATUS} colors={STATUS_COLORS} />
        </div>
      ) : null}
    </div>
  );
}

function TaskForm({ org, side }: { org: Org; side: string }) {
  return (
    <details>
      <summary className="inline-flex items-center gap-2 text-sm font-semibold text-cyan"><Plus size={16} /> Nova tarefa</summary>
      <form action={addTask} className="mt-3 space-y-2">
        <Hidden org={org} extra={{ owner_side: side }} />
        <input name="title" placeholder="O que é preciso fazer" required className="input" />
        <textarea name="description" placeholder="Detalhes, links, o que copiar e colar" className="input" />
        <div className="flex gap-2">
          <input name="due_date" type="date" className="input" />
          <button className="btn shrink-0">Adicionar</button>
        </div>
      </form>
    </details>
  );
}
