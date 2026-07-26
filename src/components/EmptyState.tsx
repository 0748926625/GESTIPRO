import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={32} color={colors.textMuted} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
