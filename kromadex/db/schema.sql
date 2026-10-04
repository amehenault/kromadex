create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default '',
  tome text not null default '',
  page_no text not null default '',
  category text not null default '',
  difficulty int not null default 0 check (difficulty between 0 and 5),
  rating int not null default 0 check (rating between 0 and 5),
  codes jsonb not null default '[]',
  image_b64 text,
  image_type text,
  created_at timestamptz not null default now()
);
create index if not exists pages_user_idx on pages (user_id, created_at desc)
