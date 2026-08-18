-- GestiPro — Active la réplication temps réel (Supabase Realtime) sur les tables métier
-- du schéma gestipro. Par défaut, la publication "supabase_realtime" ne couvre que le
-- schéma public : sans ceci, les appareils n'apprennent un changement distant qu'au
-- prochain cycle de synchro par sondage (jusqu'à 4 minutes).
--
-- Idempotent : peut être ré-exécuté sans erreur même si une table est déjà dans la
-- publication (contrairement à un simple "alter publication ... add table").

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'produits', 'laveurs', 'mouvements_stock', 'ventes', 'vente_lignes',
    'operations_caisse', 'notifications', 'clotures', 'fournisseurs'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table gestipro.%I', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;
