import { Plus, Trash2 } from "lucide-react";
import { Empty } from "@/components/Shell";
import { ClientShell, Hidden, StatusButtons, loadClient } from "@/components/client";
import { addIdea, deleteIdea, setIdeaStatus } from "@/app/actions";
import { IDEA_STATUS, STATUS_COLORS } from "@/lib/constants";
import { fmtDate } from "@/lib/dates";

export default async function Ideias({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { slug } = await params;
  const { f } = await searchParams;
  const { supabase, org, isStaff, user } = await loadClient(slug, "ideias");

  const [{ data: ideas }, { data: people }] = await Promise.all([
    supabase.from("ideas").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("org_members").select("user_id, member_type").eq("org_id", org.id),
  ]);
  const clientIds = new Set((people ?? []).filter((p) => p.member_type === "client").map((p) => p.user_id));
  const list = (ideas ?? []).filter((i) => !f || i.status === f);
  const count = (k: string) => (ideas ?? []).filter((i) => i.status === k).length;

  return (
    <ClientShell org={org} isStaff={isStaff} module="ideias" subtitle={`${org.name} · ideias da equipa e do cliente`}>
      <form action={addIdea} className="card mb-6 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <Hidden org={org} />
        <input name="title" placeholder="Nova ideia" required className="input" />
        <input name="description" placeholder="Detalhes, referências, links (opcional)" className="input" />
        <button className="btn"><Plus size={16} /> Adicionar</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <a href={`/c/${slug}/ideias`} className={`pill ${!f ? "bg-cyan text-ink" : "bg-white/5 text-muted"}`}>Todas · {(ideas ?? []).length}</a>
        {IDEA_STATUS.map((s) => (
          <a key={s.key} href={`/c/${slug}/ideias?f=${s.key}`} className={`pill ${f === s.key ? STATUS_COLORS[s.key] + " ring-1 ring-current" : "bg-white/5 text-muted"}`}>
            {s.label} · {count(s.key)}
          </a>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty>Sem ideias aqui.</Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((i) => (
            <div key={i.id} className="card !p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{i.title}</div>
                  {i.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{i.description}</p>}
                  <div className="mt-2 text-xs text-muted">
                    {clientIds.has(i.created_by) ? "Sugerida pelo cliente" : "Sugerida pela Dyvi"} · {fmtDate(i.created_at)}
                  </div>
                </div>
                {(isStaff || i.created_by === user.id) && (
                  <form action={deleteIdea}>
                    <Hidden org={org} extra={{ id: i.id }} />
                    <button className="btn-danger"><Trash2 size={14} /></button>
                  </form>
                )}
              </div>
              <div className="mt-3">
                <StatusButtons action={setIdeaStatus} id={i.id} org={org} current={i.status} options={IDEA_STATUS} colors={STATUS_COLORS} />
              </div>
            </div>
          ))}
        </div>
      )}
    </ClientShell>
  );
}
