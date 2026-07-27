import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../../store/sessionStore';
import { cardShadow, colors, spacing } from '../../theme';

export function AbonnementExpireScreen(): React.JSX.Element {
  const deconnecter = useSessionStore((s) => s.deconnecter);

  const handleAppeler = (): void => {
    Linking.openURL('tel:+2250748926625');
  };

  const handleWhatsApp = (): void => {
    Linking.openURL('https://wa.me/2250748926625');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.titre}>Période d'essai terminée</Text>
        <Text style={styles.texte}>
          Votre essai gratuit de 7 jours est arrivé à son terme. Contactez-nous pour activer votre
          abonnement et retrouver l'accès à GestiPro.
        </Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.supportBtn} onPress={handleAppeler}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.supportBtnText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
            <Text style={[styles.supportBtnText, { color: colors.success }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.numero}>+225 07 48 92 66 25</Text>

        <TouchableOpacity style={styles.deconnecterBtn} onPress={() => deconnecter()}>
          <Text style={styles.deconnecterTexte}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titre: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  texte: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  supportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  numero: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  deconnecterBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  deconnecterTexte: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
