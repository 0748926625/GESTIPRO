import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
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
import { EmptyState } from '../../components/EmptyState';
import { SelectField } from '../../components/SelectField';
import { CATEGORIES_DEPENSES, CATEGORIES_RECETTES } from '../../data/categoriesOperations';
import { creerNotification } from '../../db/notifications';
import { creerOperation, getOperations, supprimerOperation } from '../../db/operations';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { OperationCaisse, TypeOperation } from '../../types';

export function OperationsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const currentUser = useAuthStore((s) => s.currentUser);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const [operations, setOperations] = useState<OperationCaisse[]>([]);
  const [type, setType] = useState<TypeOperation>('depense');
  const [categorie, setCategorie] = useState('');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  const reload = useCallback(() => {
    getOperations().then(setOperations);
  }, []);

  useFocusEffect(reload);

  const options = type === 'depense' ? CATEGORIES_DEPENSES : CATEGORIES_RECETTES;

  const handleChangerType = (nouveauType: TypeOperation): void => {
    setType(nouveauType);
    setCategorie('');
  };

  const handleEnregistrer = async (): Promise<void> => {
    const montantNombre = Number(montant);
    if (!categorie) {
      Alert.alert('Erreur', 'Choisissez une catégorie.');
      return;
    }
    if (!montantNombre || montantNombre <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide.');
      return;
    }
    if (!currentUser || !etablissementId) return;
    setEnregistrement(true);
    try {
      await creerOperation(etablissementId, {
        type,
        categorie,
        montant: montantNombre,
        description: description.trim(),
        userId: currentUser.id,
      });
      if (currentUser.role === 'serveur') {
        creerNotification(etablissementId, {
          type,
          titre: type === 'depense' ? 'Dépense enregistrée' : 'Recette enregistrée',
          message: `${currentUser.nom} a enregistré une ${type === 'depense' ? 'dépense' : 'recette'} de ${montantNombre.toLocaleString('fr-FR')} F (${categorie}).`,
          userId: currentUser.id,
        }).catch(() => {});
      }
      setCategorie('');
      setMontant('');
      setDescription('');
      reload();
      Alert.alert(
        'Enregistré',
        `${type === 'depense' ? 'Dépense' : 'Recette'} de ${montantNombre.toLocaleString('fr-FR')} F enregistrée.`
      );
    } catch (e) {
      Alert.alert(
        "Échec de l'enregistrement",
        e instanceof Error ? e.message : "L'opération n'a pas pu être enregistrée."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const handleSupprimer = (operation: OperationCaisse): void => {
    Alert.alert('Supprimer cette opération ?', `${operation.categorie} · ${operation.montant.toLocaleString('fr-FR')} F`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supprimerOperation(operation.id);
          reload();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader
        title="Recettes & dépenses"
        onBack={() => navigation.goBack()}
        showBack={canGoBack}
      />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nouvelle opération</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'depense' && styles.typeButtonDepense]}
                onPress={() => handleChangerType('depense')}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={16}
                  color={type === 'depense' ? '#FFF' : colors.danger}
                />
                <Text style={[styles.typeText, type === 'depense' && styles.typeTextActive]}>Dépense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'recette' && styles.typeButtonRecette]}
                onPress={() => handleChangerType('recette')}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={16}
                  color={type === 'recette' ? '#FFF' : colors.success}
                />
                <Text style={[styles.typeText, type === 'recette' && styles.typeTextActive]}>Recette</Text>
              </TouchableOpacity>
            </View>

            <SelectField
              label="Catégorie"
              displayValue={categorie}
              placeholder="Choisir une catégorie"
              options={options}
              keyExtractor={(item) => item}
              renderLabel={(item) => item}
              onSelect={setCategorie}
              icon="pricetag-outline"
            />

            <Text style={styles.label}>Montant (F CFA)</Text>
            <TextInput
              style={styles.input}
              value={montant}
              onChangeText={setMontant}
              keyboardType="numeric"
              placeholder="0"
            />

            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Salaire du mois de juillet"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleEnregistrer}
              disabled={enregistrement}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Historique</Text>
          {operations.length === 0 ? (
            <EmptyState message="Aucune opération enregistrée." />
          ) : (
            operations.map((op) => (
              <View key={op.id} style={styles.opCard}>
                <View
                  style={[
                    styles.opIcon,
                    { backgroundColor: op.type === 'recette' ? colors.successBg : colors.dangerBg },
                  ]}
                >
                  <Ionicons
                    name={op.type === 'recette' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                    size={20}
                    color={op.type === 'recette' ? colors.success : colors.danger}
                  />
                </View>
                <View style={styles.opInfo}>
                  <Text style={styles.opCategorie}>{op.categorie}</Text>
                  {op.description ? <Text style={styles.opDescription}>{op.description}</Text> : null}
                  <Text style={styles.opMeta}>
                    {format(new Date(op.date), 'dd MMM yyyy, HH:mm', { locale: fr })} · {op.nomUser}
                  </Text>
                </View>
                <View style={styles.opRight}>
                  <Text style={[styles.opMontant, { color: op.type === 'recette' ? colors.success : colors.danger }]}>
                    {op.type === 'recette' ? '+' : '-'}
                    {op.montant.toLocaleString('fr-FR')} F
                  </Text>
                  <TouchableOpacity onPress={() => handleSupprimer(op)}>
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonDepense: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  typeButtonRecette: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeTextActive: {
    color: '#FFF',
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  opCard: {
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
  opIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opInfo: {
    flex: 1,
  },
  opCategorie: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  opDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  opMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  opRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  opMontant: {
    fontSize: 14,
    fontWeight: '700',
  },
});
