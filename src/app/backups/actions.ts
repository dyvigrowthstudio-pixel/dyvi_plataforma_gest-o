"use server";

import { revalidatePath } from "next/cache";
import { getMe } from "@/lib/auth";
import { BACKUP_TABLES, CONFLICT_KEYS, type Backup } from "@/lib/backup-tables";

export type RestoreState = { ok: boolean; text: string; details?: string[] } | null;

// Restaura um ficheiro de backup. Não apaga nada: repõe as linhas do ficheiro
// e atualiza as que já existem com os valores do backup.
export async function restoreBackup(_: RestoreState, fd: FormData): Promise<RestoreState> {
  const { supabase, profile } = await getMe();
  if (profile?.role !== "admin") return { ok: false, text: "Só admins podem restaurar." };
  if (fd.get("confirm") !== "RESTAURAR") return { ok: false, text: "Escreve RESTAURAR para confirmar." };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, text: "Escolhe o ficheiro de backup (.json)." };

  let backup: Backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    return { ok: false, text: "O ficheiro não é um backup válido." };
  }
  if (backup?.app !== "dyvi-plataforma" || !backup.tables) return { ok: false, text: "Este ficheiro não é um backup da plataforma." };

  const details: string[] = [];
  let failed = false;

  for (const t of BACKUP_TABLES) {
    const rows = backup.tables[t];
    if (!rows?.length) continue;

    if (t === "profiles") {
      // Os perfis são criados pelas contas; aqui só repomos nome, nome de utilizador e perfil
      let n = 0;
      for (const r of rows) {
        const { error, count } = await supabase
          .from("profiles")
          .update({ full_name: r.full_name ?? null, username: r.username ?? null, role: r.role }, { count: "exact" })
          .eq("id", r.id as string);
        if (!error && count) n++;
      }
      details.push(`perfis: ${n} de ${rows.length} repostos (contas que já não existem são ignoradas)`);
      continue;
    }

    let done = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from(t).upsert(chunk, { onConflict: CONFLICT_KEYS[t] ?? "id" });
      if (error) {
        failed = true;
        details.push(`${t}: erro (${error.message})`);
        break;
      }
      done += chunk.length;
    }
    if (done) details.push(`${t}: ${done} linhas`);
  }

  revalidatePath("/", "layout");
  const when = new Date(backup.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
  return {
    ok: !failed,
    text: failed ? `Restauro parcial do backup de ${when}. Vê os detalhes.` : `Backup de ${when} restaurado.`,
    details,
  };
}
