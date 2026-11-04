import { redirect } from "next/navigation";
import Shell, { Empty } from "@/components/Shell";
import { getMe } from "@/lib/auth";
import { setRole } from "../actions";

const ROLES = [
  { key: "admin", label: "Admin (vê tudo)" },
  { key: "team", label: "Equipa (clientes atribuídos)" },
  { key: "client", label: "Cliente" },
];

export default async function Equipa() {
  const { supabase, profile } = await getMe();
  if (profile?.role !== "admin") redirect("/");

  const [{ data: people }, { data: members }, { data: orgs }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("*").order("role").order("email"),
    supabase.from("org_members").select("org_id, user_id, member_type"),
    supabase.from("organizations").select("id, name"),
    supabase.from("org_invites").select("org_id, email, member_type"),
  ]);
  const orgName = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]));

  return (
    <Shell title="Equipa e acessos" subtitle="Quem tem conta e a que clientes tem acesso">
      <div className="card">
        <p className="mb-4 text-sm text-muted">
          Para dar acesso a alguém, abre o cliente, vai a Definições do cliente e adiciona o email. A pessoa entra depois em Primeiro acesso com esse email.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted">
                <th className="pb-3">Pessoa</th>
                <th className="pb-3">Clientes</th>
                <th className="pb-3">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(people ?? []).map((p) => {
                const mine = (members ?? []).filter((m) => m.user_id === p.id);
                return (
                  <tr key={p.id}>
                    <td className="py-3">
                      <div className="font-semibold text-white">{p.full_name || p.email}</div>
                      <div className="text-xs text-muted">{p.email}</div>
                    </td>
                    <td className="py-3 text-slate-300">
                      {p.role === "admin" ? "Todos" : mine.map((m) => orgName[m.org_id]).join(", ") || "Nenhum"}
                    </td>
                    <td className="py-3">
                      <form action={setRole} className="flex gap-2">
                        <input type="hidden" name="user_id" value={p.id} />
                        <select name="role" defaultValue={p.role} className="input !w-auto">
                          {ROLES.map((r) => (
                            <option key={r.key} value={r.key}>{r.label}</option>
                          ))}
                        </select>
                        <button className="btn-ghost">Guardar</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="h2 mb-3">Acessos à espera do primeiro login</h2>
        {(invites ?? []).length === 0 ? (
          <Empty>Nenhum.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {(invites ?? []).map((i) => (
              <li key={i.org_id + i.email} className="text-slate-300">
                {i.email} · {orgName[i.org_id]} · {i.member_type === "team" ? "Equipa" : "Cliente"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
