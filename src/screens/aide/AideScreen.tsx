import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { cardShadow, colors, spacing } from '../../theme';

interface Etape {
  titre: string;
  points: string[];
  role: 'gerant' | 'tous';
}

const ETAPES: Etape[] = [
  {
    titre: 'Créez votre établissement',
    role: 'gerant',
    points: [
      "Ouvrez GestiPro → « Créer un établissement »",
      "Email + mot de passe : la clé qui relie tous vos appareils entre eux",
      "Choisissez votre secteur — l'appli s'adapte au bon vocabulaire",
      'Donnez un nom à votre établissement',
    ],
  },
  {
    titre: 'Choisissez votre code PIN',
    role: 'gerant',
    points: [
      '4 chiffres, faciles à retenir',
      "C'est votre accès Gérant sur cet appareil et les suivants",
      'Modifiable ensuite dans Paramètres',
    ],
  },
  {
    titre: 'Ajoutez vos produits',
    role: 'gerant',
    points: [
      'Onglet Stock → bouton d\'ajout',
      "Nom, catégorie, unité, prix d'achat et de vente",
      "Un seuil d'alerte pour être prévenu quand le stock devient bas",
    ],
  },
  {
    titre: 'Ajoutez votre équipe',
    role: 'gerant',
    points: [
      'Paramètres → Utilisateurs → « Ajouter »',
      'Un nom et un PIN à 4 chiffres par personne',
      'Caissier : vend, recharge le stock, enregistre les dépenses',
      'Gérant : accès complet, y compris rapports et paramètres',
    ],
  },
  {
    titre: 'Enregistrez votre première vente',
    role: 'tous',
    points: [
      'Onglet Ventes → sélectionnez les articles',
      'Choisissez le mode de paiement',
      'Validez — le stock se déduit tout seul',
    ],
  },
  {
    titre: 'Rechargez le stock',
    role: 'tous',
    points: [
      'Onglet Stock → icône Stock sur un article',
      'Indiquez la quantité reçue',
      "L'icône horloge affiche l'historique complet des mouvements",
    ],
  },
  {
    titre: 'Suivez votre activité',
    role: 'gerant',
    points: [
      "Onglet Rapports : chiffre d'affaires, marge, dépenses du jour/semaine/mois",
      'La cloche sur l\'accueil notifie chaque action d\'un caissier',
      "« Clôturer la période » archive proprement sans rien supprimer",
    ],
  },
];

const ROLES: { action: string; gerant: boolean; caissier: boolean }[] = [
  { action: 'Vendre', gerant: true, caissier: true },
  { action: 'Recharger le stock', gerant: true, caissier: true },
  { action: 'Dépenses / recettes', gerant: true, caissier: true },
  { action: 'Voir les rapports', gerant: true, caissier: false },
  { action: 'Gérer les produits', gerant: true, caissier: false },
  { action: 'Gérer l\'équipe', gerant: true, caissier: false },
  { action: 'Recevoir les notifications', gerant: true, caissier: false },
];

export function AideScreen(): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Aide" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Sept étapes pour installer votre commerce dans l'application, de la création du compte
          à la lecture de vos premiers rapports.
        </Text>

        {ETAPES.map((etape, index) => (
          <View key={etape.titre} style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{index + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitre}>{etape.titre}</Text>
              {etape.points.map((point) => (
                <View key={point} style={styles.stepPointRow}>
                  <View style={styles.puce} />
                  <Text style={styles.stepPoint}>{point}</Text>
                </View>
              ))}
              <View
                style={[
                  styles.tag,
                  etape.role === 'gerant' ? styles.tagGerant : styles.tagTous,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: etape.role === 'gerant' ? colors.primary : colors.accentVert },
                  ]}
                >
                  {etape.role === 'gerant' ? 'Gérant' : 'Tout le monde'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Qui peut faire quoi</Text>
        <View style={styles.rolesCard}>
          <View style={[styles.rolesRow, styles.rolesHead]}>
            <Text style={[styles.rolesActionText, styles.rolesHeadText]}>Action</Text>
            <Text style={[styles.rolesCellText, styles.rolesHeadText]}>Gérant</Text>
            <Text style={[styles.rolesCellText, styles.rolesHeadText]}>Caissier</Text>
          </View>
          {ROLES.map((r) => (
            <View key={r.action} style={styles.rolesRow}>
              <Text style={styles.rolesActionText}>{r.action}</Text>
              <Text style={styles.rolesCellText}>
                {r.gerant ? (
                  <Ionicons name="checkmark" size={16} color={colors.accentVert} />
                ) : (
                  '—'
                )}
              </Text>
              <Text style={styles.rolesCellText}>
                {r.caissier ? (
                  <Ionicons name="checkmark" size={16} color={colors.accentVert} />
                ) : (
                  '—'
                )}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bon à savoir</Text>
        <View style={styles.tip}>
          <Ionicons name="wifi-outline" size={18} color={colors.accentBleu} />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Fonctionne hors connexion. </Text>
            Vos ventes s'enregistrent même sans réseau et se synchronisent dès que la connexion revient.
          </Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="home-outline" size={18} color={colors.accentVert} />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Installez l'icône sur l'écran d'accueil. </Text>
            Depuis le navigateur : « Ajouter à l'écran d'accueil » pour ouvrir GestiPro comme une vraie app.
          </Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="key-outline" size={18} color={colors.accentJaune} />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Un seul email par établissement. </Text>
            Chaque personne se connecte ensuite avec son propre PIN à 4 chiffres, pas avec cet email.
          </Text>
        </View>
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
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  intro: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  stepBody: {
    flex: 1,
  },
  stepTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  stepPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  puce: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginTop: 7,
  },
  stepPoint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagGerant: {
    backgroundColor: `${colors.primary}1A`,
  },
  tagTous: {
    backgroundColor: `${colors.accentVert}1A`,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  rolesCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  rolesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rolesHead: {
    backgroundColor: colors.background,
  },
  rolesHeadText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rolesActionText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  rolesCellText: {
    width: 60,
    textAlign: 'center',
    fontSize: 13,
    color: colors.text,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  tipBold: {
    fontWeight: '700',
  },
});
