// Tabelas incluídas no backup, pela ordem em que devem ser restauradas
// (primeiro as que não dependem de outras).
export const BACKUP_TABLES = [
  "admin_emails",
  "organizations",
  "profiles",
  "org_members",
  "org_invites",
  "brand_sections",
  "competitors",
  "monthly_themes",
  "posts",
  "ideas",
  "tasks",
  "internal_tasks",
  "metrics",
] as const;

// Chave usada para não duplicar linhas no restauro
export const CONFLICT_KEYS: Record<string, string> = {
  admin_emails: "email",
  org_members: "org_id,user_id",
  org_invites: "org_id,email",
  metrics: "id",
};

export type Backup = {
  app: "dyvi-plataforma";
  version: 1;
  created_at: string;
  tables: Record<string, Record<string, unknown>[]>;
};
