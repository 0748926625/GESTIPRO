import React, { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
import { enregistrerMouvementStock } from '../../db/produits';
import type { StockStackParamList } from '../../navigation/StockStack';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme';
import { declencherAlerteStock } from '../../utils/alerteStock';

type Route = RouteProp<StockStackParamList, 'MouvementStock'>;
type Nav = NativeStackNavigationProp<StockStackParamList, 'MouvementStock'>;

export function MouvementStockScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const { produitId, nomProduit } = route.params;

  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState(false);

  const handleValider = async (): Promise<void> => {
    const qte = Number(quantite);
    if (!qte || qte <= 0) {
      Alert.alert('Erreur', 'Entrez une quantité valide.');
      return;
    }
    if (!currentUser || !etablissementId) return;
    setEnCours(true);
    const alerte = await enregistrerMouvementStock(
      etablissementId,
      produitId,
      'entree',
      qte,
      motif.trim() || 'Livraison',
      currentUser.id
    );
    setEnCours(false);
    if (alerte) {
      declencherAlerteStock(alerte);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Entrée de stock" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{nomProduit}</Text>
        <Text style={styles.subtitle}>Enregistrer une entrée de stock (livraison)</Text>

        <Text style={styles.label}>Quantité reçue</Text>
        <TextInput
          style={styles.input}
          value={quantite}
          onChangeText={setQuantite}
          keyboardType="numeric"
          placeholder="0"
          autoFocus
        />

        <Text style={styles.label}>Motif (optionnel)</Text>
        <TextInput
          style={styles.input}
          value={motif}
          onChangeText={setMotif}
          placeholder="Ex: Livraison fournisseur"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleValider} disabled={enCours}>
          <Ionicons name="cube-outline" size={18} color="#FFF" />
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
