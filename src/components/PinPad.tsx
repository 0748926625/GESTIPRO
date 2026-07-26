import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';

interface PinPadProps {
  pinLength: number;
  value: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinPad({ pinLength, value, onDigit, onBackspace }: PinPadProps): React.JSX.Element {
  return (
    <View>
      <View style={styles.dots}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((key, i) => {
          if (key === '') {
            return <View key={i} style={styles.key} />;
          }
          const isBackspace = key === '⌫';
          return (
            <TouchableOpacity
              key={i}
              style={styles.key}
              disabled={isBackspace && value.length === 0}
              onPress={() => (isBackspace ? onBackspace() : onDigit(key))}
            >
              {isBackspace ? (
                <Ionicons name="backspace-outline" size={24} color={colors.textMuted} />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 3 * 76,
    alignSelf: 'center',
  },
  key: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    color: colors.text,
    fontWeight: '600',
  },
});
