import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';

interface SelectFieldProps<T> {
  label: string;
  displayValue: string;
  placeholder: string;
  options: T[];
  keyExtractor: (item: T) => string;
  renderLabel: (item: T) => string;
  renderSubtitle?: (item: T) => string | undefined;
  onSelect: (item: T) => void;
  searchable?: boolean;
  searchPredicate?: (item: T, query: string) => boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function SelectField<T>({
  label,
  displayValue,
  placeholder,
  options,
  keyExtractor,
  renderLabel,
  renderSubtitle,
  onSelect,
  searchable,
  searchPredicate,
  icon,
}: SelectFieldProps<T>): React.JSX.Element {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');

  const optionsFiltrees =
    searchable && recherche
      ? options.filter((o) =>
          searchPredicate
            ? searchPredicate(o, recherche)
            : renderLabel(o).toLowerCase().includes(recherche.toLowerCase())
        )
      : options;

  const fermer = (): void => {
    setOuvert(false);
    setRecherche('');
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.champ} onPress={() => setOuvert(true)} activeOpacity={0.7}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.iconGauche} />}
        <Text style={[styles.valeurTexte, !displayValue && styles.placeholderTexte]} numberOfLines={1}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={ouvert} transparent animationType="slide" onRequestClose={fermer}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={fermer}>
          <View style={styles.feuille} onStartShouldSetResponder={() => true}>
            <View style={styles.feuilleHeader}>
              <Text style={styles.feuilleTitle}>{label}</Text>
              <TouchableOpacity onPress={fermer}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {searchable && (
              <View style={styles.rechercheWrapper}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.recherche}
                  placeholder="Rechercher..."
                  placeholderTextColor={colors.textMuted}
                  value={recherche}
                  onChangeText={setRecherche}
                  autoFocus
                />
              </View>
            )}
            <FlatList
              data={optionsFiltrees}
              keyExtractor={keyExtractor}
              style={styles.liste}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    fermer();
                  }}
                >
                  <Text style={styles.optionLabel}>{renderLabel(item)}</Text>
                  {renderSubtitle && renderSubtitle(item) && (
                    <Text style={styles.optionSubtitle}>{renderSubtitle(item)}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  champ: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconGauche: {
    marginRight: -spacing.xs,
  },
  valeurTexte: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholderTexte: {
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.4)',
    justifyContent: 'flex-end',
  },
  feuille: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: '75%',
  },
  feuilleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feuilleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  rechercheWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  recherche: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  liste: {
    marginBottom: spacing.lg,
  },
  option: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
