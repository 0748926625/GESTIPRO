-- GestiPro — Clôtures mensuelles (archivage figé, sans suppression des données sources)

create table if not exists gestipro.clotures (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  periode_debut timestamptz not null,
  periode_fin timestamptz not null,
  chiffre_affaires numeric not null default 0,
  nombre_ventes integer not null default 0,
  marge numeric not null default 0,
  recettes_diverses numeric not null default 0,
  depenses numeric not null default 0,
  resultat_net numeric not null default 0,
  top_produits jsonb not null default '[]'::jsonb,
  repartition_paiement jsonb not null default '[]'::jsonb,
  user_id uuid not null references gestipro.users(id),
  updated_at timestamptz not null default now()
);

alter table gestipro.clotures enable row level security;

drop policy if exists "clotures_etablissement" on gestipro.clotures;
create policy "clotures_etablissement" on gestipro.clotures for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop trigger if exists trg_clotures_updated_at on gestipro.clotures;
create trigger trg_clotures_updated_at before update on gestipro.clotures
  for each row execute function gestipro.set_updated_at();

create index if not exists idx_clotures_etablissement on gestipro.clotures(etablissement_id);

grant usage on schema gestipro to anon, authenticated, service_role;
grant all on all tables in schema gestipro to anon, authenticated, service_role;
