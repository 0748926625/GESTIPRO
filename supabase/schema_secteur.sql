-- GestiPro — Secteur d'activité de l'établissement (maquis, restaurant, lavage_auto, commerce, livraison)

alter table gestipro.etablissements
  add column if not exists secteur text not null default 'maquis';

alter table gestipro.etablissements
  drop constraint if exists etablissements_secteur_check;

alter table gestipro.etablissements
  add constraint etablissements_secteur_check
  check (secteur in ('maquis', 'restaurant', 'lavage_auto', 'commerce', 'livraison'));
