import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { EmptyState } from '../../components/EmptyState';
import { getMouvementsStock } from '../../db/produits';
import { useSyncSignalStore } from '../../store/syncSignalStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { MouvementStockDetail, TypeMouvement } from '../../types';

const ICONES: Record<TypeMouvement, keyof typeof Ionicons.glyphMap> = {
  entree: 'arrow-up-circle-outline',
  sortie: 'arrow-down-circle-outline',
  ajustement: 'swap-horizontal-outline',
};

const COULEURS: Record<TypeMouvement, string> = {
  entree: colors.success,
  sortie: colors.danger,
  ajustement: colors.accentBleu,
};

const FONDS: Record<TypeMouvement, string> = {
  entree: colors.successBg,
  sortie: colors.dangerBg,
  ajustement: `${colors.accentBleu}1A`,
};

const LABELS: Record<TypeMouvement, string> = {
  entree: 'Entrée',
  sortie: 'Sortie',
  ajustement: 'Ajustement',
};

export function HistoriqueMouvementsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [mouvements, setMouvements] = useState<MouvementStockDetail[]>([]);
  const syncVersion = useSyncSignalStore((s) => s.version);

  const reload = useCallback(() => {
    getMouvementsStock(200).then(setMouvements);
  }, []);

  useFocusEffect(reload);
  useEffect(reload, [syncVersion, reload]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Historique du stock" onBack={() => navigation.goBack()} />
      <FlatList
        data={mouvements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Aucun mouvement de stock enregistré." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.icon, { backgroundColor: FONDS[item.type] }]}>
              <Ionicons name={ICONES[item.type]} size={20} color={COULEURS[item.type]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.nomProduit}>{item.nomProduit}</Text>
              <Text style={styles.meta}>
                {format(new Date(item.date), 'dd MMM yyyy, HH:mm', { locale: fr })} · {item.nomUser}
              </Text>
              {item.motif ? <Text style={styles.motif}>{item.motif}</Text> : null}
            </View>
            <View style={styles.right}>
              <Text style={[styles.quantite, { color: COULEURS[item.type] }]}>
                {item.type === 'sortie' ? '-' : '+'}
                {item.quantite}
              </Text>
              <Text style={styles.typeLabel}>{LABELS[item.type]}</Text>
            </View>
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  nomProduit: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  motif: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  quantite: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
