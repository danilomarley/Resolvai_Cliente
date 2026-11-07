-- Apenas o container efêmero resolvai-sprint4-e2e, sem conexão externa.
create role supabase_auth_admin login password 'local-e2e-only';
create schema auth authorization supabase_auth_admin;
grant all on database resolvai_e2e to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth, public;
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create schema storage;
-- Suporte à migration de bucket da API; os cinco fluxos não usam upload.
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table public.e2e_guard (marker text primary key);
insert into public.e2e_guard values ('resolvai-sprint4-ephemeral-only');
