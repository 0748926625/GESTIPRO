import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';

type Mode = 'connexion' | 'inscription';

export function ConnexionEtablissementScreen(): React.JSX.Element {
  const session = useSessionStore((s) => s.session);
  const inscrire = useSessionStore((s) => s.inscrire);
  const connecter = useSessionStore((s) => s.connecter);
  const completerEtablissement = useSessionStore((s) => s.completerEtablissement);
  const deconnecter = useSessionStore((s) => s.deconnecter);

  const [mode, setMode] = useState<Mode>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nomMaquis, setNomMaquis] = useState('');
  const [chargement, setChargement] = useState(false);
  const [confirmationRequise, setConfirmationRequise] = useState(false);

  const handleSoumettre = async (): Promise<void> => {
    if (!email.trim() || motDePasse.length < 6) {
      Alert.alert('Erreur', 'Entrez un email valide et un mot de passe d\'au moins 6 caractères.');
      return;
    }
    setChargement(true);
    try {
      if (mode === 'inscription') {
        const { confirmationRequise: requise } = await inscrire(email.trim(), motDePasse);
        if (requise) {
          setConfirmationRequise(true);
          setMode('connexion');
        }
      } else {
        await connecter(email.trim(), motDePasse);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setChargement(false);
    }
  };

  const handleCompleter = async (): Promise<void> => {
    if (!nomMaquis.trim()) {
      Alert.alert('Erreur', 'Le nom du maquis est requis.');
      return;
    }
    setChargement(true);
    try {
      await completerEtablissement(nomMaquis.trim());
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setChargement(false);
    }
  };

  if (session) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.logo}>
              <Ionicons name="storefront-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Bienvenue !</Text>
            <Text style={styles.subtitle}>
              Dernière étape : donnez un nom à votre établissement pour terminer la création de
              votre compte.
            </Text>

            <Text style={styles.label}>Nom du maquis</Text>
            <TextInput
              style={styles.input}
              value={nomMaquis}
              onChangeText={setNomMaquis}
              placeholder="Ex: Chez Tantie Awa"
              autoFocus
            />

            <TouchableOpacity style={styles.bouton} onPress={handleCompleter} disabled={chargement}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.boutonTexte}>{chargement ? 'Création...' : 'Créer mon établissement'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.lienRetour} onPress={() => deconnecter()}>
              <Text style={styles.lienRetourTexte}>Se déconnecter</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <LinearGradient
            colors={[colors.primary, colors.accentRouge]}
            style={styles.logo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="storefront-outline" size={40} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>GestiPro</Text>
          <Text style={styles.subtitle}>
            {mode === 'connexion' ? 'Connectez-vous à votre établissement' : 'Créez votre établissement'}
          </Text>

          {confirmationRequise && (
            <View style={styles.infoBox}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={styles.infoTexte}>
                Un email de confirmation a été envoyé. Confirmez votre compte puis connectez-vous
                ci-dessous.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={motDePasse}
            onChangeText={setMotDePasse}
            placeholder="Au moins 6 caractères"
            secureTextEntry
          />

          <TouchableOpacity style={styles.bouton} onPress={handleSoumettre} disabled={chargement}>
            <Ionicons
              name={mode === 'connexion' ? 'log-in-outline' : 'person-add-outline'}
              size={18}
              color="#FFF"
            />
            <Text style={styles.boutonTexte}>
              {chargement ? 'Patientez...' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lienRetour}
            onPress={() => setMode(mode === 'connexion' ? 'inscription' : 'connexion')}
          >
            <Text style={styles.lienRetourTexte}>
              {mode === 'connexion'
                ? "Pas encore de compte ? Créer un établissement"
                : 'Déjà un compte ? Se connecter'}
            </Text>
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
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...cardShadow,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTexte: {
    flex: 1,
    fontSize: 13,
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
  bouton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  boutonTexte: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  lienRetour: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  lienRetourTexte: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
