import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Pencil, Plus, Trash2, ListPlus } from "lucide-react";
import { Empty } from "@/components/Shell";
import { ClientShell, Hidden, StatusButtons, loadClient } from "@/components/client";
import { deleteInternalTask, loadOnboardingChecklist, saveInternalTask, setInternalTaskStatus } from "@/app/actions";
import { STATUS_COLORS, TASK_STATUS } from "@/lib/constants";
import { todayLisbon } from "@/lib/dates";
import type { Org } from "@/lib/auth";

type ITask = {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  status: string;
};
type Person = { id: string; name: string };

const fmtDue = (d: string) => d.split("-").reverse().join("/");

export default async function Interno({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ quem?: string }>;
}) {
  const { slug } = await params;
  const { quem } = await searchParams;
  const { supabase, org, isStaff, user } = await loadClient(slug);
  if (!isStaff) notFound();

  const [{ data: tasks, error }, { data: admins }, { data: team }] = await Promise.all([
    supabase.from("internal_tasks").select("*").eq("org_id", org.id).order("due_date", { nullsFirst: false }).order("created_at"),
    supabase.from("profiles").select("id, email, full_name").eq("role", "admin"),
    supabase.from("org_members").select("user_id, profiles(id, email, full_name)").eq("org_id", org.id).eq("member_type", "team"),
  ]);

  const people: Person[] = [];
  const seen = new Set<string>();
  const add = (p: { id: string; email: string; full_name: string | null } | null) => {
    if (!p || seen.has(p.id)) return;
    seen.add(p.id);
    people.push({ id: p.id, name: p.full_name || p.email.split("@")[0] });
  };
  (admins ?? []).forEach(add);
  (team ?? []).forEach((t) => add(t.profiles as unknown as { id: string; email: string; full_name: string | null }));
  const nameOf = Object.fromEntries(people.map((p) => [p.id, p.name]));

  const all = (tasks ?? []) as ITask[];
  const filtered = all.filter((t) => (quem === "eu" ? t.assignee_id === user.id : quem === "ninguem" ? !t.assignee_id : true));
  const open = filtered.filter((t) => t.status !== "feito");
  const done = filtered.filter((t) => t.status === "feito");
  const today = todayLisbon();
  const base = `/c/${slug}/interno`;

  return (
    <ClientShell org={org} isStaff={isStaff} title="Checklist interna" subtitle={`${org.name} · só a equipa Dyvi vê esta página`}>
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-violet/30 bg-violet/10 p-4 text-sm text-slate-200">
        <Lock size={16} className="mt-0.5 shrink-0 text-[#a993ff]" />
        <div>
          Privado: os clientes não têm acesso a esta lista, nem por link direto. Para coisas que o cliente também deve ver, usa a página Tarefas.
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-magenta/40 bg-magenta/10 p-4 text-sm text-slate-200">
          A tabela da checklist ainda não existe. Corre o ficheiro <span className="font-mono">supabase/02-checklist-interna.sql</span> no Supabase.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="h2">Por fazer <span className="pill ml-1 bg-white/5 text-muted">{open.length}</span></h2>
            <div className="flex flex-wrap gap-2">
              <Link href={base} className={`pill ${!quem ? "bg-cyan text-ink" : "bg-white/5 text-muted"}`}>Todas</Link>
              <Link href={`${base}?quem=eu`} className={`pill ${quem === "eu" ? "bg-cyan text-ink" : "bg-white/5 text-muted"}`}>As minhas</Link>
              <Link href={`${base}?quem=ninguem`} className={`pill ${quem === "ninguem" ? "bg-cyan text-ink" : "bg-white/5 text-muted"}`}>Sem responsável</Link>
            </div>
          </div>

          {open.length === 0 && <Empty>Nada pendente.</Empty>}
          <div className="space-y-2.5">
            {open.map((t) => (
              <Row key={t.id} t={t} org={org} people={people} nameOf={nameOf} today={today} />
            ))}
          </div>

          {done.length > 0 && (
            <details className="mt-5">
              <summary className="text-xs font-semibold text-muted">Concluídas ({done.length})</summary>
              <div className="mt-2 space-y-2 opacity-60">
                {done.map((t) => (
                  <Row key={t.id} t={t} org={org} people={people} nameOf={nameOf} today={today} />
                ))}
              </div>
            </details>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="h2 mb-3 flex items-center gap-2"><Plus size={16} className="text-cyan" /> Nova tarefa interna</h2>
            <TaskForm org={org} people={people} defaultAssignee={user.id} />
          </section>

          <section className="card">
            <h2 className="h2 mb-1 flex items-center gap-2"><ListPlus size={16} className="text-cyan" /> Checklist de arranque</h2>
            <p className="mb-3 text-xs text-muted">
              Adiciona de uma vez as tarefas habituais de um cliente novo (Meta, Instagram, Pixel, Google, materiais da marca), já com prazos. Depois ajustas o que for preciso.
            </p>
            <form action={loadOnboardingChecklist} className="flex gap-2">
              <Hidden org={org} />
              <select name="assignee_id" defaultValue={user.id} className="input">
                <option value="">Sem responsável</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn shrink-0">Carregar</button>
            </form>
          </section>
        </aside>
      </div>
    </ClientShell>
  );
}

function Row({ t, org, people, nameOf, today }: { t: ITask; org: Org; people: Person[]; nameOf: Record<string, string>; today: string }) {
  const late = t.due_date && t.due_date < today && t.status !== "feito";
  const soon = t.due_date && !late && t.due_date <= today && t.status !== "feito";
  const who = t.assignee_id ? nameOf[t.assignee_id] ?? "?" : null;
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${who ? "bg-cyan/15 text-cyan" : "bg-white/5 text-muted"}`}
          title={who ?? "Sem responsável"}
        >
          {who ? who.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${t.status === "feito" ? "text-muted line-through" : "text-white"}`}>{t.title}</div>
          {t.description && <p className="mt-1 whitespace-pre-line text-xs text-slate-300">{t.description}</p>}
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
            <span>{who ?? "Sem responsável"}</span>
            {t.due_date && (
              <span className={late ? "font-bold text-magenta" : soon ? "font-bold text-amber-300" : ""}>
                Até {fmtDue(t.due_date)}{late ? " · atrasada" : soon ? " · hoje" : ""}
              </span>
            )}
          </div>
        </div>
        <form action={deleteInternalTask}>
          <Hidden org={org} extra={{ id: t.id }} />
          <button className="btn-danger" title="Apagar"><Trash2 size={14} /></button>
        </form>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <StatusButtons action={setInternalTaskStatus} id={t.id} org={org} current={t.status} options={TASK_STATUS} colors={STATUS_COLORS} />
        <details className="w-full">
          <summary className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan"><Pencil size={12} /> Editar</summary>
          <div className="mt-3"><TaskForm org={org} people={people} t={t} /></div>
        </details>
      </div>
    </div>
  );
}

function TaskForm({ org, people, t, defaultAssignee }: { org: Org; people: Person[]; t?: ITask; defaultAssignee?: string }) {
  return (
    <form action={saveInternalTask} className="space-y-2">
      <Hidden org={org} extra={t ? { id: t.id } : undefined} />
      <input name="title" defaultValue={t?.title} placeholder="Ex.: Configurar Meta Business" required className="input" />
      <textarea name="description" defaultValue={t?.description ?? ""} placeholder="Detalhes, acessos, links" className="input" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Responsável</label>
          <select name="assignee_id" defaultValue={t ? t.assignee_id ?? "" : defaultAssignee ?? ""} className="input">
            <option value="">Sem responsável</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Prazo</label>
          <input name="due_date" type="date" defaultValue={t?.due_date ?? ""} className="input" />
        </div>
      </div>
      <button className="btn">{t ? "Guardar" : "Adicionar"}</button>
    </form>
  );
}
