-- GestiPro — schema dédié, isolé du reste du projet Supabase (schema "gestipro")
-- Étape A : fondations Auth (etablissements + profils)

create extension if not exists pgcrypto;

create schema if not exists gestipro;

create table if not exists gestipro.etablissements (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  logo_url text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gestipro.profils (
  id uuid primary key references auth.users(id) on delete cascade,
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  nom text not null,
  role text not null default 'gerant' check (role in ('gerant')),
  created_at timestamptz not null default now()
);

alter table gestipro.etablissements enable row level security;
alter table gestipro.profils enable row level security;

drop policy if exists "etablissements_select_owner" on gestipro.etablissements;
create policy "etablissements_select_owner" on gestipro.etablissements
  for select using (owner_id = auth.uid());

drop policy if exists "etablissements_insert_owner" on gestipro.etablissements;
create policy "etablissements_insert_owner" on gestipro.etablissements
  for insert with check (owner_id = auth.uid());

drop policy if exists "etablissements_update_owner" on gestipro.etablissements;
create policy "etablissements_update_owner" on gestipro.etablissements
  for update using (owner_id = auth.uid());

drop policy if exists "profils_select_self" on gestipro.profils;
create policy "profils_select_self" on gestipro.profils
  for select using (id = auth.uid());

drop policy if exists "profils_insert_self" on gestipro.profils;
create policy "profils_insert_self" on gestipro.profils
  for insert with check (id = auth.uid());

create or replace function gestipro.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_etablissements_updated_at on gestipro.etablissements;
create trigger trg_etablissements_updated_at
  before update on gestipro.etablissements
  for each row execute function gestipro.set_updated_at();

-- Permissions de base pour PostgREST (RLS reste le vrai garde-fou ligne par ligne)
grant usage on schema gestipro to anon, authenticated, service_role;
grant all on all tables in schema gestipro to anon, authenticated, service_role;
grant all on all sequences in schema gestipro to anon, authenticated, service_role;
grant all on all routines in schema gestipro to anon, authenticated, service_role;
alter default privileges in schema gestipro grant all on tables to anon, authenticated, service_role;
alter default privileges in schema gestipro grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema gestipro grant all on routines to anon, authenticated, service_role;
