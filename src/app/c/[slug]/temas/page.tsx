import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Empty } from "@/components/Shell";
import { ClientShell, Hidden, loadClient } from "@/components/client";
import { deleteTheme, saveTheme } from "@/app/actions";
import { monthLabel, shiftMonth, todayLisbon } from "@/lib/dates";
import type { Org } from "@/lib/auth";

type Theme = { id: string; month: string; title: string; pillar: string | null; description: string | null };

export default async function Temas({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, org, isStaff } = await loadClient(slug, "temas");

  const start = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : todayLisbon().slice(0, 7);
  const months = [start, shiftMonth(start, 1), shiftMonth(start, 2)];

  const [{ data: themes }, { data: posts }] = await Promise.all([
    supabase.from("monthly_themes").select("*").eq("org_id", org.id).gte("month", `${months[0]}-01`).lte("month", `${months[2]}-01`).order("created_at"),
    supabase.from("posts").select("theme_id").eq("org_id", org.id).not("theme_id", "is", null),
  ]);
  const countByTheme: Record<string, number> = {};
  for (const p of posts ?? []) countByTheme[p.theme_id!] = (countByTheme[p.theme_id!] ?? 0) + 1;

  return (
    <ClientShell org={org} isStaff={isStaff} module="temas" subtitle={`${org.name} · o que vamos abordar em cada mês`}>
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/c/${slug}/temas?m=${shiftMonth(start, -1)}`} className="btn-ghost h-9 w-9 !p-0"><ChevronLeft size={16} /></Link>
        <Link href={`/c/${slug}/temas?m=${shiftMonth(start, 1)}`} className="btn-ghost h-9 w-9 !p-0"><ChevronRight size={16} /></Link>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {months.map((m, idx) => {
          const list = ((themes ?? []) as Theme[]).filter((t) => t.month.startsWith(m));
          return (
            <section key={m} className={`card ${idx === 0 ? "border-cyan/40" : ""}`}>
              <h2 className="h2 mb-4">{monthLabel(m)}</h2>
              <div className="space-y-3">
                {list.length === 0 && <Empty>Sem temas.</Empty>}
                {list.map((t) => (
                  <div key={t.id} className="rounded-xl border border-line bg-panel p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {t.pillar && <div className="label !text-violet">{t.pillar}</div>}
                        <div className="font-semibold text-white">{t.title}</div>
                      </div>
                      {isStaff && (
                        <form action={deleteTheme}>
                          <Hidden org={org} extra={{ id: t.id }} />
                          <button className="btn-danger"><Trash2 size={14} /></button>
                        </form>
                      )}
                    </div>
                    {t.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{t.description}</p>}
                    <div className="mt-2 text-xs text-muted">{countByTheme[t.id] ?? 0} publicações ligadas</div>
                    {isStaff && (
                      <details>
                        <summary className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan"><Pencil size={12} /> Editar</summary>
                        <ThemeForm org={org} month={m} t={t} />
                      </details>
                    )}
                  </div>
                ))}
              </div>
              {isStaff && (
                <details className="mt-4">
                  <summary className="inline-flex items-center gap-2 text-sm font-semibold text-cyan"><Plus size={16} /> Adicionar tema</summary>
                  <ThemeForm org={org} month={m} />
                </details>
              )}
            </section>
          );
        })}
      </div>
    </ClientShell>
  );
}

function ThemeForm({ org, month, t }: { org: Org; month: string; t?: Theme }) {
  return (
    <form action={saveTheme} className="mt-3 space-y-2">
      <Hidden org={org} extra={t ? { id: t.id } : undefined} />
      <input type="month" name="month" defaultValue={t ? t.month.slice(0, 7) : month} className="input" />
      <input name="title" placeholder="Tema" defaultValue={t?.title} required className="input" />
      <input name="pillar" placeholder="Pilar (ex.: Educação, Bastidores)" defaultValue={t?.pillar ?? ""} className="input" />
      <textarea name="description" placeholder="O que vamos falar, ângulos, ideias" defaultValue={t?.description ?? ""} className="input" />
      <button className="btn">Guardar</button>
    </form>
  );
}
