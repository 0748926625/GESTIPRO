import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { EmptyState } from '../../components/EmptyState';
import { getClotures } from '../../db/clotures';
import { useEtablissementStore } from '../../store/etablissementStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { Cloture } from '../../types';
import { genererRapportPdf, partagerPdf, telechargerPdf } from '../../utils/pdf';

export function ArchivesScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [clotures, setClotures] = useState<Cloture[]>([]);
  const [exportEnCours, setExportEnCours] = useState<string | null>(null);
  const nom = useEtablissementStore((s) => s.nom);
  const logoUri = useEtablissementStore((s) => s.logoUri);

  useFocusEffect(
    useCallback(() => {
      getClotures().then(setClotures);
    }, [])
  );

  const libellePeriode = (cloture: Cloture): string =>
    `${format(new Date(cloture.periodeDebut), 'dd/MM/yyyy', { locale: fr })} au ${format(
      new Date(cloture.periodeFin),
      'dd/MM/yyyy',
      { locale: fr }
    )}`;

  const genererFichier = (cloture: Cloture) =>
    genererRapportPdf({
      periodeLabel: libellePeriode(cloture),
      nombreVentes: cloture.nombreVentes,
      chiffreAffaires: cloture.chiffreAffaires,
      marge: cloture.marge,
      recettesDiverses: cloture.recettesDiverses,
      depenses: cloture.depenses,
      resultatNet: cloture.resultatNet,
      topProduits: cloture.topProduits,
      repartitionPaiement: cloture.repartitionPaiement,
      etablissement: { nom, logoUri },
    });

  const handleTelecharger = async (cloture: Cloture): Promise<void> => {
    setExportEnCours(cloture.id);
    try {
      const fichier = await genererFichier(cloture);
      const resultat = await telechargerPdf(fichier);
      if (resultat === 'telecharge') {
        Alert.alert('Téléchargé', "L'archive a été enregistrée sur votre appareil.");
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec du téléchargement.');
    } finally {
      setExportEnCours(null);
    }
  };

  const handlePartager = async (cloture: Cloture): Promise<void> => {
    setExportEnCours(cloture.id);
    try {
      const fichier = await genererFichier(cloture);
      await partagerPdf(fichier);
    } finally {
      setExportEnCours(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Archives" onBack={() => navigation.goBack()} />
      <FlatList
        data={clotures}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="Aucune clôture pour l'instant. Les périodes clôturées apparaîtront ici." />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="archive-outline" size={16} color={colors.primary} />
              <Text style={styles.periode}>{libellePeriode(item)}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Ventes</Text>
                <Text style={styles.statValue}>{item.nombreVentes}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Chiffre d'affaires</Text>
                <Text style={styles.statValue}>{item.chiffreAffaires.toLocaleString('fr-FR')} F</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Résultat net</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: item.resultatNet < 0 ? colors.danger : colors.success },
                  ]}
                >
                  {item.resultatNet.toLocaleString('fr-FR')} F
                </Text>
              </View>
            </View>
            <View style={styles.exportRow}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => handleTelecharger(item)}
                disabled={exportEnCours === item.id}
              >
                <Ionicons name="download-outline" size={14} color={colors.primary} />
                <Text style={styles.exportText}>
                  {exportEnCours === item.id ? 'Patientez...' : 'Télécharger'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => handlePartager(item)}
                disabled={exportEnCours === item.id}
              >
                <Ionicons name="share-outline" size={14} color={colors.primary} />
                <Text style={styles.exportText}>Partager</Text>
              </TouchableOpacity>
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  periode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
