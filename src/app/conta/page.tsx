import Shell from "@/components/Shell";
import { getMe } from "@/lib/auth";
import { updatePassword, updateProfile } from "../actions";

const ERROS: Record<string, string> = {
  formato: "O nome de utilizador deve ter 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou underscore.",
  ocupado: "Esse nome de utilizador já está a ser usado.",
  geral: "Não foi possível guardar. Tenta outra vez.",
};

export default async function Conta({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string; guardado?: string }> }) {
  const { profile } = await getMe();
  const { ok, erro, guardado } = await searchParams;

  return (
    <Shell title="A minha conta" subtitle={profile?.email}>
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <form action={updateProfile} className="card space-y-3">
          <h2 className="h2">Perfil</h2>
          <div>
            <label className="label">Nome</label>
            <input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} placeholder="Como apareces na plataforma" />
          </div>
          <div>
            <label className="label">Nome de utilizador (para entrar)</label>
            <input name="username" className="input" defaultValue={profile?.username ?? ""} placeholder="ex.: rui" autoCapitalize="none" />
          </div>
          {erro && ERROS[erro] && <p className="text-sm text-[#ff7aa8]">{ERROS[erro]}</p>}
          {guardado && <p className="text-sm text-emerald-300">Guardado.</p>}
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
