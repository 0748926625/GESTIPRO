import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { SelectField } from '../../components/SelectField';
import { CATEGORIES_RECETTES } from '../../data/categoriesOperations';
import { creerOperation } from '../../db/operations';
import type { VentesStackParamList } from '../../navigation/VentesStack';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<VentesStackParamList, 'NouvelleRecette'>;

export function NouvelleRecetteScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const [categorie, setCategorie] = useState('');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [enCours, setEnCours] = useState(false);

  const handleValider = async (): Promise<void> => {
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
    setEnCours(true);
    await creerOperation(etablissementId, {
      type: 'recette',
      categorie,
      montant: montantNombre,
      description: description.trim(),
      userId: currentUser.id,
    });
    setEnCours(false);
    Alert.alert('Enregistré', `Recette de ${montantNombre.toLocaleString('fr-FR')} F ajoutée.`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Autre recette" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Encaissement hors vente de produits : location d'espace, prestation de service, etc.
        </Text>

        <SelectField
          label="Catégorie"
          displayValue={categorie}
          placeholder="Choisir une catégorie"
          options={CATEGORIES_RECETTES}
          keyExtractor={(item) => item}
          renderLabel={(item) => item}
          onSelect={setCategorie}
          icon="pricetag-outline"
        />

        <Text style={styles.label}>Montant encaissé (F CFA)</Text>
        <TextInput
          style={styles.input}
          value={montant}
          onChangeText={setMontant}
          keyboardType="numeric"
          placeholder="0"
          autoFocus
        />

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Location espace pour vente de nourriture"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleValider} disabled={enCours}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
          <Text style={styles.saveButtonText}>{enCours ? 'Enregistrement...' : 'Valider'}</Text>
        </TouchableOpacity>
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
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
