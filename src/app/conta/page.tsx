import Shell from "@/components/Shell";
import { getMe } from "@/lib/auth";
import { updatePassword, updateProfile } from "../actions";

export default async function Conta({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { profile } = await getMe();
  const { ok } = await searchParams;

  return (
    <Shell title="A minha conta" subtitle={profile?.email}>
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <form action={updateProfile} className="card space-y-3">
          <h2 className="h2">Perfil</h2>
          <div>
            <label className="label">Nome</label>
            <input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} />
          </div>
          <button className="btn">Guardar</button>
        </form>
        <form action={updatePassword} className="card space-y-3">
          <h2 className="h2">Password</h2>
          <div>
            <label className="label">Nova password</label>
            <input name="password" type="password" minLength={8} required className="input" />
          </div>
          {ok && <p className="text-sm text-emerald-300">Password atualizada.</p>}
          <button className="btn">Atualizar password</button>
        </form>
      </div>
    </Shell>
  );
}
