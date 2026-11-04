-- =============================================================
-- Dyvi Plataforma de Gestão: esquema da base de dados
-- Correr uma vez no Supabase: SQL Editor > New query > colar > Run
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Perfis ----------
-- role: admin (Dyvi, vê tudo), team (colaborador, vê só clientes atribuídos), client (cliente)
create table if not exists public.admin_emails (
  email text primary key
);

insert into public.admin_emails (email) values
  ('002ruialmeida@gmail.com'),
  ('davidmosilva0812@gmail.com')
on conflict do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'client' check (role in ('admin','team','client')),
  created_at timestamptz not null default now()
);

-- ---------- Organizações (clientes) ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text default '#31C2E1',
  modules text[] not null default array['marca','temas','calendario','producao','ideias','tarefas','resultados'],
  created_at timestamptz not null default now()
);

-- Quem tem acesso a cada organização
create table if not exists public.org_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_type text not null check (member_type in ('team','client')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Acessos atribuídos antes de a pessoa ter conta (ligados no primeiro login)
create table if not exists public.org_invites (
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  member_type text not null check (member_type in ('team','client')),
  created_at timestamptz not null default now(),
  primary key (org_id, email)
);

-- ---------- Hub da marca ----------
-- kind: text (texto livre), swot (forcas/fraquezas/oportunidades/ameacas), list (itens)
create table if not exists public.brand_sections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  kind text not null default 'text' check (kind in ('text','swot','list')),
  body text default '',
  data jsonb not null default '{}'::jsonb,
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  url text,
  strengths text,
  weaknesses text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- Planeamento ----------
create table if not exists public.monthly_themes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  month date not null, -- primeiro dia do mês
  title text not null,
  pillar text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  theme_id uuid references public.monthly_themes(id) on delete set null,
  title text not null,
  network text not null default 'instagram',
  format text not null default 'reel',
  scheduled_at timestamptz,
  status text not null default 'ideia' check (status in
    ('ideia','guiao','gravacao','edicao','aprovacao','agendado','publicado')),
  caption text,
  notes text,
  assignee text,
  created_at timestamptz not null default now()
);

-- ---------- Ideias adicionais (equipa e cliente) ----------
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pendente' check (status in ('pendente','em_curso','feito','nao_feito')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Tarefas (Dyvi / cliente) ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  owner_side text not null check (owner_side in ('dyvi','cliente')),
  status text not null default 'pendente' check (status in ('pendente','em_curso','feito')),
  due_date date,
  created_at timestamptz not null default now()
);

-- ---------- Resultados ----------
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  month date not null,
  network text not null default 'instagram',
  followers int,
  reach int,
  impressions int,
  engagement_rate numeric(6,2),
  retention_rate numeric(6,2),
  views int,
  notes text,
  created_at timestamptz not null default now(),
  unique (org_id, month, network)
);

-- =============================================================
-- Funções de permissões
-- =============================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.can_view(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from org_members where org_id = org and user_id = auth.uid()
  );
$$;

create or replace function public.is_staff(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from org_members where org_id = org and user_id = auth.uid() and member_type = 'team'
  );
$$;

-- Novo utilizador: cria perfil, define admin e liga acessos pendentes
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_adm boolean;
  has_team boolean;
begin
  select exists (select 1 from admin_emails where lower(email) = lower(new.email)) into is_adm;
  select exists (select 1 from org_invites where lower(email) = lower(new.email) and member_type = 'team') into has_team;

  insert into profiles (id, email, role)
  values (new.id, new.email,
    case when is_adm then 'admin' when has_team then 'team' else 'client' end)
  on conflict (id) do nothing;

  insert into org_members (org_id, user_id, member_type)
  select org_id, new.id, member_type from org_invites where lower(email) = lower(new.email)
  on conflict do nothing;

  delete from org_invites where lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.admin_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.org_invites enable row level security;
alter table public.brand_sections enable row level security;
alter table public.competitors enable row level security;
alter table public.monthly_themes enable row level security;
alter table public.posts enable row level security;
alter table public.ideas enable row level security;
alter table public.tasks enable row level security;
alter table public.metrics enable row level security;

-- admin_emails: só admins
create policy "admin_emails admin" on public.admin_emails for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: cada um vê o seu; admins e equipa veem todos (para atribuir); admins editam
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create policy "profiles select" on public.profiles for select
  using (id = auth.uid() or public.my_role() in ('admin','team'));
create policy "profiles update self" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = public.my_role());
create policy "profiles admin" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- organizations
create policy "orgs select" on public.organizations for select using (public.can_view(id));
create policy "orgs insert" on public.organizations for insert with check (public.is_admin());
create policy "orgs update" on public.organizations for update using (public.is_staff(id)) with check (public.is_staff(id));
create policy "orgs delete" on public.organizations for delete using (public.is_admin());

-- org_members / org_invites: ver se tem acesso; gerir só admins
create policy "members select" on public.org_members for select using (public.can_view(org_id));
create policy "members admin" on public.org_members for all using (public.is_admin()) with check (public.is_admin());
create policy "invites admin" on public.org_invites for all using (public.is_admin()) with check (public.is_admin());

-- Tabelas de conteúdo: leitura para quem tem acesso, escrita para equipa
do $$
declare t text;
begin
  foreach t in array array['brand_sections','competitors','monthly_themes','posts','metrics'] loop
    execute format('create policy "%1$s select" on public.%1$I for select using (public.can_view(org_id))', t);
    execute format('create policy "%1$s write" on public.%1$I for all using (public.is_staff(org_id)) with check (public.is_staff(org_id))', t);
  end loop;
end $$;

-- Ideias: todos com acesso podem criar e atualizar; apagar só equipa ou o autor
create policy "ideas select" on public.ideas for select using (public.can_view(org_id));
create policy "ideas insert" on public.ideas for insert with check (public.can_view(org_id));
create policy "ideas update" on public.ideas for update using (public.can_view(org_id)) with check (public.can_view(org_id));
create policy "ideas delete" on public.ideas for delete using (public.is_staff(org_id) or created_by = auth.uid());

-- Tarefas: equipa gere tudo; cliente atualiza o estado das tarefas do lado do cliente
create policy "tasks select" on public.tasks for select using (public.can_view(org_id));
create policy "tasks staff" on public.tasks for all using (public.is_staff(org_id)) with check (public.is_staff(org_id));
create policy "tasks client update" on public.tasks for update
  using (public.can_view(org_id) and owner_side = 'cliente')
  with check (public.can_view(org_id) and owner_side = 'cliente');

-- Índices
create index if not exists posts_org_date on public.posts (org_id, scheduled_at);
create index if not exists themes_org_month on public.monthly_themes (org_id, month);
create index if not exists ideas_org on public.ideas (org_id);
create index if not exists tasks_org on public.tasks (org_id);
create index if not exists metrics_org on public.metrics (org_id, month);
