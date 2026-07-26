import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { cardShadow, colors, spacing, withOpacity } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  accent?: 'danger' | 'success';
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function StatCard({ label, value, accent, icon, iconColor }: StatCardProps): React.JSX.Element {
  const valueColor =
    accent === 'danger' ? colors.danger : accent === 'success' ? colors.success : colors.text;
  const couleur = iconColor ?? colors.primary;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: withOpacity(couleur, 0.14) }]}>
            <Ionicons name={icon} size={14} color={couleur} />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
});
