import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export function BackHeader({ title, onBack }: BackHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginLeft: spacing.xs,
  },
});
