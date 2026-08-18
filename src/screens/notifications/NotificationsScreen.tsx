import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { EmptyState } from '../../components/EmptyState';
import { getNotifications, marquerNotificationsLues } from '../../db/notifications';
import { cardShadow, colors, spacing } from '../../theme';
import type { Notification, TypeNotification } from '../../types';

const ICONES: Record<TypeNotification, keyof typeof Ionicons.glyphMap> = {
  stock: 'cube-outline',
  depense: 'arrow-down-circle-outline',
  recette: 'arrow-up-circle-outline',
};

const COULEURS: Record<TypeNotification, string> = {
  stock: colors.accentBleu,
  depense: colors.danger,
  recette: colors.success,
};

const FONDS: Record<TypeNotification, string> = {
  stock: `${colors.accentBleu}1A`,
  depense: colors.dangerBg,
  recette: colors.successBg,
};

export function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useFocusEffect(
    useCallback(() => {
      getNotifications().then(setNotifications);
      marquerNotificationsLues();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BackHeader title="Notifications" onBack={() => navigation.goBack()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Aucune notification pour l'instant." />}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.lue && styles.cardNonLue]}>
            <View style={[styles.icon, { backgroundColor: FONDS[item.type] }]}>
              <Ionicons name={ICONES[item.type]} size={20} color={COULEURS[item.type]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.titre}>{item.titre}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.meta}>
                {format(new Date(item.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
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
  cardNonLue: {
    borderColor: colors.primary,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  titre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  message: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
