-- GestiPro — Étape B : tables métier synchronisées (produits, ventes, opérations)
-- Toutes scopées par etablissement_id, RLS = appartenance à l'établissement du gérant connecté.

create table if not exists gestipro.users (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  nom text not null,
  pin_hash text not null,
  role text not null check (role in ('gerant','serveur')),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gestipro.produits (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  nom text not null,
  categorie text not null default '',
  unite text not null default '',
  quantite_stock numeric not null default 0,
  seuil_alerte numeric not null default 0,
  prix_achat numeric not null default 0,
  prix_vente numeric not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gestipro.mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  produit_id uuid not null references gestipro.produits(id) on delete cascade,
  type text not null check (type in ('entree','sortie','ajustement')),
  quantite numeric not null,
  motif text not null default '',
  user_id uuid not null references gestipro.users(id),
  date timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists gestipro.ventes (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  user_id uuid not null references gestipro.users(id),
  date timestamptz not null,
  total numeric not null,
  mode_paiement text not null default 'especes',
  updated_at timestamptz not null default now()
);

create table if not exists gestipro.vente_lignes (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  vente_id uuid not null references gestipro.ventes(id) on delete cascade,
  produit_id uuid not null references gestipro.produits(id),
  quantite numeric not null,
  prix_unitaire_vente numeric not null,
  updated_at timestamptz not null default now()
);

create table if not exists gestipro.operations_caisse (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  type text not null check (type in ('recette','depense')),
  categorie text not null,
  montant numeric not null,
  description text not null default '',
  user_id uuid not null references gestipro.users(id),
  date timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table gestipro.users enable row level security;
alter table gestipro.produits enable row level security;
alter table gestipro.mouvements_stock enable row level security;
alter table gestipro.ventes enable row level security;
alter table gestipro.vente_lignes enable row level security;
alter table gestipro.operations_caisse enable row level security;

-- Une seule policy par table : accès total (select/insert/update/delete) si la ligne
-- appartient à l'établissement du gérant connecté (auth.uid()).
drop policy if exists "users_etablissement" on gestipro.users;
create policy "users_etablissement" on gestipro.users for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop policy if exists "produits_etablissement" on gestipro.produits;
create policy "produits_etablissement" on gestipro.produits for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop policy if exists "mouvements_stock_etablissement" on gestipro.mouvements_stock;
create policy "mouvements_stock_etablissement" on gestipro.mouvements_stock for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop policy if exists "ventes_etablissement" on gestipro.ventes;
create policy "ventes_etablissement" on gestipro.ventes for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop policy if exists "vente_lignes_etablissement" on gestipro.vente_lignes;
create policy "vente_lignes_etablissement" on gestipro.vente_lignes for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop policy if exists "operations_caisse_etablissement" on gestipro.operations_caisse;
create policy "operations_caisse_etablissement" on gestipro.operations_caisse for all
  using (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()))
  with check (etablissement_id = (select etablissement_id from gestipro.profils where id = auth.uid()));

drop trigger if exists trg_users_updated_at on gestipro.users;
create trigger trg_users_updated_at before update on gestipro.users
  for each row execute function gestipro.set_updated_at();

drop trigger if exists trg_produits_updated_at on gestipro.produits;
create trigger trg_produits_updated_at before update on gestipro.produits
  for each row execute function gestipro.set_updated_at();

drop trigger if exists trg_mouvements_stock_updated_at on gestipro.mouvements_stock;
create trigger trg_mouvements_stock_updated_at before update on gestipro.mouvements_stock
  for each row execute function gestipro.set_updated_at();

drop trigger if exists trg_ventes_updated_at on gestipro.ventes;
create trigger trg_ventes_updated_at before update on gestipro.ventes
  for each row execute function gestipro.set_updated_at();

drop trigger if exists trg_vente_lignes_updated_at on gestipro.vente_lignes;
create trigger trg_vente_lignes_updated_at before update on gestipro.vente_lignes
  for each row execute function gestipro.set_updated_at();

drop trigger if exists trg_operations_caisse_updated_at on gestipro.operations_caisse;
create trigger trg_operations_caisse_updated_at before update on gestipro.operations_caisse
  for each row execute function gestipro.set_updated_at();

create index if not exists idx_produits_etablissement on gestipro.produits(etablissement_id);
create index if not exists idx_ventes_etablissement on gestipro.ventes(etablissement_id);
create index if not exists idx_vente_lignes_vente on gestipro.vente_lignes(vente_id);
create index if not exists idx_mouvements_produit on gestipro.mouvements_stock(produit_id);
create index if not exists idx_operations_etablissement on gestipro.operations_caisse(etablissement_id);
create index if not exists idx_users_etablissement on gestipro.users(etablissement_id);

grant usage on schema gestipro to anon, authenticated, service_role;
grant all on all tables in schema gestipro to anon, authenticated, service_role;
grant all on all sequences in schema gestipro to anon, authenticated, service_role;
grant all on all routines in schema gestipro to anon, authenticated, service_role;
