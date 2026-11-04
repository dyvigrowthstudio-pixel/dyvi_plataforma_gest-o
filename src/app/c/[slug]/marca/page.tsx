import { Pencil, Plus, Trash2, ExternalLink } from "lucide-react";
import { Empty } from "@/components/Shell";
import { ClientShell, Hidden, loadClient } from "@/components/client";
import { addBrandSection, deleteBrandSection, deleteCompetitor, saveBrandSection, saveCompetitor } from "@/app/actions";
import type { Org } from "@/lib/auth";

type Section = {
  id: string;
  title: string;
  kind: "text" | "swot" | "list";
  body: string | null;
  data: { items?: string[]; forcas?: string; fraquezas?: string; oportunidades?: string; ameacas?: string };
};

const SWOT = [
  { key: "forcas", label: "Forças", cls: "border-emerald-400/30 bg-emerald-400/5" },
  { key: "fraquezas", label: "Fraquezas", cls: "border-magenta/30 bg-magenta/5" },
  { key: "oportunidades", label: "Oportunidades", cls: "border-cyan/30 bg-cyan/5" },
  { key: "ameacas", label: "Ameaças", cls: "border-amber-400/30 bg-amber-400/5" },
] as const;

function Lines({ text }: { text?: string | null }) {
  if (!text) return <p className="text-sm italic text-muted">Por preencher</p>;
  return <div className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{text}</div>;
}

function SectionView({ s }: { s: Section }) {
  if (s.kind === "swot")
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {SWOT.map((q) => (
          <div key={q.key} className={`rounded-xl border p-4 ${q.cls}`}>
            <div className="label">{q.label}</div>
            <Lines text={s.data?.[q.key]} />
          </div>
        ))}
      </div>
    );
  if (s.kind === "list") {
    const items = s.data?.items ?? [];
    return items.length === 0 ? (
      <p className="text-sm italic text-muted">Por preencher</p>
    ) : (
      <ul className="flex flex-wrap gap-2">
        {items.map((i, n) => (
          <li key={n} className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-slate-200">{i}</li>
        ))}
      </ul>
    );
  }
  return <Lines text={s.body} />;
}

function SectionEdit({ s, org }: { s: Section; org: Org }) {
  return (
    <form action={saveBrandSection} className="mt-4 space-y-3 border-t border-line pt-4">
      <Hidden org={org} extra={{ id: s.id, kind: s.kind }} />
      <div>
        <label className="label">Título</label>
        <input name="title" defaultValue={s.title} className="input" />
      </div>
      {s.kind === "swot" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {SWOT.map((q) => (
            <div key={q.key}>
              <label className="label">{q.label}</label>
              <textarea name={q.key} defaultValue={s.data?.[q.key] ?? ""} className="input" rows={5} />
            </div>
          ))}
        </div>
      ) : s.kind === "list" ? (
        <div>
          <label className="label">Um item por linha</label>
          <textarea name="items" defaultValue={(s.data?.items ?? []).join("\n")} className="input" rows={6} />
        </div>
      ) : (
        <div>
          <label className="label">Conteúdo</label>
          <textarea name="body" defaultValue={s.body ?? ""} className="input" rows={8} />
        </div>
      )}
      <button className="btn">Guardar</button>
    </form>
  );
}

export default async function Marca({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, org, isStaff } = await loadClient(slug, "marca");
  const [{ data: sections }, { data: competitors }] = await Promise.all([
    supabase.from("brand_sections").select("*").eq("org_id", org.id).order("position"),
    supabase.from("competitors").select("*").eq("org_id", org.id).order("name"),
  ]);

  return (
    <ClientShell org={org} isStaff={isStaff} module="marca" subtitle={`${org.name} · tudo o que define a marca`}>
      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <nav className="hidden xl:block">
          <div className="sticky top-0 space-y-1">
            {(sections ?? []).map((s) => (
              <a key={s.id} href={`#s-${s.id}`} className="block rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-white/5 hover:text-white">{s.title}</a>
            ))}
            <a href="#concorrencia" className="block rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-white/5 hover:text-white">Análise da concorrência</a>
          </div>
        </nav>

        <div className="space-y-5">
          {(sections ?? []).map((s: Section) => (
            <section key={s.id} id={`s-${s.id}`} className="card scroll-mt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="h2">{s.title}</h2>
                {isStaff && (
                  <form action={deleteBrandSection}>
                    <Hidden org={org} extra={{ id: s.id }} />
                    <button className="btn-danger" title="Apagar secção"><Trash2 size={14} /></button>
                  </form>
                )}
              </div>
              <SectionView s={s} />
              {isStaff && (
                <details>
                  <summary className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan"><Pencil size={12} /> Editar</summary>
                  <SectionEdit s={s} org={org} />
                </details>
              )}
            </section>
          ))}

          {isStaff && (
            <details className="card">
              <summary className="flex items-center gap-2 text-sm font-semibold text-cyan"><Plus size={16} /> Adicionar secção</summary>
              <form action={addBrandSection} className="mt-4 grid gap-3 md:grid-cols-[1fr_200px_auto]">
                <Hidden org={org} />
                <input name="title" placeholder="Ex.: Análise RX, Posicionamento" className="input" required />
                <select name="kind" className="input">
                  <option value="text">Texto</option>
                  <option value="list">Lista</option>
                  <option value="swot">Quadro SWOT</option>
                </select>
                <button className="btn">Adicionar</button>
              </form>
            </details>
          )}

          <section id="concorrencia" className="card scroll-mt-4">
            <h2 className="h2 mb-4">Análise da concorrência</h2>
            {(competitors ?? []).length === 0 && <Empty>Ainda sem concorrentes analisados.</Empty>}
            <div className="grid gap-4 lg:grid-cols-2">
              {(competitors ?? []).map((c) => (
                <div key={c.id} className="rounded-xl border border-line bg-panel p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display font-semibold text-white">{c.name}</div>
                    <div className="flex items-center gap-1">
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noreferrer" className="text-muted hover:text-cyan"><ExternalLink size={14} /></a>
                      )}
                      {isStaff && (
                        <form action={deleteCompetitor}>
                          <Hidden org={org} extra={{ id: c.id }} />
                          <button className="btn-danger"><Trash2 size={14} /></button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div><div className="label text-emerald-300">Pontos fortes</div><Lines text={c.strengths} /></div>
                    <div><div className="label text-[#ff7aa8]">Pontos fracos</div><Lines text={c.weaknesses} /></div>
                  </div>
                  {c.notes && <div className="mt-3"><div className="label">Notas</div><Lines text={c.notes} /></div>}
                  {isStaff && (
                    <details>
                      <summary className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan"><Pencil size={12} /> Editar</summary>
                      <CompetitorForm org={org} c={c} />
                    </details>
                  )}
                </div>
              ))}
            </div>
            {isStaff && (
              <details className="mt-4">
                <summary className="inline-flex items-center gap-2 text-sm font-semibold text-cyan"><Plus size={16} /> Adicionar concorrente</summary>
                <CompetitorForm org={org} />
              </details>
            )}
          </section>
        </div>
      </div>
    </ClientShell>
  );
}

function CompetitorForm({ org, c }: { org: Org; c?: Record<string, string | null> }) {
  return (
    <form action={saveCompetitor} className="mt-3 grid gap-3 md:grid-cols-2">
      <Hidden org={org} extra={c ? { id: c.id as string } : undefined} />
      <input name="name" placeholder="Nome" defaultValue={c?.name ?? ""} className="input" required />
      <input name="url" placeholder="Site ou Instagram" defaultValue={c?.url ?? ""} className="input" />
      <textarea name="strengths" placeholder="Pontos fortes" defaultValue={c?.strengths ?? ""} className="input" />
      <textarea name="weaknesses" placeholder="Pontos fracos" defaultValue={c?.weaknesses ?? ""} className="input" />
      <textarea name="notes" placeholder="Notas e oportunidades para nós" defaultValue={c?.notes ?? ""} className="input md:col-span-2" />
      <div><button className="btn">Guardar</button></div>
    </form>
  );
}
