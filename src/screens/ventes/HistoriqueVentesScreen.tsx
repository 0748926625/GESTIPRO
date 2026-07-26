import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { EmptyState } from '../../components/EmptyState';
import { getModePaiementInfo } from '../../data/modesPaiement';
import { getDerniereClotureFin } from '../../db/clotures';
import { getHistoriqueVentes } from '../../db/ventes';
import { useEtablissementStore } from '../../store/etablissementStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { VenteAvecLignes } from '../../types';
import { genererRecuVente, partagerPdf, telechargerPdf } from '../../utils/pdf';

export function HistoriqueVentesScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [ventes, setVentes] = useState<VenteAvecLignes[]>([]);
  const [depuisCloture, setDepuisCloture] = useState<string | null>(null);
  const nom = useEtablissementStore((s) => s.nom);
  const logoUri = useEtablissementStore((s) => s.logoUri);
  const [exportEnCours, setExportEnCours] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getDerniereClotureFin().then((depuis) => {
        setDepuisCloture(depuis);
        getHistoriqueVentes(100, depuis ?? undefined).then(setVentes);
      });
    }, [])
  );

  const handleTelecharger = async (vente: VenteAvecLignes): Promise<void> => {
    setExportEnCours(vente.id);
    try {
      const fichier = await genererRecuVente(vente, { nom, logoUri });
      const resultat = await telechargerPdf(fichier);
      if (resultat === 'telecharge') {
        Alert.alert('Téléchargé', 'Le reçu a été enregistré sur votre appareil.');
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec du téléchargement.');
    } finally {
      setExportEnCours(null);
    }
  };

  const handlePartager = async (vente: VenteAvecLignes): Promise<void> => {
    setExportEnCours(vente.id);
    try {
      const fichier = await genererRecuVente(vente, { nom, logoUri });
      await partagerPdf(fichier);
    } finally {
      setExportEnCours(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Historique des ventes" onBack={() => navigation.goBack()} />
      {depuisCloture && (
        <View style={styles.infoBanner}>
          <Ionicons name="archive-outline" size={13} color={colors.textMuted} />
          <Text style={styles.infoBannerText}>
            Depuis la clôture du {format(new Date(depuisCloture), 'dd MMM yyyy', { locale: fr })} — les
            ventes précédentes sont dans les archives (Rapports)
          </Text>
        </View>
      )}
      <FlatList
        data={ventes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Aucune vente enregistrée pour l'instant." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                <Text style={styles.date}>
                  {format(new Date(item.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
                </Text>
              </View>
              <Text style={styles.total}>{item.total.toLocaleString('fr-FR')} F</Text>
            </View>
            <View style={styles.vendeurRow}>
              <Ionicons name="person-outline" size={13} color={colors.textMuted} />
              <Text style={styles.vendeur}>{item.nomUser}</Text>
              <View
                style={[
                  styles.modeBadge,
                  { backgroundColor: `${getModePaiementInfo(item.modePaiement).couleur}20` },
                ]}
              >
                <Text style={[styles.modeBadgeText, { color: getModePaiementInfo(item.modePaiement).couleur }]}>
                  {getModePaiementInfo(item.modePaiement).label}
                </Text>
              </View>
            </View>
            {item.lignes.map((ligne) => (
              <Text key={ligne.id} style={styles.ligne}>
                {ligne.quantite} x {ligne.nomProduit}
              </Text>
            ))}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  vendeurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  vendeur: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  modeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ligne: {
    fontSize: 14,
    color: colors.text,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
