import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCategorieColor } from '../data/catalogueBoissons';
import { cardShadow, colors, spacing, withOpacity } from '../theme';
import type { Produit } from '../types';

interface ProduitCardProps {
  produit: Produit;
  onPress?: () => void;
}

export function ProduitCard({ produit, onPress }: ProduitCardProps): React.JSX.Element {
  const stockBas = produit.quantiteStock <= produit.seuilAlerte;
  const couleurCategorie = getCategorieColor(produit.categorie);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: withOpacity(couleurCategorie, 0.15) }]}>
        <Ionicons name="beer-outline" size={20} color={couleurCategorie} />
      </View>
      <View style={styles.info}>
        <Text style={styles.nom}>{produit.nom}</Text>
        {produit.categorie ? (
          <View style={[styles.badge, { backgroundColor: withOpacity(couleurCategorie, 0.12) }]}>
            <Text style={[styles.badgeText, { color: couleurCategorie }]}>{produit.categorie}</Text>
          </View>
        ) : (
          <Text style={styles.categorie}>Sans catégorie</Text>
        )}
      </View>
      <View style={styles.stockInfo}>
        <View style={styles.quantiteRow}>
          {stockBas && <Ionicons name="alert-circle" size={14} color={colors.danger} />}
          <Text style={[styles.quantite, stockBas && styles.quantiteBasse]}>
            {produit.quantiteStock} {produit.unite}
          </Text>
        </View>
        <Text style={styles.prix}>{produit.prixVente.toLocaleString('fr-FR')} F</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...cardShadow,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  nom: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categorie: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  quantiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantite: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  quantiteBasse: {
    color: colors.danger,
  },
  prix: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
