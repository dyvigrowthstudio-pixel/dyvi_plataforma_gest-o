-- Dá à plataforma permissão para ler e escrever nas tabelas.
-- A segurança continua garantida pelas regras de acesso (RLS) de cada tabela.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;

-- Garante que a tua conta tem perfil de admin
insert into public.profiles (id, email, role)
select u.id, u.email,
  case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(u.email))
       then 'admin' else 'client' end
from auth.users u
on conflict (id) do update
  set role = case when excluded.role = 'admin' then 'admin' else public.profiles.role end;

select email, role from public.profiles;
