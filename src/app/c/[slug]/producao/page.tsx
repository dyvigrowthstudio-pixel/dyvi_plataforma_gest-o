import Link from "next/link";
import { Plus, X, User } from "lucide-react";
import { ClientShell, Hidden, loadClient } from "@/components/client";
import PostForm, { type Post } from "@/components/PostForm";
import { setPostStatus } from "@/app/actions";
import { NETWORKS, POST_STATUS, STATUS_COLORS, labelOf } from "@/lib/constants";
import { fmtDate, fmtTime } from "@/lib/dates";

export default async function Producao({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string; novo?: string; todos?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, org, isStaff } = await loadClient(slug, "producao");

  // Por defeito esconde publicações já publicadas há mais de 30 dias
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
  let q = supabase.from("posts").select("*").eq("org_id", org.id).order("scheduled_at", { nullsFirst: true });
  if (!sp.todos) q = q.or(`status.neq.publicado,scheduled_at.gte.${cutoff}`);
  const [{ data: posts }, { data: themes }] = await Promise.all([
    q,
    supabase.from("monthly_themes").select("id, title, month").eq("org_id", org.id).order("month", { ascending: false }),
  ]);

  const editing = sp.edit ? ((posts ?? []).find((p) => p.id === sp.edit) as Post | undefined) : undefined;
  const base = `/c/${slug}/producao`;

  return (
    <ClientShell
      org={org}
      isStaff={isStaff}
      module="producao"
      subtitle={`${org.name} · em que fase está cada peça`}
      actions={isStaff ? <Link href={`${base}?novo=1`} className="btn"><Plus size={16} /> Nova peça</Link> : null}
    >
      {isStaff && (editing || sp.novo) && (
        <section className="card mb-6 border-cyan/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h2">{editing ? "Editar peça" : "Nova peça"}</h2>
            <Link href={base} className="text-muted hover:text-white"><X size={18} /></Link>
          </div>
          <PostForm org={org} post={editing} themes={themes ?? []} returnTo={base} />
        </section>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {POST_STATUS.map((col) => {
          const list = ((posts ?? []) as Post[]).filter((p) => p.status === col.key);
          return (
            <div key={col.key} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className={`pill ${STATUS_COLORS[col.key]}`}>{col.label}</span>
                <span className="text-xs font-bold text-muted">{list.length}</span>
              </div>
              <div className="space-y-2.5">
                {list.map((p) => (
                  <div key={p.id} className="rounded-xl border border-line bg-card p-3">
                    <Link href={`${base}?edit=${p.id}`} className="block text-sm font-semibold text-white hover:text-cyan">{p.title}</Link>
                    <div className="mt-1.5 text-xs text-muted">
                      {labelOf(NETWORKS, p.network)} · {p.format}
                      {p.scheduled_at && <> · {fmtDate(p.scheduled_at)} {fmtTime(p.scheduled_at)}</>}
                    </div>
                    {p.assignee && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-300"><User size={12} /> {p.assignee}</div>
                    )}
                    {isStaff && (
                      <form action={setPostStatus} className="mt-2.5 flex gap-1.5">
                        <Hidden org={org} extra={{ id: p.id }} />
                        <select name="status" defaultValue={p.status} className="input !py-1 !text-xs">
                          {POST_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <button className="btn-ghost !py-1 !text-xs">Mover</button>
                      </form>
                    )}
                  </div>
                ))}
                {list.length === 0 && <div className="rounded-xl border border-dashed border-line py-6 text-center text-xs text-muted">Vazio</div>}
              </div>
            </div>
          );
        })}
      </div>
      <Link href={sp.todos ? base : `${base}?todos=1`} className="text-xs font-semibold text-cyan">
        {sp.todos ? "Esconder publicações antigas" : "Mostrar também publicações antigas"}
      </Link>
    </ClientShell>
  );
}
