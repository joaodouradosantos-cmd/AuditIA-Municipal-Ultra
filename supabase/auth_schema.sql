create extension if not exists pgcrypto;

create table if not exists public.auditia_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.auditia_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.auditia_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auditia_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_auditia_users_email on public.auditia_users(email);
create index if not exists idx_auditia_invites_email on public.auditia_invites(email);
create index if not exists idx_auditia_sessions_user_id on public.auditia_sessions(user_id);
create index if not exists idx_auditia_sessions_expires_at on public.auditia_sessions(expires_at);

alter table public.auditia_users enable row level security;
alter table public.auditia_invites enable row level security;
alter table public.auditia_sessions enable row level security;
