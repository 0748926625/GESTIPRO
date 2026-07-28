import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { getModePaiementInfo } from '../../data/modesPaiement';
import { getSecteurConfig } from '../../data/secteurs';
import { creerCloture, getDerniereClotureFin } from '../../db/clotures';
import {
  getChiffreAffaires,
  getCommissionsParLaveur,
  getMargeTotale,
  getNombreVentes,
  getProduitsTopVentes,
  getRepartitionParModePaiement,
} from '../../db/rapports';
import { getTotalParType } from '../../db/operations';
import type { RapportsStackParamList } from '../../navigation/RapportsStack';
import { useAuthStore } from '../../store/authStore';
import { useEtablissementStore } from '../../store/etablissementStore';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { CommissionLaveur, ProduitVendu, RepartitionModePaiement } from '../../types';
import { genererRapportPdf, partagerPdf, telechargerPdf } from '../../utils/pdf';

type Nav = NativeStackNavigationProp<RapportsStackParamList, 'Rapports'>;

type Periode = 'jour' | 'semaine' | 'mois';

const LABELS: Record<Periode, string> = {
  jour: "Aujourd'hui",
  semaine: 'Cette semaine',
  mois: 'Ce mois-ci',
};

function debutPeriode(periode: Periode): Date {
  const maintenant = new Date();
  if (periode === 'jour') return startOfDay(maintenant);
  if (periode === 'semaine') return startOfWeek(maintenant, { weekStartsOn: 1 });
  return startOfMonth(maintenant);
}

export function RapportsScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const [periode, setPeriode] = useState<Periode>('jour');
  const [chiffreAffaires, setChiffreAffaires] = useState(0);
  const [nombreVentes, setNombreVentes] = useState(0);
  const [marge, setMarge] = useState(0);
  const [recettesDiverses, setRecettesDiverses] = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [topProduits, setTopProduits] = useState<ProduitVendu[]>([]);
  const [repartitionPaiement, setRepartitionPaiement] = useState<RepartitionModePaiement[]>([]);
  const [commissionsLaveurs, setCommissionsLaveurs] = useState<CommissionLaveur[]>([]);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [clotureEnCours, setClotureEnCours] = useState(false);
  const nomMaquis = useEtablissementStore((s) => s.nom);
  const logoUri = useEtablissementStore((s) => s.logoUri);
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const currentUser = useAuthStore((s) => s.currentUser);

  const depuisISO = useMemo(() => debutPeriode(periode).toISOString(), [periode]);
  const resultatNet = marge + recettesDiverses - depenses;

  const reload = useCallback(() => {
    getChiffreAffaires(depuisISO).then(setChiffreAffaires);
    getNombreVentes(depuisISO).then(setNombreVentes);
    getMargeTotale(depuisISO).then(setMarge);
    getTotalParType(depuisISO, 'recette').then(setRecettesDiverses);
    getTotalParType(depuisISO, 'depense').then(setDepenses);
    getProduitsTopVentes(depuisISO).then(setTopProduits);
    getRepartitionParModePaiement(depuisISO).then(setRepartitionPaiement);
    if (config.gestionLaveurs) {
      getCommissionsParLaveur(depuisISO).then(setCommissionsLaveurs);
    }
  }, [depuisISO, config.gestionLaveurs]);

  useFocusEffect(reload);

  const genererFichier = () =>
    genererRapportPdf({
      periodeLabel: LABELS[periode],
      nombreVentes,
      chiffreAffaires,
      marge,
      recettesDiverses,
      depenses,
      resultatNet,
      topProduits,
      repartitionPaiement,
      etablissement: { nom: nomMaquis, logoUri },
    });

  const handleTelecharger = async (): Promise<void> => {
    setExportEnCours(true);
    try {
      const fichier = await genererFichier();
      const resultat = await telechargerPdf(fichier);
      if (resultat === 'telecharge') {
        Alert.alert('Téléchargé', 'Le rapport a été enregistré sur votre appareil.');
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec du téléchargement.');
    } finally {
      setExportEnCours(false);
    }
  };

  const handlePartager = async (): Promise<void> => {
    setExportEnCours(true);
    try {
      const fichier = await genererFichier();
      await partagerPdf(fichier);
    } finally {
      setExportEnCours(false);
    }
  };

  const handleCloturer = async (): Promise<void> => {
    if (!etablissementId || !currentUser) return;
    const depuis = await getDerniereClotureFin();
    const depuisTexte = depuis
      ? `depuis le ${format(new Date(depuis), 'dd MMMM yyyy', { locale: fr })}`
      : 'depuis le début';

    Alert.alert(
      'Clôturer la période ?',
      `Un rapport figé sera enregistré dans les Archives avec toutes les ventes et opérations ${depuisTexte}. L'historique des ventes repartira de zéro, mais aucune donnée n'est supprimée : tout reste consultable dans les Archives.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          onPress: async () => {
            setClotureEnCours(true);
            try {
              await creerCloture(etablissementId, currentUser.id);
              reload();
              Alert.alert('Clôture effectuée', 'Retrouvez le résumé dans Archives.');
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec de la clôture.');
            } finally {
              setClotureEnCours(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Rapports</Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleTelecharger}
              disabled={exportEnCours}
            >
              <Ionicons name="download-outline" size={16} color={colors.primary} />
              <Text style={styles.exportBtnText}>Télécharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={handlePartager} disabled={exportEnCours}>
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={styles.exportBtnText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.periodeSelector}>
          {(Object.keys(LABELS) as Periode[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodeButton, periode === p && styles.periodeButtonActive]}
              onPress={() => setPeriode(p)}
            >
              <Text style={[styles.periodeText, periode === p && styles.periodeTextActive]}>
                {LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Ventes"
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
        <View style={styles.statsRow}>
          <StatCard
            label="Marge sur ventes"
            value={`${marge.toLocaleString('fr-FR')} F`}
            icon="trending-up-outline"
            iconColor={colors.accentViolet}
          />
          <StatCard
            label="Résultat net"
            value={`${resultatNet.toLocaleString('fr-FR')} F`}
            accent={resultatNet < 0 ? 'danger' : 'success'}
            icon="wallet-outline"
            iconColor={resultatNet < 0 ? colors.danger : colors.success}
          />
        </View>

        <TouchableOpacity style={styles.operationsLink} onPress={() => navigation.navigate('Operations')}>
          <View style={styles.operationsLinkLeft}>
            <Ionicons name="swap-vertical-outline" size={18} color={colors.primary} />
            <View>
              <Text style={styles.operationsLinkTitle}>Recettes & dépenses diverses</Text>
              <Text style={styles.operationsLinkSubtitle}>
                +{recettesDiverses.toLocaleString('fr-FR')} F · -{depenses.toLocaleString('fr-FR')} F
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.operationsLink} onPress={() => navigation.navigate('Archives')}>
          <View style={styles.operationsLinkLeft}>
            <Ionicons name="archive-outline" size={18} color={colors.primary} />
            <View>
              <Text style={styles.operationsLinkTitle}>Archives</Text>
              <Text style={styles.operationsLinkSubtitle}>Consulter les périodes clôturées</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clotureBtn}
          onPress={handleCloturer}
          disabled={clotureEnCours}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#FFF" />
          <Text style={styles.clotureBtnText}>
            {clotureEnCours ? 'Clôture en cours...' : 'Clôturer la période'}
          </Text>
        </TouchableOpacity>

        {repartitionPaiement.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={16} color={colors.text} />
              <Text style={styles.sectionTitle}>Répartition par mode de paiement</Text>
            </View>
            {repartitionPaiement.map((r) => {
              const info = getModePaiementInfo(r.modePaiement);
              const pourcentage = chiffreAffaires > 0 ? Math.round((r.total / chiffreAffaires) * 100) : 0;
              return (
                <View key={r.modePaiement} style={styles.modeRow}>
                  <View style={[styles.modeDot, { backgroundColor: info.couleur }]} />
                  <View style={styles.modeInfo}>
                    <Text style={styles.modeNom}>{info.label}</Text>
                    <Text style={styles.modeDetails}>
                      {r.nombreVentes} vente(s) · {pourcentage}%
                    </Text>
                  </View>
                  <Text style={styles.modeMontant}>{r.total.toLocaleString('fr-FR')} F</Text>
                </View>
              );
            })}
          </>
        )}

        {config.gestionLaveurs && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="water-outline" size={16} color={colors.text} />
              <Text style={styles.sectionTitle}>Commissions par laveur</Text>
            </View>
            {commissionsLaveurs.length === 0 ? (
              <EmptyState message="Aucune vente attribuée à un laveur sur cette période." />
            ) : (
              commissionsLaveurs.map((c) => (
                <View key={c.laveurId} style={styles.modeRow}>
                  <View style={styles.modeInfo}>
                    <Text style={styles.modeNom}>{c.nom}</Text>
                    <Text style={styles.modeDetails}>
                      {c.nombreVentes} vente(s) · {c.chiffreAffaires.toLocaleString('fr-FR')} F encaissé
                    </Text>
                  </View>
                  <Text style={styles.modeMontant}>{c.commission.toLocaleString('fr-FR')} F</Text>
                </View>
              ))
            )}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="trophy-outline" size={16} color={colors.text} />
          <Text style={styles.sectionTitle}>Produits les plus vendus</Text>
        </View>
        {topProduits.length === 0 ? (
          <EmptyState message="Aucune vente sur cette période." />
        ) : (
          topProduits.map((p, index) => (
            <View key={p.produitId} style={styles.produitRow}>
              <Text style={styles.produitRang}>{index + 1}.</Text>
              <View style={styles.produitInfo}>
                <Text style={styles.produitNom}>{p.nom}</Text>
                <Text style={styles.produitDetails}>
                  {p.quantiteVendue} vendu(s) · {p.chiffreAffaires.toLocaleString('fr-FR')} F
                </Text>
              </View>
            </View>
          ))
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  periodeSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodeText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  periodeTextActive: {
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  operationsLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  operationsLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  operationsLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  operationsLinkSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  clotureBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  clotureBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modeInfo: {
    flex: 1,
  },
  modeNom: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modeDetails: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  modeMontant: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  produitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  produitRang: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    width: 28,
  },
  produitInfo: {
    flex: 1,
  },
  produitNom: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  produitDetails: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
