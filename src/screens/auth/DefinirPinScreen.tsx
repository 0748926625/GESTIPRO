import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from '../../components/PinPad';
import { createUser } from '../../db/users';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';

const PIN_LENGTH = 4;

interface DefinirPinScreenProps {
  onTermine: () => void;
}

export function DefinirPinScreen({ onTermine }: DefinirPinScreenProps): React.JSX.Element {
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const [etape, setEtape] = useState<'saisie' | 'confirmation'>('saisie');
  const [pin, setPin] = useState('');
  const [premierPin, setPremierPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const reinitialiser = (): void => {
    setEtape('saisie');
    setPin('');
    setPremierPin('');
  };

  const handleDigit = (digit: string): void => {
    if (enregistrement || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError(null);
    if (next.length !== PIN_LENGTH) return;

    if (etape === 'saisie') {
      setPremierPin(next);
      setPin('');
      setEtape('confirmation');
      return;
    }

    if (next !== premierPin) {
      setError('Les deux codes ne correspondent pas. Recommencez.');
      reinitialiser();
      return;
    }

    if (!etablissementId) return;
    setEnregistrement(true);
    createUser(etablissementId, 'Gérant', next, 'gerant')
      .then(onTermine)
      .catch(() => {
        setEnregistrement(false);
        setError("Impossible d'enregistrer le code, réessayez.");
        reinitialiser();
      });
  };

  const handleBackspace = (): void => {
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accentRouge]}
        style={styles.logo}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="key-outline" size={36} color="#FFF" />
      </LinearGradient>
      <Text style={styles.title}>Bienvenue sur GestiPro</Text>
      <Text style={styles.subtitle}>
        {etape === 'saisie'
          ? 'Choisissez votre code PIN à 4 chiffres pour le compte Gérant'
          : 'Confirmez votre code PIN'}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <PinPad pinLength={PIN_LENGTH} value={pin} onDigit={handleDigit} onBackspace={handleBackspace} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
    fontSize: 24,
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
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
