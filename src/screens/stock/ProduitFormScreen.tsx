import React, { useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { SelectField } from '../../components/SelectField';
import type { ProduitSuggere } from '../../data/catalogueBoissons';
import { getSecteurConfig } from '../../data/secteurs';
import { createProduit, getProduit, setProduitActif, updateProduit } from '../../db/produits';
import type { StockStackParamList } from '../../navigation/StockStack';
import { useEtablissementStore } from '../../store/etablissementStore';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';

type Route = RouteProp<StockStackParamList, 'ProduitForm'>;
type Nav = NativeStackNavigationProp<StockStackParamList, 'ProduitForm'>;

const CATEGORIE_AUTRE = 'Autre';
const QUANTITE_ILLIMITEE = 999999;

export function ProduitFormScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const produitId = route.params?.produitId;
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);

  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [categoriePersonnalisee, setCategoriePersonnalisee] = useState(false);
  const [unite, setUnite] = useState('');
  const [seuilAlerte, setSeuilAlerte] = useState('0');
  const [prixAchat, setPrixAchat] = useState('0');
  const [prixVente, setPrixVente] = useState('0');
  const [chargement, setChargement] = useState(produitId !== undefined);

  useEffect(() => {
    if (produitId === undefined) return;
    getProduit(produitId).then((p) => {
      if (p) {
        setNom(p.nom);
        setCategorie(p.categorie);
        setCategoriePersonnalisee(!config.categories.includes(p.categorie));
        setUnite(p.unite);
        setSeuilAlerte(String(p.seuilAlerte));
        setPrixAchat(String(p.prixAchat));
        setPrixVente(String(p.prixVente));
      }
      setChargement(false);
    });
  }, [produitId]);

  const handleChoisirSuggestion = (suggestion: ProduitSuggere): void => {
    setNom(suggestion.nom);
    setCategorie(suggestion.categorie);
    setCategoriePersonnalisee(false);
    setUnite(suggestion.unite);
  };

  const handleChoisirCategorie = (cat: string): void => {
    if (cat === CATEGORIE_AUTRE) {
      setCategorie('');
      setCategoriePersonnalisee(true);
    } else {
      setCategorie(cat);
      setCategoriePersonnalisee(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis.');
      return;
    }
    const input = {
      nom: nom.trim(),
      categorie: categorie.trim(),
      unite: unite.trim(),
      seuilAlerte: config.stockActif ? Number(seuilAlerte) || 0 : 0,
      prixAchat: Number(prixAchat) || 0,
      prixVente: Number(prixVente) || 0,
    };
    if (produitId !== undefined) {
      await updateProduit(produitId, input);
    } else {
      if (!etablissementId) return;
      await createProduit(etablissementId, {
        ...input,
        quantiteStockInitiale: config.stockActif ? undefined : QUANTITE_ILLIMITEE,
      });
    }
    navigation.goBack();
  };

  const handleDesactiver = (): void => {
    if (produitId === undefined) return;
    Alert.alert('Désactiver ce produit ?', 'Il ne sera plus visible dans le stock actif.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Désactiver',
        style: 'destructive',
        onPress: async () => {
          await setProduitActif(produitId, false);
          navigation.goBack();
        },
      },
    ]);
  };

  if (chargement) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader
        title={
          produitId !== undefined
            ? `Modifier le ${config.libelleArticle}`
            : `Nouveau ${config.libelleArticle}`
        }
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.content}>
        {produitId === undefined && (
          <View style={styles.suggestionBox}>
            <View style={styles.suggestionHeader}>
              <Ionicons name={config.icone} size={18} color={colors.primary} />
              <Text style={styles.suggestionTitle}>{config.label} : suggestions courantes</Text>
            </View>
            <SelectField
              label={`Choisir un ${config.libelleArticle} suggéré`}
              displayValue=""
              placeholder={`Rechercher un ${config.libelleArticle}...`}
              options={config.suggestions}
              keyExtractor={(item) => item.nom}
              renderLabel={(item) => item.nom}
              renderSubtitle={(item) => item.categorie}
              onSelect={handleChoisirSuggestion}
              searchable
              icon="search"
            />
          </View>
        )}

        <Text style={styles.label}>Nom du {config.libelleArticle}</Text>
        <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder={`Ex: ${config.suggestions[0]?.nom ?? ''}`} />

        <SelectField
          label="Catégorie"
          displayValue={categoriePersonnalisee ? CATEGORIE_AUTRE : categorie}
          placeholder="Choisir une catégorie"
          options={config.categories}
          keyExtractor={(item) => item}
          renderLabel={(item) => item}
          onSelect={handleChoisirCategorie}
          icon="pricetag-outline"
        />
        {categoriePersonnalisee && (
          <TextInput
            style={[styles.input, styles.inputSuite]}
            value={categorie}
            onChangeText={setCategorie}
            placeholder="Nom de la catégorie"
          />
        )}

        <Text style={styles.label}>Unité</Text>
        <TextInput
          style={styles.input}
          value={unite}
          onChangeText={setUnite}
          placeholder="Ex: bouteille, sachet, service"
        />

        {config.stockActif && (
          <>
            <Text style={styles.label}>Seuil d'alerte (stock bas)</Text>
            <TextInput
              style={styles.input}
              value={seuilAlerte}
              onChangeText={setSeuilAlerte}
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={styles.label}>Prix d'achat (F CFA)</Text>
        <TextInput
          style={styles.input}
          value={prixAchat}
          onChangeText={setPrixAchat}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Prix de vente (F CFA)</Text>
        <TextInput
          style={styles.input}
          value={prixVente}
          onChangeText={setPrixVente}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>

        {produitId !== undefined && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDesactiver}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.deleteButtonText}>Désactiver ce produit</Text>
          </TouchableOpacity>
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
  suggestionBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
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
  inputSuite: {
    marginTop: spacing.sm,
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
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 15,
  },
});
