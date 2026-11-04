export const MODULES = [
  { key: "marca", label: "Hub da marca" },
  { key: "temas", label: "Temas do mês" },
  { key: "calendario", label: "Calendário" },
  { key: "producao", label: "Produção" },
  { key: "ideias", label: "Ideias adicionais" },
  { key: "tarefas", label: "Tarefas" },
  { key: "resultados", label: "Resultados" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const POST_STATUS = [
  { key: "ideia", label: "Ideia" },
  { key: "guiao", label: "Guião" },
  { key: "gravacao", label: "Gravação" },
  { key: "edicao", label: "Edição" },
  { key: "aprovacao", label: "Aprovação" },
  { key: "agendado", label: "Agendado" },
  { key: "publicado", label: "Publicado" },
] as const;

export const NETWORKS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "google", label: "Google" },
] as const;

export const FORMATS = [
  { key: "reel", label: "Reel" },
  { key: "carrossel", label: "Carrossel" },
  { key: "post", label: "Post" },
  { key: "stories", label: "Stories" },
  { key: "video", label: "Vídeo longo" },
  { key: "artigo", label: "Artigo" },
] as const;

export const IDEA_STATUS = [
  { key: "pendente", label: "Por fazer" },
  { key: "em_curso", label: "Em curso" },
  { key: "feito", label: "Já foi feito" },
  { key: "nao_feito", label: "Não foi feito" },
] as const;

export const TASK_STATUS = [
  { key: "pendente", label: "Por fazer" },
  { key: "em_curso", label: "Em curso" },
  { key: "feito", label: "Feito" },
] as const;

// Secções criadas automaticamente em cada cliente novo
export const DEFAULT_BRAND_SECTIONS = [
  { title: "Resumo da marca", kind: "text" },
  { title: "Missão", kind: "text" },
  { title: "Visão", kind: "text" },
  { title: "Valores", kind: "list" },
  { title: "Público alvo e personas", kind: "text" },
  { title: "Proposta de valor", kind: "text" },
  { title: "Análise SWOT", kind: "swot" },
  { title: "Tom de voz", kind: "text" },
  { title: "Identidade visual", kind: "text" },
  { title: "Pilares de conteúdo", kind: "list" },
  { title: "Objetivos", kind: "list" },
] as const;

export function labelOf(list: readonly { key: string; label: string }[], key: string | null) {
  return list.find((i) => i.key === key)?.label ?? key ?? "";
}

export const STATUS_COLORS: Record<string, string> = {
  ideia: "bg-slate-100 text-slate-700",
  guiao: "bg-violet-100 text-violet-700",
  gravacao: "bg-amber-100 text-amber-800",
  edicao: "bg-orange-100 text-orange-800",
  aprovacao: "bg-pink-100 text-pink-700",
  agendado: "bg-cyan-100 text-cyan-800",
  publicado: "bg-emerald-100 text-emerald-700",
  pendente: "bg-slate-100 text-slate-700",
  em_curso: "bg-amber-100 text-amber-800",
  feito: "bg-emerald-100 text-emerald-700",
  nao_feito: "bg-rose-100 text-rose-700",
};

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
