-- GestiPro — Essai gratuit (7 jours) puis abonnement marqué manuellement par l'éditeur

alter table gestipro.etablissements
  add column if not exists essai_fin timestamptz,
  add column if not exists abonnement_actif boolean not null default false;
