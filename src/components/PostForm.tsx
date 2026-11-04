import { FORMATS, NETWORKS, POST_STATUS } from "@/lib/constants";
import { lisbonParts } from "@/lib/dates";
import { savePost, deletePost } from "@/app/actions";
import { Hidden, Select } from "./client";
import type { Org } from "@/lib/auth";

export type Post = {
  id: string;
  title: string;
  network: string;
  format: string;
  status: string;
  scheduled_at: string | null;
  caption: string | null;
  notes: string | null;
  assignee: string | null;
  theme_id: string | null;
};

export default function PostForm({
  org,
  post,
  themes,
  defaultDate,
  returnTo,
}: {
  org: Org;
  post?: Post | null;
  themes: { id: string; title: string; month: string }[];
  defaultDate?: string;
  returnTo?: string;
}) {
  const when = post?.scheduled_at ? lisbonParts(post.scheduled_at) : null;
  return (
    <div className="space-y-3">
      <form action={savePost} className="grid gap-3 md:grid-cols-4">
        <Hidden org={org} extra={{ ...(post ? { id: post.id } : {}), ...(returnTo ? { return_to: returnTo } : {}) }} />
        <div className="md:col-span-4">
          <label className="label">Título ou gancho</label>
          <input name="title" defaultValue={post?.title} required className="input" />
        </div>
        <div>
          <label className="label">Data</label>
          <input name="date" type="date" defaultValue={when?.date ?? defaultDate} className="input" />
        </div>
        <div>
          <label className="label">Hora</label>
          <input name="time" type="time" defaultValue={when?.time ?? "12:00"} className="input" />
        </div>
        <div>
          <label className="label">Rede</label>
          <Select name="network" options={NETWORKS} defaultValue={post?.network} />
        </div>
        <div>
          <label className="label">Formato</label>
          <Select name="format" options={FORMATS} defaultValue={post?.format} />
        </div>
        <div>
          <label className="label">Estado</label>
          <Select name="status" options={POST_STATUS} defaultValue={post?.status} />
        </div>
        <div>
          <label className="label">Tema</label>
          <select name="theme_id" defaultValue={post?.theme_id ?? ""} className="input">
            <option value="">Sem tema</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.month.slice(0, 7)})</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Responsável</label>
          <input name="assignee" defaultValue={post?.assignee ?? ""} placeholder="Quem trata" className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Legenda</label>
          <textarea name="caption" defaultValue={post?.caption ?? ""} rows={5} className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Notas, guião ou referências</label>
          <textarea name="notes" defaultValue={post?.notes ?? ""} rows={5} className="input" />
        </div>
        <div className="md:col-span-4">
          <button className="btn">{post ? "Guardar alterações" : "Adicionar publicação"}</button>
        </div>
      </form>
      {post && (
        <form action={deletePost}>
          <Hidden org={org} extra={{ id: post.id, ...(returnTo ? { return_to: returnTo } : {}) }} />
          <button className="btn-danger">Apagar publicação</button>
        </form>
      )}
    </div>
  );
}
