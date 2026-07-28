-- GestiPro — Laveurs (lavage auto) et commissions sur les ventes

create table if not exists gestipro.laveurs (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  nom text not null,
  taux_commission numeric not null default 0,
  actif boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table gestipro.laveurs enable row level security;

drop policy if exists "laveurs_etablissement" on gestipro.laveurs;
create policy "laveurs_etablissement" on gestipro.laveurs for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop trigger if exists trg_laveurs_updated_at on gestipro.laveurs;
create trigger trg_laveurs_updated_at before update on gestipro.laveurs
  for each row execute function gestipro.set_updated_at();

create index if not exists idx_laveurs_etablissement on gestipro.laveurs(etablissement_id);

alter table gestipro.ventes
  add column if not exists laveur_id uuid references gestipro.laveurs(id) on delete set null,
  add column if not exists commission_montant numeric;

grant usage on schema gestipro to anon, authenticated, service_role;
grant all on all tables in schema gestipro to anon, authenticated, service_role;
