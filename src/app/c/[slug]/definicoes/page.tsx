import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Empty } from "@/components/Shell";
import { ClientShell, Hidden, loadClient } from "@/components/client";
import { addMember, deleteOrg, removeInvite, removeMember, updateOrg } from "@/app/actions";
import { MODULES } from "@/lib/constants";

export default async function Definicoes({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, org, isStaff, isAdmin } = await loadClient(slug);
  if (!isStaff) notFound();

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from("org_members").select("user_id, member_type, profiles(email, full_name)").eq("org_id", org.id),
    isAdmin ? supabase.from("org_invites").select("*").eq("org_id", org.id) : Promise.resolve({ data: [] }),
  ]);

  return (
    <ClientShell org={org} isStaff={isStaff} subtitle={`${org.name} · módulos e acessos`} title="Definições do cliente">
      <div className="grid gap-6 xl:grid-cols-2">
        <form action={updateOrg} className="card space-y-4">
          <Hidden org={org} />
          <h2 className="h2">Template do cliente</h2>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div><label className="label">Nome</label><input name="name" defaultValue={org.name} className="input" /></div>
            <div><label className="label">Cor</label><input name="color" type="color" defaultValue={org.color ?? "#31C2E1"} className="h-10 w-full rounded-lg border border-line bg-panel" /></div>
          </div>
          <div>
            <label className="label">Módulos ativos</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODULES.map((m) => (
                <label key={m.key} className="flex items-center gap-2.5 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-slate-200">
                  <input type="checkbox" name="modules" value={m.key} defaultChecked={org.modules.includes(m.key)} className="h-4 w-4 accent-cyan" />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <button className="btn">Guardar</button>
        </form>

        <section className="card">
          <h2 className="h2 mb-1">Acessos</h2>
          <p className="mb-4 text-xs text-muted">
            Depois de adicionares o email, a pessoa entra em Primeiro acesso com esse email e cria a password.
          </p>
          {isAdmin && (
            <form action={addMember} className="mb-4 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
              <Hidden org={org} />
              <input name="email" type="email" placeholder="email@exemplo.pt" required className="input" />
              <select name="member_type" className="input">
                <option value="client">Cliente</option>
                <option value="team">Equipa Dyvi</option>
              </select>
              <button className="btn">Dar acesso</button>
            </form>
          )}
          <ul className="space-y-2">
            {(members ?? []).length === 0 && (invites ?? []).length === 0 && <Empty>Só os admins têm acesso.</Empty>}
            {(members ?? []).map((m) => {
              const p = m.profiles as unknown as { email: string; full_name: string | null } | null;
              return (
                <li key={m.user_id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{p?.full_name || p?.email}</div>
                    <div className="text-xs text-muted">{m.member_type === "team" ? "Equipa Dyvi" : "Cliente"}</div>
                  </div>
                  {isAdmin && (
                    <form action={removeMember}>
                      <Hidden org={org} extra={{ user_id: m.user_id }} />
                      <button className="btn-danger"><Trash2 size={14} /></button>
                    </form>
                  )}
                </li>
              );
            })}
            {(invites ?? []).map((i: { email: string; member_type: string }) => (
              <li key={i.email} className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-line px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-slate-300">{i.email}</div>
                  <div className="text-xs text-muted">{i.member_type === "team" ? "Equipa Dyvi" : "Cliente"} · ainda não entrou</div>
                </div>
                <form action={removeInvite}>
                  <Hidden org={org} extra={{ email: i.email }} />
                  <button className="btn-danger"><Trash2 size={14} /></button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        {isAdmin && (
          <form action={deleteOrg} className="card border-magenta/30 xl:col-span-2">
            <Hidden org={org} extra={{ name: org.name }} />
            <h2 className="h2 mb-1 text-magenta">Apagar cliente</h2>
            <p className="mb-3 text-sm text-muted">Apaga o cliente e todos os dados dele. Não dá para desfazer. Escreve o nome do cliente para confirmar.</p>
            <div className="flex gap-2">
              <input name="confirm" placeholder={org.name} className="input max-w-xs" />
              <button className="inline-flex items-center rounded-xl bg-magenta px-4 py-2 text-sm font-semibold text-white">Apagar</button>
            </div>
          </form>
        )}
      </div>
    </ClientShell>
  );
}
