import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CalendarDays, ListChecks, Lightbulb, Plus, ChevronRight } from "lucide-react";
import Shell, { Stat, Empty } from "@/components/Shell";
import { getMe } from "@/lib/auth";
import { createOrg } from "./actions";
import { STATUS_COLORS, POST_STATUS, NETWORKS, labelOf } from "@/lib/constants";
import { addDays, fmtTime, fmtWeekday, lisbonParts, rangeIso, todayLisbon, weekStart } from "@/lib/dates";

export default async function Painel() {
  const { supabase, profile } = await getMe();
  const isAdmin = profile?.role === "admin";
  const isClient = profile?.role === "client";

  const { data: orgs } = await supabase.from("organizations").select("id, name, slug, color").order("name");
  // Cliente com uma só organização vai diretamente para ela
  if (isClient && orgs?.length === 1) {
    redirect(`/c/${orgs[0].slug}`);
  }

  const today = todayLisbon();
  const ws = weekStart(today);
  const we = addDays(ws, 7);
  const r = rangeIso(ws, we);

  const [{ data: posts }, { data: tasks }, { count: ideasOpen }] = await Promise.all([
    supabase.from("posts").select("id, title, network, status, scheduled_at, org_id").gte("scheduled_at", r.from).lt("scheduled_at", r.to).order("scheduled_at"),
    supabase.from("tasks").select("id, title, owner_side, due_date, org_id, status").neq("status", "feito").order("due_date", { nullsFirst: false }),
    supabase.from("ideas").select("id", { count: "exact", head: true }).in("status", ["pendente", "em_curso"]),
  ]);

  const weekPosts = (posts ?? []).filter((p) => {
    const d = lisbonParts(p.scheduled_at!).date;
    return d >= ws && d < we;
  });
  const orgById = Object.fromEntries((orgs ?? []).map((o) => [o.id, o]));
  const dyviTasks = (tasks ?? []).filter((t) => t.owner_side === "dyvi");
  const clientTasks = (tasks ?? []).filter((t) => t.owner_side === "cliente");

  return (
    <Shell
      title="Painel"
      subtitle="Visão geral dos conteúdos e da produção"
      actions={
        isAdmin ? (
          <details className="relative">
            <summary className="btn"><Plus size={16} /> Novo cliente</summary>
            <form action={createOrg} className="card absolute right-0 z-20 mt-2 w-80 space-y-3 shadow-2xl">
              <div>
                <label className="label">Nome do cliente</label>
                <input name="name" className="input" required placeholder="Ex.: BFisio Clinic" />
              </div>
              <div>
                <label className="label">Cor de identificação</label>
                <input name="color" type="color" defaultValue="#31C2E1" className="h-9 w-full rounded-lg border border-line bg-panel" />
              </div>
              <button className="btn w-full">Criar cliente</button>
            </form>
          </details>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} value={orgs?.length ?? 0} label="Clientes ativos" tone="cyan" tag="na plataforma" />
        <Stat icon={CalendarDays} value={weekPosts.length} label="Publicações esta semana" tone="violet" tag={`${weekPosts.filter((p) => p.status === "publicado").length} publicadas`} />
        <Stat icon={ListChecks} value={dyviTasks.length} label="Tarefas da Dyvi por fazer" tone="magenta" tag={`${clientTasks.length} do cliente`} />
        <Stat icon={Lightbulb} value={ideasOpen ?? 0} label="Ideias por trabalhar" tone="emerald" tag="abertas" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h2">O que sai esta semana</h2>
            <span className="text-xs text-muted">{fmtWeekday(`${ws}T12:00:00Z`)} a {fmtWeekday(`${addDays(we, -1)}T12:00:00Z`)}</span>
          </div>
          {weekPosts.length === 0 ? (
            <Empty>Sem publicações agendadas para esta semana.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {weekPosts.map((p) => {
                const o = orgById[p.org_id];
                return (
                  <li key={p.id}>
                    <Link href={`/c/${o?.slug}/calendario`} className="flex items-center gap-4 py-3 hover:opacity-90">
                      <div className="w-24 shrink-0 text-xs text-muted">
                        <div className="font-semibold capitalize text-slate-200">{fmtWeekday(p.scheduled_at!)}</div>
                        {fmtTime(p.scheduled_at)}
                      </div>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o?.color ?? "#31C2E1" }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{p.title}</div>
                        <div className="text-xs text-muted">{o?.name} · {labelOf(NETWORKS, p.network)}</div>
                      </div>
                      <span className={`pill ${STATUS_COLORS[p.status]}`}>{labelOf(POST_STATUS, p.status)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="h2 mb-4">Tarefas pendentes</h2>
          {(tasks ?? []).length === 0 ? (
            <Empty>Tudo em dia.</Empty>
          ) : (
            <ul className="space-y-2">
              {(tasks ?? []).slice(0, 10).map((t) => {
                const o = orgById[t.org_id];
                const late = t.due_date && t.due_date < today;
                return (
                  <li key={t.id}>
                    <Link href={`/c/${o?.slug}/tarefas`} className="flex items-start gap-3 rounded-xl border border-line bg-panel px-3 py-2.5 hover:border-cyan/40">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.owner_side === "dyvi" ? "bg-cyan" : "bg-magenta"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{t.title}</div>
                        <div className="text-xs text-muted">
                          {o?.name} · {t.owner_side === "dyvi" ? "Dyvi" : "Cliente"}
                          {t.due_date && <span className={late ? "text-magenta" : ""}> · {t.due_date.split("-").reverse().join("/")}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="h2 mb-4">Clientes</h2>
        {(orgs ?? []).length === 0 ? (
          <Empty>{isAdmin ? "Ainda não há clientes. Cria o primeiro no botão Novo cliente." : "Ainda não tens clientes atribuídos."}</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(orgs ?? []).map((o) => (
              <Link key={o.id} href={`/c/${o.slug}`} className="card group flex items-center gap-3 hover:border-cyan/50">
                <div className="icon-tile font-display text-lg font-bold text-ink" style={{ background: o.color ?? "#31C2E1" }}>
                  {o.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 truncate font-semibold text-white">{o.name}</div>
                <ChevronRight size={16} className="text-muted group-hover:text-cyan" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
