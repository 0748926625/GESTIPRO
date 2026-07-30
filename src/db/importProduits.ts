import { supabase } from '../lib/supabase';
import { createProduit } from './produits';

interface ProduitDistant {
  nom: string;
  categorie: string;
  unite: string;
  seuil_alerte: number;
  prix_achat: number;
  prix_vente: number;
}

// Importe le catalogue produits (nom, catégorie, unité, prix, seuil) d'un autre
// établissement dont le gérant est membre. Va chercher directement sur Supabase
// (le local ne contient jamais que les données de l'établissement actif) et
// recrée chaque produit dans l'établissement cible avec un stock remis à zéro.
export async function importerProduitsDepuis(
  etablissementSourceId: string,
  etablissementCibleId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('produits')
    .select('nom, categorie, unite, seuil_alerte, prix_achat, prix_vente')
    .eq('etablissement_id', etablissementSourceId)
    .eq('actif', true);
  if (error) throw error;

  const produits = (data ?? []) as ProduitDistant[];
  for (const p of produits) {
    await createProduit(etablissementCibleId, {
      nom: p.nom,
      categorie: p.categorie,
      unite: p.unite,
      seuilAlerte: p.seuil_alerte,
      prixAchat: p.prix_achat,
      prixVente: p.prix_vente,
    });
  }
  return produits.length;
}
