import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { MODES_PAIEMENT, type ModePaiement } from '../../data/modesPaiement';
import { getSecteurConfig } from '../../data/secteurs';
import { getLaveurs } from '../../db/laveurs';
import { getProduits } from '../../db/produits';
import { creerVente } from '../../db/ventes';
import type { VentesStackParamList } from '../../navigation/VentesStack';
import { useAuthStore } from '../../store/authStore';
import { useEtablissementStore } from '../../store/etablissementStore';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { Laveur, Produit } from '../../types';
import { declencherAlerteStock } from '../../utils/alerteStock';

type Nav = NativeStackNavigationProp<VentesStackParamList, 'NouvelleVente'>;

export function NouvelleVenteScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [panier, setPanier] = useState<Record<string, number>>({});
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');
  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [laveurId, setLaveurId] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const reload = useCallback(() => {
    getProduits().then(setProduits);
    if (config.gestionLaveurs) {
      getLaveurs().then(setLaveurs);
    }
  }, [config.gestionLaveurs]);

  useFocusEffect(reload);

  const ajouter = (produit: Produit): void => {
    const quantiteActuelle = panier[produit.id] ?? 0;
    if (quantiteActuelle >= produit.quantiteStock) return;
    setPanier((p) => ({ ...p, [produit.id]: quantiteActuelle + 1 }));
  };

  const retirer = (produitId: string): void => {
    setPanier((p) => {
      const quantite = (p[produitId] ?? 0) - 1;
      const next = { ...p };
      if (quantite <= 0) {
        delete next[produitId];
      } else {
        next[produitId] = quantite;
      }
      return next;
    });
  };

  const lignesPanier = Object.entries(panier).map(([produitId, quantite]) => {
    const produit = produits.find((p) => p.id === produitId);
    return { produit, quantite };
  });
  const total = lignesPanier.reduce((sum, l) => sum + (l.produit?.prixVente ?? 0) * l.quantite, 0);

  const handleValider = async (): Promise<void> => {
    if (!currentUser || !etablissementId || lignesPanier.length === 0) return;
    setEnCours(true);
    try {
      const { produitsEnAlerte } = await creerVente(
        etablissementId,
        currentUser.id,
        lignesPanier
          .filter((l): l is { produit: Produit; quantite: number } => l.produit !== undefined)
          .map((l) => ({
            produitId: l.produit.id,
            nom: l.produit.nom,
            quantite: l.quantite,
            prixUnitaireVente: l.produit.prixVente,
          })),
        modePaiement,
        laveurId
      );
      setPanier({});
      setModePaiement('especes');
      setLaveurId(null);
      reload();
      Alert.alert('Vente enregistrée', `Total encaissé : ${total.toLocaleString('fr-FR')} F`);
      if (produitsEnAlerte.length > 0) {
        declencherAlerteStock(produitsEnAlerte[0]);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d\'enregistrer la vente.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          <Text style={styles.headerLink}>Déconnexion</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('HistoriqueVentes')}
        >
          <Text style={styles.headerLink}>Historique</Text>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={produits}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.recetteLink}
            onPress={() => navigation.navigate('NouvelleRecette')}
          >
            <View style={styles.recetteLinkLeft}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              <Text style={styles.recetteLinkText}>Encaisser une autre recette (location, prestation...)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <EmptyState
            message={`Aucun ${config.libelleArticle}. Demandez au gérant d'en ajouter.`}
          />
        }
        renderItem={({ item }) => {
          const quantiteAuPanier = panier[item.id] ?? 0;
          const epuise = config.stockActif && item.quantiteStock <= 0;
          return (
            <View style={[styles.row, epuise && styles.rowEpuise]}>
              <View style={styles.info}>
                <Text style={styles.nom}>{item.nom}</Text>
                <Text style={styles.details}>
                  {item.prixVente.toLocaleString('fr-FR')} F
                  {config.stockActif ? ` · Stock: ${item.quantiteStock} ${item.unite}` : ` · ${item.unite}`}
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => retirer(item.id)}
                  disabled={quantiteAuPanier === 0}
                >
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.quantite}>{quantiteAuPanier}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => ajouter(item)}
                  disabled={epuise || quantiteAuPanier >= item.quantiteStock}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      {lignesPanier.length > 0 && (
        <View style={styles.footer}>
          {config.gestionLaveurs && laveurs.length > 0 && (
            <>
              <Text style={styles.modePaiementLabel}>Laveur (commission)</Text>
              <View style={styles.modePaiementRow}>
                {laveurs.map((l) => {
                  const actif = laveurId === l.id;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.modeChip, { borderColor: colors.primary }, actif && { backgroundColor: colors.primary }]}
                      onPress={() => setLaveurId(actif ? null : l.id)}
                    >
                      <Text style={[styles.modeChipText, { color: actif ? '#FFF' : colors.primary }]}>
                        {l.nom}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.modePaiementLabel}>Mode de paiement</Text>
          <View style={styles.modePaiementRow}>
            {MODES_PAIEMENT.map((mode) => {
              const actif = modePaiement === mode.value;
              return (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.modeChip,
                    { borderColor: mode.couleur },
                    actif && { backgroundColor: mode.couleur },
                  ]}
                  onPress={() => setModePaiement(mode.value)}
                >
                  <Text style={[styles.modeChipText, { color: actif ? '#FFF' : mode.couleur }]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.footerBottom}>
            <View>
              <Text style={styles.footerLabel}>Total</Text>
              <Text style={styles.footerTotal}>{total.toLocaleString('fr-FR')} F</Text>
            </View>
            <TouchableOpacity style={styles.validerButton} onPress={handleValider} disabled={enCours}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.validerButtonText}>{enCours ? 'Enregistrement...' : 'Valider la vente'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLink: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  recetteLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recetteLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  recetteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  rowEpuise: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
  },
  nom: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  details: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  quantite: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  modePaiementLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  modePaiementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  modeChip: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  validerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  validerButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
