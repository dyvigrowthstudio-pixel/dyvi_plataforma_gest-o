import { BACKUP_TABLES, type Backup } from "./backup-tables";
import type { SupabaseClient } from "@supabase/supabase-js";

// Exporta todas as tabelas que a sessão consegue ler (um admin lê tudo)
export async function exportAll(supabase: SupabaseClient): Promise<Backup> {
  const tables: Backup["tables"] = {};
  for (const t of BACKUP_TABLES) {
    const rows: Record<string, unknown>[] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await supabase.from(t).select("*").range(from, from + page - 1);
      if (error) break; // tabela ainda não criada: ignora
      rows.push(...(data ?? []));
      if (!data || data.length < page) break;
    }
    tables[t] = rows;
  }
  return { app: "dyvi-plataforma", version: 1, created_at: new Date().toISOString(), tables };
}
