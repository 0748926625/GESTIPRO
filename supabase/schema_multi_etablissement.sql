-- GestiPro — Support multi-établissements : un gérant peut appartenir à plusieurs
-- établissements. Remplace le modèle "un seul profil = un seul établissement" par
-- une vraie table d'adhésion (memberships), sans supprimer gestipro.profils
-- (conservée pour compatibilité, plus utilisée par les policies).

create table if not exists gestipro.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  nom text not null,
  role text not null default 'gerant' check (role in ('gerant')),
  created_at timestamptz not null default now(),
  unique (user_id, etablissement_id)
);

alter table gestipro.memberships enable row level security;

drop policy if exists "memberships_select_self" on gestipro.memberships;
create policy "memberships_select_self" on gestipro.memberships
  for select using (user_id = auth.uid());

drop policy if exists "memberships_insert_self" on gestipro.memberships;
create policy "memberships_insert_self" on gestipro.memberships
  for insert with check (user_id = auth.uid());

-- Reprend automatiquement les comptes existants (un seul établissement chacun)
-- dans la nouvelle table d'adhésion, sans perte de données.
insert into gestipro.memberships (user_id, etablissement_id, nom, role)
select id, etablissement_id, nom, role from gestipro.profils
on conflict (user_id, etablissement_id) do nothing;

create index if not exists idx_memberships_user on gestipro.memberships(user_id);
create index if not exists idx_memberships_etablissement on gestipro.memberships(etablissement_id);

-- Un gérant peut désormais lire/modifier tous les établissements dont il est membre
-- (pas uniquement celui qu'il a créé), utile pour l'import de produits entre
-- établissements et le changement d'établissement actif.
drop policy if exists "etablissements_select_owner" on gestipro.etablissements;
create policy "etablissements_select_member" on gestipro.etablissements
  for select using (
    owner_id = auth.uid()
    or id in (select etablissement_id from gestipro.memberships where user_id = auth.uid())
  );

-- Remplace toutes les policies "= (select ... profils ...)" par des policies
-- "in (select ... memberships ...)" : un gérant multi-établissements passe cette
-- vérification pour chacun des établissements dont il est membre.

drop policy if exists "users_etablissement" on gestipro.users;
create policy "users_etablissement" on gestipro.users for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "produits_etablissement" on gestipro.produits;
create policy "produits_etablissement" on gestipro.produits for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "mouvements_stock_etablissement" on gestipro.mouvements_stock;
create policy "mouvements_stock_etablissement" on gestipro.mouvements_stock for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "ventes_etablissement" on gestipro.ventes;
create policy "ventes_etablissement" on gestipro.ventes for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "vente_lignes_etablissement" on gestipro.vente_lignes;
create policy "vente_lignes_etablissement" on gestipro.vente_lignes for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "operations_caisse_etablissement" on gestipro.operations_caisse;
create policy "operations_caisse_etablissement" on gestipro.operations_caisse for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "clotures_etablissement" on gestipro.clotures;
create policy "clotures_etablissement" on gestipro.clotures for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "fournisseurs_etablissement" on gestipro.fournisseurs;
create policy "fournisseurs_etablissement" on gestipro.fournisseurs for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop policy if exists "laveurs_etablissement" on gestipro.laveurs;
create policy "laveurs_etablissement" on gestipro.laveurs for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

grant usage on schema gestipro to anon, authenticated, service_role;
grant all on all tables in schema gestipro to anon, authenticated, service_role;
