import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { ProduitCard } from '../../components/ProduitCard';
import { getSecteurConfig } from '../../data/secteurs';
import { getProduits } from '../../db/produits';
import type { StockStackParamList } from '../../navigation/StockStack';
import { useAuthStore } from '../../store/authStore';
import { useEtablissementStore } from '../../store/etablissementStore';
import { colors, spacing } from '../../theme';
import type { Produit } from '../../types';

type Nav = NativeStackNavigationProp<StockStackParamList, 'StockList'>;

export function StockListScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const isGerant = useAuthStore((s) => s.currentUser?.role === 'gerant');
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [recherche, setRecherche] = useState('');

  const reload = useCallback(() => {
    getProduits().then(setProduits);
  }, []);

  useFocusEffect(reload);

  const produitsFiltres = produits.filter((p) =>
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.rechercheWrapper}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.recherche}
            placeholder={`Rechercher un ${config.libelleArticle}...`}
            placeholderTextColor={colors.textMuted}
            value={recherche}
            onChangeText={setRecherche}
          />
        </View>
        {config.stockActif && (
          <TouchableOpacity
            style={styles.historiqueButton}
            onPress={() => navigation.navigate('HistoriqueMouvements')}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {isGerant && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ProduitForm', {})}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>
              {config.libelleArticle.charAt(0).toUpperCase() + config.libelleArticle.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={produitsFiltres}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            message={`Aucun ${config.libelleArticle}. Ajoutez votre premier ${config.libelleArticle}.`}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.cardWrapper}>
              <ProduitCard
                produit={item}
                onPress={isGerant ? () => navigation.navigate('ProduitForm', { produitId: item.id }) : undefined}
              />
            </View>
            {config.stockActif && (
              <TouchableOpacity
                style={styles.stockButton}
                onPress={() =>
                  navigation.navigate('MouvementStock', { produitId: item.id, nomProduit: item.nom })
                }
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.stockButtonText}>Stock</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  rechercheWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
  },
  recherche: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  historiqueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardWrapper: {
    flex: 1,
  },
  stockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  stockButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});
