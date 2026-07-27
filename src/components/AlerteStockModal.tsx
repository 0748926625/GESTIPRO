import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { getFournisseurs } from '../db/fournisseurs';
import { useAlerteStockStore } from '../store/alerteStockStore';
import { cardShadow, colors, spacing, withOpacity } from '../theme';
import type { Fournisseur } from '../types';

export function AlerteStockModal(): React.JSX.Element {
  const produit = useAlerteStockStore((s) => s.produitEnAlerte);
  const fermer = useAlerteStockStore((s) => s.fermer);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

  useEffect(() => {
    if (produit) {
      getFournisseurs().then(setFournisseurs);
    }
  }, [produit]);

  const handleFermer = (): void => {
    Vibration.cancel();
    fermer();
  };

  const handleAppeler = (telephone: string): void => {
    Linking.openURL(`tel:${telephone}`);
  };

  const handleWhatsApp = (telephone: string): void => {
    Linking.openURL(`https://wa.me/${telephone.replace(/[^0-9]/g, '')}`);
  };

  return (
    <Modal visible={!!produit} transparent animationType="fade" onRequestClose={handleFermer}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={28} color={colors.danger} />
          </View>
          <Text style={styles.titre}>Stock bas</Text>
          {produit && (
            <Text style={styles.message}>
              <Text style={styles.produitNom}>{produit.nom}</Text> : il ne reste que{' '}
              {produit.quantiteStock} {produit.unite} (seuil : {produit.seuilAlerte} {produit.unite})
            </Text>
          )}

          {fournisseurs.length > 0 ? (
            <>
              <Text style={styles.sectionTitre}>Contacter un fournisseur</Text>
              {fournisseurs.map((f) => (
                <View key={f.id} style={styles.fournisseurRow}>
                  <View style={styles.fournisseurInfo}>
                    <Text style={styles.fournisseurNom}>{f.nom}</Text>
                    <Text style={styles.fournisseurTel}>{f.telephone}</Text>
                  </View>
                  <View style={styles.fournisseurActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleAppeler(f.telephone)}
                    >
                      <Ionicons name="call-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleWhatsApp(f.telephone)}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={colors.success} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.aucunFournisseur}>
              Aucun fournisseur enregistré. Ajoutez-en dans Paramètres pour les appeler directement
              depuis cette alerte.
            </Text>
          )}

          <TouchableOpacity style={styles.fermerBtn} onPress={handleFermer}>
            <Text style={styles.fermerBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 21, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...cardShadow,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titre: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  produitNom: {
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitre: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fournisseurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  fournisseurInfo: {
    flex: 1,
  },
  fournisseurNom: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fournisseurTel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  fournisseurActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withOpacity(colors.primary, 0.08),
  },
  aucunFournisseur: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fermerBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  fermerBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
