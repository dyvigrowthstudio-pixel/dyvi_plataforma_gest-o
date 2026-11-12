import { redirect } from "next/navigation";
import { Download, ExternalLink, ShieldCheck, RotateCcw } from "lucide-react";
import Shell from "@/components/Shell";
import { getMe } from "@/lib/auth";
import RestoreForm from "./RestoreForm";

const REPO = "dyvigrowthstudio-pixel/dyvi_plataforma_gest-o";

export default async function Backups() {
  const { profile } = await getMe();
  if (profile?.role !== "admin") redirect("/");

  return (
    <Shell
      title="Backups"
      subtitle="Cópias de segurança de todos os dados da plataforma"
      actions={
        <a href="/api/backup" className="btn"><Download size={16} /> Descarregar backup agora</a>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card">
          <div className="icon-tile mb-4 bg-emerald-400/12 text-emerald-300"><ShieldCheck size={18} /></div>
          <h2 className="h2 mb-2">Backup automático diário</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Todos os dias por volta da meia noite é guardada uma cópia completa (clientes, hub da marca, temas, calendário, ideias, tarefas, checklists internas e resultados) no ramo privado <span className="font-mono text-cyan">backups</span> do GitHub. Fica fora do Supabase, por isso sobrevive mesmo que a base de dados falhe.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-300">
            <li>Um ficheiro por dia, guardados durante 120 dias (e para sempre no histórico do GitHub).</li>
            <li><span className="font-mono">ultimo.json</span> é sempre o mais recente.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`https://github.com/${REPO}/tree/backups/backups`} target="_blank" rel="noreferrer" className="btn-ghost">
              <ExternalLink size={14} /> Ver backups no GitHub
            </a>
            <a href={`https://github.com/${REPO}/actions/workflows/backup.yml`} target="_blank" rel="noreferrer" className="btn-ghost">
              <ExternalLink size={14} /> Estado das execuções
            </a>
          </div>
        </section>

        <section className="card">
          <div className="icon-tile mb-4 bg-magenta/12 text-magenta"><RotateCcw size={18} /></div>
          <h2 className="h2 mb-2">Restaurar</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            Repõe os dados de um ficheiro de backup. Nada é apagado: o que estiver no ficheiro volta a aparecer e o que já existe fica com os valores do backup. Coisas criadas depois do backup mantêm se.
          </p>
          <RestoreForm />
        </section>
      </div>
    </Shell>
  );
}
