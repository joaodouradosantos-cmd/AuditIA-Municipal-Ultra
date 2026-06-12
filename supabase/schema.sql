create table if not exists public.auditia_memory (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.auditia_memory enable row level security;

-- A tabela não deve ser exposta diretamente ao browser.
-- A aplicação usa a API serverless da Vercel com SUPABASE_SERVICE_ROLE_KEY.
