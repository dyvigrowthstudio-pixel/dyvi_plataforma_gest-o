import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { ClientShell, loadClient } from "@/components/client";
import PostForm, { type Post } from "@/components/PostForm";
import { NETWORKS, POST_STATUS, STATUS_COLORS, labelOf } from "@/lib/constants";
import { addDays, fmtTime, lisbonParts, monthLabel, rangeIso, shiftMonth, todayLisbon, weekStart } from "@/lib/dates";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default async function Calendario({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string; edit?: string; novo?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, org, isStaff } = await loadClient(slug, "calendario");

  const today = todayLisbon();
  const month = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : today.slice(0, 7);
  const first = `${month}-01`;
  const gridStart = weekStart(first);
  const nextFirst = `${shiftMonth(month, 1)}-01`;
  const gridEnd = addDays(weekStart(addDays(nextFirst, -1)), 7);
  const r = rangeIso(gridStart, gridEnd);

  const [{ data: posts }, { data: themes }] = await Promise.all([
    supabase.from("posts").select("*").eq("org_id", org.id).gte("scheduled_at", r.from).lt("scheduled_at", r.to).order("scheduled_at"),
    supabase.from("monthly_themes").select("id, title, month").eq("org_id", org.id).order("month", { ascending: false }),
  ]);

  const byDay: Record<string, Post[]> = {};
  for (const p of (posts ?? []) as Post[]) {
    const d = lisbonParts(p.scheduled_at!).date;
    (byDay[d] ??= []).push(p);
  }

  const days: string[] = [];
  for (let d = gridStart; d < gridEnd; d = addDays(d, 1)) days.push(d);

  let editing: Post | null = null;
  if (sp.edit) {
    const { data } = await supabase.from("posts").select("*").eq("id", sp.edit).eq("org_id", org.id).maybeSingle();
    editing = data as Post | null;
  }
  const base = `/c/${slug}/calendario?m=${month}`;
  const showForm = isStaff && (editing || sp.novo !== undefined);

  return (
    <ClientShell
      org={org}
      isStaff={isStaff}
      module="calendario"
      subtitle={`${org.name} · o que sai, em que dia e a que horas`}
      actions={
        isStaff ? (
          <Link href={`${base}&novo=${today}`} className="btn"><Plus size={16} /> Nova publicação</Link>
        ) : null
      }
    >
      {showForm && (
        <section className="card mb-6 border-cyan/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h2">{editing ? "Editar publicação" : "Nova publicação"}</h2>
            <Link href={base} className="text-muted hover:text-white"><X size={18} /></Link>
          </div>
          <PostForm org={org} post={editing} themes={themes ?? []} defaultDate={sp.novo || undefined} returnTo={base} />
        </section>
      )}

      {!isStaff && editing && (
        <section className="card mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="h2">{editing.title}</h2>
            <Link href={base} className="text-muted hover:text-white"><X size={18} /></Link>
          </div>
          <p className="text-sm text-muted">{labelOf(NETWORKS, editing.network)} · {editing.format} · {labelOf(POST_STATUS, editing.status)}</p>
          {editing.caption && <p className="mt-3 whitespace-pre-line text-sm text-slate-200">{editing.caption}</p>}
        </section>
      )}

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/c/${slug}/calendario?m=${shiftMonth(month, -1)}`} className="btn-ghost h-9 w-9 !p-0"><ChevronLeft size={16} /></Link>
            <Link href={`/c/${slug}/calendario?m=${shiftMonth(month, 1)}`} className="btn-ghost h-9 w-9 !p-0"><ChevronRight size={16} /></Link>
            <h2 className="h2 ml-2">{monthLabel(month)}</h2>
          </div>
          <Link href={`/c/${slug}/calendario`} className="btn-ghost">Hoje</Link>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-panel px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted">{w}</div>
          ))}
          {days.map((d) => {
            const inMonth = d.startsWith(month);
            const isToday = d === today;
            return (
              <div key={d} className={`group min-h-28 bg-card p-1.5 ${inMonth ? "" : "opacity-40"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-cyan text-ink" : "text-slate-300"}`}>
                    {Number(d.slice(8))}
                  </span>
                  {isStaff && (
                    <Link href={`${base}&novo=${d}`} className="hidden text-muted hover:text-cyan group-hover:block"><Plus size={14} /></Link>
                  )}
                </div>
                <div className="space-y-1">
                  {(byDay[d] ?? []).map((p) => (
                    <Link
                      key={p.id}
                      href={`${base}&edit=${p.id}`}
                      className={`block truncate rounded-md px-1.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[p.status]}`}
                      title={`${fmtTime(p.scheduled_at)} · ${p.title}`}
                    >
                      {fmtTime(p.scheduled_at)} {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {POST_STATUS.map((s) => (
            <span key={s.key} className={`pill ${STATUS_COLORS[s.key]}`}>{s.label}</span>
          ))}
        </div>
      </div>
    </ClientShell>
  );
}
