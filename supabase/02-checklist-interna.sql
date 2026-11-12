-- =============================================================
-- Checklist interna da Dyvi (só visível para a equipa, nunca para o cliente)
-- Correr uma vez no Supabase: SQL Editor > New query (vazia) > colar > Run
-- =============================================================

create table if not exists public.internal_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  status text not null default 'pendente' check (status in ('pendente','em_curso','feito')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.internal_tasks enable row level security;

-- Só admins e equipa com acesso ao cliente veem e editam. Clientes nunca.
drop policy if exists "internal_tasks staff" on public.internal_tasks;
create policy "internal_tasks staff" on public.internal_tasks for all
  using (public.is_staff(org_id)) with check (public.is_staff(org_id));

grant select, insert, update, delete on public.internal_tasks to authenticated;

create index if not exists internal_tasks_org on public.internal_tasks (org_id, status, due_date);
create index if not exists internal_tasks_assignee on public.internal_tasks (assignee_id, status);
