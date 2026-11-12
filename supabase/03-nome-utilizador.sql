-- =============================================================
-- Login com nome de utilizador
-- Correr uma vez no Supabase: SQL Editor > New query (vazia) > colar > Run
-- =============================================================

alter table public.profiles add column if not exists username text;

-- Só letras minúsculas, números, ponto, hífen e underscore (3 a 30 caracteres)
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9._-]{3,30}$');

create unique index if not exists profiles_username_unique on public.profiles (lower(username));

-- Novo utilizador: guarda também o nome de utilizador escolhido no primeiro acesso
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_adm boolean;
  has_team boolean;
  uname text;
begin
  select exists (select 1 from admin_emails where lower(email) = lower(new.email)) into is_adm;
  select exists (select 1 from org_invites where lower(email) = lower(new.email) and member_type = 'team') into has_team;
  uname := nullif(lower(trim(new.raw_user_meta_data->>'username')), '');
  if uname is not null and exists (select 1 from profiles where lower(username) = uname) then
    uname := null;
  end if;

  insert into profiles (id, email, role, username)
  values (new.id, new.email,
    case when is_adm then 'admin' when has_team then 'team' else 'client' end,
    uname)
  on conflict (id) do nothing;

  insert into org_members (org_id, user_id, member_type)
  select org_id, new.id, member_type from org_invites where lower(email) = lower(new.email)
  on conflict do nothing;

  delete from org_invites where lower(email) = lower(new.email);
  return new;
end;
$$;

-- O servidor da plataforma (chave secreta) precisa de ler os perfis para o login por nome
grant select on public.profiles to service_role;

-- Nomes de utilizador iniciais para a equipa (podes mudar depois em A minha conta)
update public.profiles set username = 'rui' where lower(email) = '002ruialmeida@gmail.com' and username is null;
update public.profiles set username = 'david' where lower(email) = 'davidmosilva0812@gmail.com' and username is null;

select email, username, role from public.profiles;
