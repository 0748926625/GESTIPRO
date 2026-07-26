import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from '../../components/PinPad';
import { getActiveUsers, verifyPin } from '../../db/users';
import { useAuthStore } from '../../store/authStore';
import { useEtablissementStore } from '../../store/etablissementStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { User } from '../../types';

const PIN_LENGTH = 4;

export function LoginScreen(): React.JSX.Element {
  const login = useAuthStore((s) => s.login);
  const nomMaquis = useEtablissementStore((s) => s.nom);
  const logoUri = useEtablissementStore((s) => s.logoUri);
  const [users, setUsers] = useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const loadUsers = useCallback(() => {
    getActiveUsers().then(setUsers);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSelectUser = (user: User): void => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  };

  const handleDigit = (digit: string): void => {
    if (checking || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError(null);
    if (next.length === PIN_LENGTH && selectedUser) {
      setChecking(true);
      verifyPin(selectedUser.id, next).then((ok) => {
        setChecking(false);
        if (ok) {
          login(selectedUser);
        } else {
          setError('Code PIN incorrect');
          setPin('');
        }
      });
    }
  };

  const handleBackspace = (): void => {
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  if (users === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoImage} />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accentRouge]}
            style={styles.logo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="storefront-outline" size={40} color="#FFF" />
          </LinearGradient>
        )}
        <Text style={styles.title}>{nomMaquis}</Text>
        <Text style={styles.subtitle}>Qui êtes-vous ?</Text>
        <View style={styles.userList}>
          {users.map((user) => (
            <TouchableOpacity key={user.id} style={styles.userCard} onPress={() => handleSelectUser(user)}>
              <View style={styles.userAvatar}>
                <Ionicons
                  name={user.role === 'gerant' ? 'person-outline' : 'person-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.nom}</Text>
                <Text style={styles.userRole}>{user.role === 'gerant' ? 'Gérant' : 'Serveur'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{selectedUser.nom}</Text>
      <Text style={styles.subtitle}>Entrez votre code PIN</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <PinPad pinLength={PIN_LENGTH} value={pin} onDigit={handleDigit} onBackspace={handleBackspace} />
      <TouchableOpacity style={styles.back} onPress={() => setSelectedUser(null)}>
        <Text style={styles.backText}>Changer d'utilisateur</Text>
      </TouchableOpacity>
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
  logoImage: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  userList: {
    gap: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  back: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
  },
});
