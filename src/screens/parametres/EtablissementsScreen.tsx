import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { getSecteurConfig, SECTEURS } from '../../data/secteurs';
import type { ParametresStackParamList } from '../../navigation/ParametresStack';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { Secteur } from '../../types';

type Nav = NativeStackNavigationProp<ParametresStackParamList, 'Etablissements'>;

export function EtablissementsScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const etablissements = useSessionStore((s) => s.etablissements);
  const etablissementActifId = useSessionStore((s) => s.etablissementId);
  const changerEtablissement = useSessionStore((s) => s.changerEtablissement);
  const creerEtablissementEtBasculer = useSessionStore((s) => s.creerEtablissementEtBasculer);
  const changementEnCours = useSessionStore((s) => s.changementEnCours);

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [secteur, setSecteur] = useState<Secteur>('maquis');
  const [sourceImportId, setSourceImportId] = useState<string | null>(null);

  const handleChangerEtablissement = (etablissementId: string): void => {
    if (etablissementId === etablissementActifId || changementEnCours) return;
    const cible = etablissements.find((e) => e.etablissementId === etablissementId);
    Alert.alert(
      `Basculer vers "${cible?.nom ?? ''}" ?`,
      "Les données de l'établissement actuel seront synchronisées, puis vous devrez ressaisir un code PIN pour ce nouvel établissement.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Basculer',
          onPress: async () => {
            try {
              await changerEtablissement(etablissementId);
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Une erreur est survenue.');
            }
          },
        },
      ]
    );
  };

  const handleCreer = async (): Promise<void> => {
    if (!nom.trim()) {
      Alert.alert('Erreur', "Le nom de l'établissement est requis.");
      return;
    }
    try {
      await creerEtablissementEtBasculer(nom.trim(), secteur, sourceImportId ?? undefined);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Une erreur est survenue.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Mes établissements" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {changementEnCours && (
            <View style={styles.chargementBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.chargementTexte}>Bascule en cours...</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Établissements</Text>
          {etablissements.map((e) => {
            const actif = e.etablissementId === etablissementActifId;
            const config = getSecteurConfig(e.secteur);
            return (
              <TouchableOpacity
                key={e.etablissementId}
                style={[styles.etablissementCard, actif && styles.etablissementCardActive]}
                onPress={() => handleChangerEtablissement(e.etablissementId)}
                disabled={changementEnCours}
              >
                <View style={styles.etablissementIcone}>
                  <Ionicons name={config.icone} size={22} color={colors.primary} />
                </View>
                <View style={styles.etablissementInfo}>
                  <Text style={styles.etablissementNom}>{e.nom}</Text>
                  <Text style={styles.etablissementSecteur}>{config.label}</Text>
                </View>
                {actif ? (
                  <View style={styles.badgeActif}>
                    <Text style={styles.badgeActifTexte}>Actif</Text>
                  </View>
                ) : (
                  <Ionicons name="swap-horizontal-outline" size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}

          {!formulaireOuvert ? (
            <TouchableOpacity
              style={styles.nouveauBouton}
              onPress={() => setFormulaireOuvert(true)}
              disabled={changementEnCours}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.nouveauBoutonTexte}>Nouvel établissement</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Nouvel établissement</Text>

              <Text style={styles.label}>Nom de l'établissement</Text>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Ex: Chez Tantie Awa - Cocody"
                autoFocus
              />

              <Text style={styles.label}>Secteur d'activité</Text>
              <View style={styles.secteurGrid}>
                {SECTEURS.map((s) => {
                  const actif = secteur === s.value;
                  return (
                    <TouchableOpacity
                      key={s.value}
                      style={[styles.secteurCard, actif && styles.secteurCardActive]}
                      onPress={() => setSecteur(s.value)}
                    >
                      <Ionicons name={s.icone} size={20} color={actif ? '#FFF' : colors.primary} />
                      <Text style={[styles.secteurLabel, actif && styles.secteurLabelActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {etablissements.length > 0 && (
                <>
                  <Text style={styles.label}>
                    Importer les produits depuis (optionnel)
                  </Text>
                  <View style={styles.importListe}>
                    <TouchableOpacity
                      style={[styles.importOption, sourceImportId === null && styles.importOptionActive]}
                      onPress={() => setSourceImportId(null)}
                    >
                      <Text
                        style={[
                          styles.importOptionTexte,
                          sourceImportId === null && styles.importOptionTexteActive,
                        ]}
                      >
                        Aucun (partir de zéro)
                      </Text>
                    </TouchableOpacity>
                    {etablissements.map((e) => (
                      <TouchableOpacity
                        key={e.etablissementId}
                        style={[
                          styles.importOption,
                          sourceImportId === e.etablissementId && styles.importOptionActive,
                        ]}
                        onPress={() => setSourceImportId(e.etablissementId)}
                      >
                        <Text
                          style={[
                            styles.importOptionTexte,
                            sourceImportId === e.etablissementId && styles.importOptionTexteActive,
                          ]}
                        >
                          {e.nom}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.annulerBouton}
                  onPress={() => {
                    setFormulaireOuvert(false);
                    setNom('');
                    setSourceImportId(null);
                  }}
                  disabled={changementEnCours}
                >
                  <Text style={styles.annulerBoutonTexte}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.creerBouton}
                  onPress={handleCreer}
                  disabled={changementEnCours}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.creerBoutonTexte}>
                    {changementEnCours ? 'Création...' : "Créer et basculer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  chargementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chargementTexte: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  etablissementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  etablissementCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  etablissementIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etablissementInfo: {
    flex: 1,
  },
  etablissementNom: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  etablissementSecteur: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeActif: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeActifTexte: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  nouveauBouton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  nouveauBoutonTexte: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
    ...cardShadow,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  secteurGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secteurCard: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
  },
  secteurCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secteurLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  secteurLabelActive: {
    color: '#FFF',
  },
  importListe: {
    gap: spacing.xs,
  },
  importOption: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  importOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  importOptionTexte: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  importOptionTexteActive: {
    color: '#FFF',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  annulerBouton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  annulerBoutonTexte: {
    color: colors.textMuted,
    fontSize: 14,
  },
  creerBouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  creerBoutonTexte: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
