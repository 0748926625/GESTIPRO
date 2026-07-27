-- GestiPro — Répertoire fournisseurs (rappel stock bas)

create table if not exists gestipro.fournisseurs (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  nom text not null,
  telephone text not null default '',
  actif boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table gestipro.fournisseurs enable row level security;

drop policy if exists "fournisseurs_etablissement" on gestipro.fournisseurs;
create policy "fournisseurs_etablissement" on gestipro.fournisseurs for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop trigger if exists trg_fournisseurs_updated_at on gestipro.fournisseurs;
create trigger trg_fournisseurs_updated_at before update on gestipro.fournisseurs
  for each row execute function gestipro.set_updated_at();

create index if not exists idx_fournisseurs_etablissement on gestipro.fournisseurs(etablissement_id);

grant usage on schema gestipro to anon, authenticated, service_role;
grant all on all tables in schema gestipro to anon, authenticated, service_role;
