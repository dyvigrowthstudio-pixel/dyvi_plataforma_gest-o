# Dyvi Plataforma de Gestão

Plataforma interna da Dyvi Growth Studio para gerir a estratégia e os conteúdos de cada cliente: hub da marca, temas do mês, calendário, produção, ideias adicionais, tarefas e resultados.

Cada cliente vê apenas a sua organização. A equipa vê apenas os clientes que lhe forem atribuídos. Os admins veem tudo.

## Tecnologia

- Next.js (App Router) alojado na Vercel
- Supabase (login e base de dados com Row Level Security)

## Configuração

1. No Supabase, abrir o SQL Editor e correr `supabase/schema.sql`.
2. Na Vercel, importar este repositório e definir as variáveis de `.env.example`.
3. No Supabase, em Authentication > URL Configuration, definir o Site URL com o endereço da Vercel.
