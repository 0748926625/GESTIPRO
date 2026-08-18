-- GestiPro — Notifications internes (ex: caissier qui recharge un stock ou enregistre
-- une opération de caisse) : le gérant les consulte dans l'app, synchronisées comme le
-- reste (pas de push OS, juste une table de plus dans le cycle de synchro existant).

create table if not exists gestipro.notifications (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references gestipro.etablissements(id) on delete cascade,
  type text not null check (type in ('stock','depense','recette')),
  titre text not null,
  message text not null,
  user_id uuid not null references gestipro.users(id),
  lue boolean not null default false,
  date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table gestipro.notifications enable row level security;

drop policy if exists "notifications_etablissement" on gestipro.notifications;
create policy "notifications_etablissement" on gestipro.notifications for all
  using (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()))
  with check (etablissement_id in (select etablissement_id from gestipro.memberships where user_id = auth.uid()));

drop trigger if exists trg_notifications_updated_at on gestipro.notifications;
create trigger trg_notifications_updated_at before update on gestipro.notifications
  for each row execute function gestipro.set_updated_at();

create index if not exists idx_notifications_etablissement on gestipro.notifications(etablissement_id);
create index if not exists idx_notifications_date on gestipro.notifications(date);

grant all on gestipro.notifications to anon, authenticated, service_role;
