import Link from "next/link";
import { CalendarDays, ListChecks, Lightbulb, Sparkles } from "lucide-react";
import { Stat, Empty } from "@/components/Shell";
import { ClientShell, loadClient } from "@/components/client";
import { NETWORKS, POST_STATUS, STATUS_COLORS, labelOf } from "@/lib/constants";
import { addDays, fmtTime, fmtWeekday, lisbonParts, monthLabel, rangeIso, shiftMonth, todayLisbon, weekStart } from "@/lib/dates";

export default async function Overview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, org, isStaff } = await loadClient(slug);

  const today = todayLisbon();
  const ws = weekStart(today);
  const we = addDays(ws, 7);
  const r = rangeIso(ws, we);
  const thisMonth = today.slice(0, 7);
  const nextMonth = shiftMonth(thisMonth, 1);

  const [{ data: posts }, { data: tasks }, { data: ideas }, { data: themes }] = await Promise.all([
    supabase.from("posts").select("*").eq("org_id", org.id).gte("scheduled_at", r.from).lt("scheduled_at", r.to).order("scheduled_at"),
    supabase.from("tasks").select("*").eq("org_id", org.id).neq("status", "feito").order("due_date", { nullsFirst: false }),
    supabase.from("ideas").select("id, status").eq("org_id", org.id),
    supabase.from("monthly_themes").select("*").eq("org_id", org.id).in("month", [`${thisMonth}-01`, `${nextMonth}-01`]),
  ]);

  const weekPosts = (posts ?? []).filter((p) => {
    const d = lisbonParts(p.scheduled_at).date;
    return d >= ws && d < we;
  });
  const openIdeas = (ideas ?? []).filter((i) => i.status === "pendente" || i.status === "em_curso").length;
  const has = (m: string) => org.modules.includes(m);

  return (
    <ClientShell org={org} isStaff={isStaff}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarDays} value={weekPosts.length} label="Publicações esta semana" tone="cyan" />
        <Stat icon={ListChecks} value={(tasks ?? []).filter((t) => t.owner_side === "dyvi").length} label="Tarefas da Dyvi" tone="violet" />
        <Stat icon={ListChecks} value={(tasks ?? []).filter((t) => t.owner_side === "cliente").length} label="Tarefas do cliente" tone="magenta" />
        <Stat icon={Lightbulb} value={openIdeas} label="Ideias por trabalhar" tone="emerald" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h2">Esta semana</h2>
            {has("calendario") && <Link href={`/c/${slug}/calendario`} className="text-xs font-semibold text-cyan">Ver calendário</Link>}
          </div>
          {weekPosts.length === 0 ? (
            <Empty>Nada agendado para esta semana.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {weekPosts.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <div className="w-24 shrink-0 text-xs text-muted">
                    <div className="font-semibold capitalize text-slate-200">{fmtWeekday(p.scheduled_at)}</div>
                    {fmtTime(p.scheduled_at)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{p.title}</div>
                    <div className="text-xs text-muted">{labelOf(NETWORKS, p.network)} · {p.format}</div>
                  </div>
                  <span className={`pill ${STATUS_COLORS[p.status]}`}>{labelOf(POST_STATUS, p.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h2">Temas</h2>
            {has("temas") && <Link href={`/c/${slug}/temas`} className="text-xs font-semibold text-cyan">Ver todos</Link>}
          </div>
          {[thisMonth, nextMonth].map((m) => {
            const list = (themes ?? []).filter((t) => t.month.startsWith(m));
            return (
              <div key={m} className="mb-4">
                <div className="label">{monthLabel(m)}</div>
                {list.length === 0 ? (
                  <p className="text-sm text-muted">Sem temas definidos.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {list.map((t) => (
                      <li key={t.id} className="flex items-start gap-2 text-sm text-slate-200">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-violet" /> {t.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </ClientShell>
  );
}
