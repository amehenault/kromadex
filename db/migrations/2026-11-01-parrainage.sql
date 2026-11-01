alter table users add column if not exists code_parrainage text;
create unique index if not exists users_code_parrainage on users (code_parrainage) where code_parrainage is not null;
alter table users add column if not exists parrain uuid references users(id) on delete set null;
