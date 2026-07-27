import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { startOfDay } from 'date-fns';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { getSecteurConfig } from '../../data/secteurs';
import { getProduitsStockBas } from '../../db/produits';
import { getChiffreAffaires, getNombreVentes } from '../../db/rapports';
import { useAuthStore } from '../../store/authStore';
import { useEtablissementStore } from '../../store/etablissementStore';
import { colors, spacing } from '../../theme';
import type { Produit } from '../../types';

export function DashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<BottomTabNavigationProp<Record<string, undefined>>>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const nomMaquis = useEtablissementStore((s) => s.nom);
  const logoUri = useEtablissementStore((s) => s.logoUri);
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);
  const [chiffreAffaires, setChiffreAffaires] = useState(0);
  const [nombreVentes, setNombreVentes] = useState(0);
  const [produitsAlerte, setProduitsAlerte] = useState<Produit[]>([]);

  useFocusEffect(
    useCallback(() => {
      const debutJour = startOfDay(new Date()).toISOString();
      getChiffreAffaires(debutJour).then(setChiffreAffaires);
      getNombreVentes(debutJour).then(setNombreVentes);
      if (config.stockActif) {
        getProduitsStockBas().then(setProduitsAlerte);
      }
    }, [config.stockActif])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="storefront-outline" size={18} color={colors.primary} />
              </View>
            )}
            <View>
              <Text style={styles.bonjour}>Bonjour, {currentUser?.nom}</Text>
              <Text style={styles.sousTitre}>{nomMaquis}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.deconnexionBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={16} color={colors.primary} />
            <Text style={styles.deconnexion}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Ventes du jour"
            value={String(nombreVentes)}
            icon="receipt-outline"
            iconColor={colors.accentBleu}
          />
          <StatCard
            label="Chiffre d'affaires"
            value={`${chiffreAffaires.toLocaleString('fr-FR')} F`}
            icon="cash-outline"
            iconColor={colors.accentVert}
          />
        </View>

        {config.stockActif && (
          <>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => navigation.navigate('Stock')}>
              <Ionicons name="warning-outline" size={16} color={colors.text} />
              <Text style={styles.sectionTitle}>Alertes stock bas ({produitsAlerte.length})</Text>
            </TouchableOpacity>
            {produitsAlerte.length === 0 ? (
              <EmptyState message="Aucune alerte, le stock est correct." />
            ) : (
              produitsAlerte.map((p) => (
                <View key={p.id} style={styles.alerteCard}>
                  <Text style={styles.alerteNom}>{p.nom}</Text>
                  <Text style={styles.alerteQuantite}>
                    {p.quantiteStock} {p.unite} restant(s)
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonjour: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  sousTitre: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  deconnexionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deconnexion: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  alerteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  alerteNom: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  alerteQuantite: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
});
