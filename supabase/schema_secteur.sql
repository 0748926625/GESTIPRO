-- GestiPro — Secteur d'activité de l'établissement (maquis, restaurant, lavage_auto, commerce)

alter table gestipro.etablissements
  add column if not exists secteur text not null default 'maquis'
  check (secteur in ('maquis', 'restaurant', 'lavage_auto', 'commerce'));
