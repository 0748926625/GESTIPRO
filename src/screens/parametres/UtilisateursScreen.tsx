import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSecteurConfig } from '../../data/secteurs';
import { saveEtablissement } from '../../db/etablissement';
import { createFournisseur, getFournisseurs, setFournisseurActif } from '../../db/fournisseurs';
import { createLaveur, getLaveurs, setLaveurActif } from '../../db/laveurs';
import { createUser, getAllUsers, setUserActive, updateUserPin } from '../../db/users';
import { getDerniereSynchro, synchroniser } from '../../sync';
import { diagnostiquerSyncProduits } from '../../sync/debug';
import type { ParametresStackParamList } from '../../navigation/ParametresStack';
import { useAuthStore } from '../../store/authStore';
import { useEtablissementStore } from '../../store/etablissementStore';
import { useRealtimeStatusStore } from '../../store/realtimeStatusStore';
import type { StatutTempsReel } from '../../store/realtimeStatusStore';
import { useSessionStore } from '../../store/sessionStore';
import { useSyncErrorStore } from '../../store/syncErrorStore';
import { cardShadow, colors, spacing } from '../../theme';
import type { Fournisseur, Laveur, Role, User } from '../../types';

type Nav = NativeStackNavigationProp<ParametresStackParamList, 'ParametresHome'>;

const LABELS_TEMPS_REEL: Record<StatutTempsReel, string> = {
  inactif: 'inactif',
  connexion: 'connexion...',
  connecte: 'connecté',
  erreur: 'erreur',
  ferme: 'fermé',
};

const COULEURS_TEMPS_REEL: Record<StatutTempsReel, string> = {
  inactif: colors.textMuted,
  connexion: colors.accentJaune,
  connecte: colors.success,
  erreur: colors.danger,
  ferme: colors.danger,
};

async function copierLogoLocalement(sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') return sourceUri;
  const dest = `${FileSystem.documentDirectory}logo-maquis.jpg`;
  const info = await FileSystem.getInfoAsync(dest);
  if (info.exists) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return `${dest}?t=${Date.now()}`;
}

export function UtilisateursScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const etablissements = useSessionStore((s) => s.etablissements);
  const nomMaquisActuel = useEtablissementStore((s) => s.nom);
  const logoActuel = useEtablissementStore((s) => s.logoUri);
  const secteur = useEtablissementStore((s) => s.secteur);
  const secteurConfig = getSecteurConfig(secteur);
  const setEtablissement = useEtablissementStore((s) => s.set);
  const [users, setUsers] = useState<User[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [nomFournisseur, setNomFournisseur] = useState('');
  const [telephoneFournisseur, setTelephoneFournisseur] = useState('');
  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [nomLaveur, setNomLaveur] = useState('');
  const [tauxCommissionLaveur, setTauxCommissionLaveur] = useState('');
  const [nomMaquis, setNomMaquis] = useState(nomMaquisActuel);
  const [logoUri, setLogoUri] = useState<string | null>(logoActuel);
  const [enregistrementEtablissement, setEnregistrementEtablissement] = useState(false);
  const [nom, setNom] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<Role>('serveur');
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [pinModifie, setPinModifie] = useState('');
  const [syncEnCours, setSyncEnCours] = useState(false);
  const [derniereSynchro, setDerniereSynchro] = useState<string | null>(null);
  const statutTempsReel = useRealtimeStatusStore((s) => s.statut);
  const dernierEvenementTempsReel = useRealtimeStatusStore((s) => s.dernierEvenement);
  const erreurTempsReel = useRealtimeStatusStore((s) => s.derniereErreur);
  const derniereErreurSync = useSyncErrorStore((s) => s.derniereErreur);

  const reload = useCallback(() => {
    getAllUsers().then(setUsers);
    getFournisseurs(false).then(setFournisseurs);
    getLaveurs(false).then(setLaveurs);
    getDerniereSynchro().then(setDerniereSynchro);
  }, []);

  useFocusEffect(reload);

  const handleSynchroniser = async (): Promise<void> => {
    if (!etablissementId) return;
    setSyncEnCours(true);
    try {
      await synchroniser(etablissementId);
      reload();
      Alert.alert('Synchronisation réussie', 'Les données ont été mises à jour.');
    } catch (e) {
      Alert.alert(
        'Échec de la synchronisation',
        e instanceof Error ? e.message : 'Vérifiez votre connexion internet.'
      );
    } finally {
      setSyncEnCours(false);
    }
  };

  const handleDiagnostiquer = async (): Promise<void> => {
    try {
      const d = await diagnostiquerSyncProduits();
      Alert.alert(
        'Diagnostic stock',
        [
          `Dernier envoi réussi : ${d.dernierEnvoi ?? 'jamais'}`,
          `Produit le plus récent (local) : ${d.produitsMaxUpdatedAt ?? 'aucun'}`,
          `Produits enregistrés en local : ${d.produitsNombreTotal}`,
          `Produits qui seraient envoyés au prochain sync : ${d.produitsAPousser}`,
        ].join('\n')
      );
    } catch (e) {
      Alert.alert('Diagnostic échoué', e instanceof Error ? e.message : String(e));
    }
  };

  const handleChoisirLogo = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', "Autorisez l'accès aux photos pour choisir un logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const chemin = await copierLogoLocalement(result.assets[0].uri);
    setLogoUri(chemin);
  };

  const handleEnregistrerEtablissement = async (): Promise<void> => {
    if (!nomMaquis.trim()) {
      Alert.alert('Erreur', 'Le nom du maquis est requis.');
      return;
    }
    if (!etablissementId) return;
    setEnregistrementEtablissement(true);
    await saveEtablissement(etablissementId, nomMaquis.trim(), logoUri);
    setEtablissement(nomMaquis.trim(), logoUri);
    setEnregistrementEtablissement(false);
    Alert.alert('Enregistré', 'Les informations du maquis ont été mises à jour.');
  };

  const handleCreer = async (): Promise<void> => {
    if (!nom.trim() || pin.length !== 4) {
      Alert.alert('Erreur', 'Le nom et un code PIN à 4 chiffres sont requis.');
      return;
    }
    if (!etablissementId) return;
    try {
      await createUser(etablissementId, nom.trim(), pin, role);
      setNom('');
      setPin('');
      setRole('serveur');
      reload();
      Alert.alert('Créé', `L'utilisateur "${nom.trim()}" a bien été créé.`);
    } catch (e) {
      Alert.alert(
        "Échec de la création",
        e instanceof Error ? e.message : "L'utilisateur n'a pas pu être créé."
      );
    }
  };

  const handleToggleActif = async (user: User): Promise<void> => {
    if (user.id === currentUser?.id) {
      Alert.alert('Action impossible', "Vous ne pouvez pas désactiver votre propre compte.");
      return;
    }
    await setUserActive(user.id, !user.actif);
    reload();
  };

  const handleValiderPin = async (userId: string): Promise<void> => {
    if (pinModifie.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir 4 chiffres.');
      return;
    }
    await updateUserPin(userId, pinModifie);
    setEditingPinUserId(null);
    setPinModifie('');
    Alert.alert('Code PIN mis à jour');
  };

  const handleCreerFournisseur = async (): Promise<void> => {
    if (!nomFournisseur.trim() || !telephoneFournisseur.trim()) {
      Alert.alert('Erreur', 'Le nom et le numéro de téléphone sont requis.');
      return;
    }
    if (!etablissementId) return;
    try {
      await createFournisseur(etablissementId, nomFournisseur.trim(), telephoneFournisseur.trim());
      setNomFournisseur('');
      setTelephoneFournisseur('');
      reload();
      Alert.alert('Ajouté', `Le fournisseur "${nomFournisseur.trim()}" a bien été ajouté.`);
    } catch (e) {
      Alert.alert(
        "Échec de l'ajout",
        e instanceof Error ? e.message : "Le fournisseur n'a pas pu être ajouté."
      );
    }
  };

  const handleToggleFournisseurActif = async (fournisseur: Fournisseur): Promise<void> => {
    await setFournisseurActif(fournisseur.id, !fournisseur.actif);
    reload();
  };

  const handleCreerLaveur = async (): Promise<void> => {
    const taux = Number(tauxCommissionLaveur);
    if (!nomLaveur.trim() || !tauxCommissionLaveur.trim() || Number.isNaN(taux) || taux < 0) {
      Alert.alert('Erreur', 'Le nom et un taux de commission valide (%) sont requis.');
      return;
    }
    if (!etablissementId) return;
    const libelle = secteurConfig.libelleAgent?.toLowerCase() ?? 'laveur';
    try {
      await createLaveur(etablissementId, nomLaveur.trim(), taux);
      setNomLaveur('');
      setTauxCommissionLaveur('');
      reload();
      Alert.alert('Ajouté', `Le ${libelle} "${nomLaveur.trim()}" a bien été ajouté.`);
    } catch (e) {
      Alert.alert(
        "Échec de l'ajout",
        e instanceof Error ? e.message : `Le ${libelle} n'a pas pu être ajouté.`
      );
    }
  };

  const handleToggleLaveurActif = async (laveur: Laveur): Promise<void> => {
    await setLaveurActif(laveur.id, !laveur.actif);
    reload();
  };

  const handleAppeler = (): void => {
    Linking.openURL('tel:+2250748926625');
  };

  const handleWhatsApp = (): void => {
    Linking.openURL('https://wa.me/2250748926625');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
            <Text style={styles.title}>Paramètres</Text>
          </View>

          <TouchableOpacity
            style={styles.syncCard}
            onPress={handleSynchroniser}
            disabled={syncEnCours}
          >
            <View style={styles.syncCardLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
              <View>
                <Text style={styles.syncCardTitle}>
                  {syncEnCours ? 'Synchronisation...' : 'Synchroniser maintenant'}
                </Text>
                <Text style={styles.syncCardSubtitle}>
                  {derniereSynchro
                    ? `Dernière synchro : ${format(new Date(derniereSynchro), 'dd MMM yyyy, HH:mm', { locale: fr })}`
                    : 'Jamais synchronisé'}
                </Text>
              </View>
            </View>
            {syncEnCours ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          {derniereErreurSync && (
            <View style={[styles.syncCard, { borderColor: colors.danger }]}>
              <View style={styles.syncCardLeft}>
                <Ionicons name="warning-outline" size={20} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.syncCardTitle}>Dernière erreur de synchro</Text>
                  <Text style={styles.syncCardSubtitle}>{derniereErreurSync}</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.syncCard} onPress={handleDiagnostiquer}>
            <View style={styles.syncCardLeft}>
              <Ionicons name="bug-outline" size={20} color={colors.primary} />
              <View>
                <Text style={styles.syncCardTitle}>Diagnostic stock</Text>
                <Text style={styles.syncCardSubtitle}>Voir l'état exact de la synchro du stock</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={[styles.syncCard, { borderColor: COULEURS_TEMPS_REEL[statutTempsReel] }]}>
            <View style={styles.syncCardLeft}>
              <Ionicons
                name={statutTempsReel === 'connecte' ? 'flash' : 'flash-outline'}
                size={20}
                color={COULEURS_TEMPS_REEL[statutTempsReel]}
              />
              <View>
                <Text style={styles.syncCardTitle}>Temps réel : {LABELS_TEMPS_REEL[statutTempsReel]}</Text>
                <Text style={styles.syncCardSubtitle}>
                  {statutTempsReel === 'erreur' && erreurTempsReel
                    ? erreurTempsReel
                    : dernierEvenementTempsReel
                      ? `Dernier évènement reçu : ${format(new Date(dernierEvenementTempsReel), 'dd MMM yyyy, HH:mm:ss', { locale: fr })}`
                      : 'Aucun évènement reçu pour l\'instant'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.syncCard}
            onPress={() => navigation.navigate('Etablissements')}
          >
            <View style={styles.syncCardLeft}>
              <Ionicons name="business-outline" size={20} color={colors.primary} />
              <View>
                <Text style={styles.syncCardTitle}>Mes établissements</Text>
                <Text style={styles.syncCardSubtitle}>
                  {etablissements.length > 1
                    ? `${etablissements.length} établissements · changer ou en créer un`
                    : "Gérer plusieurs établissements avec ce compte"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Établissement</Text>
            <View style={styles.secteurBadge}>
              <Ionicons name={secteurConfig.icone} size={14} color={colors.primary} />
              <Text style={styles.secteurBadgeText}>{secteurConfig.label}</Text>
            </View>
            <TouchableOpacity style={styles.logoPicker} onPress={handleChoisirLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront-outline" size={28} color={colors.primary} />
                </View>
              )}
              <View style={styles.logoPickerInfo}>
                <Text style={styles.logoPickerText}>
                  {logoUri ? 'Changer le logo' : 'Ajouter un logo'}
                </Text>
                <Text style={styles.logoPickerSubtext}>Photo carrée recommandée</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'établissement"
              value={nomMaquis}
              onChangeText={setNomMaquis}
            />
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleEnregistrerEtablissement}
              disabled={enregistrementEtablissement}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.createButtonText}>
                {enregistrementEtablissement ? 'Enregistrement...' : "Enregistrer"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nouvel utilisateur</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom"
              value={nom}
              onChangeText={setNom}
            />
            <TextInput
              style={styles.input}
              placeholder="Code PIN (4 chiffres)"
              value={pin}
              onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              secureTextEntry
            />
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'serveur' && styles.roleButtonActive]}
                onPress={() => setRole('serveur')}
              >
                <Text style={[styles.roleText, role === 'serveur' && styles.roleTextActive]}>Serveur</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'gerant' && styles.roleButtonActive]}
                onPress={() => setRole('gerant')}
              >
                <Text style={[styles.roleText, role === 'gerant' && styles.roleTextActive]}>Gérant</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.createButton} onPress={handleCreer}>
              <Ionicons name="person-add-outline" size={18} color="#FFF" />
              <Text style={styles.createButtonText}>Créer l'utilisateur</Text>
            </TouchableOpacity>
          </View>

          {secteurConfig.stockActif && (
            <>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Nouveau fournisseur</Text>
                <Text style={styles.formSubtitle}>
                  Ces contacts apparaissent dans l'alerte de stock bas pour appeler ou écrire
                  directement.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom du fournisseur"
                  value={nomFournisseur}
                  onChangeText={setNomFournisseur}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Téléphone (ex: +225 07 00 00 00 00)"
                  value={telephoneFournisseur}
                  onChangeText={setTelephoneFournisseur}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.createButton} onPress={handleCreerFournisseur}>
                  <Ionicons name="person-add-outline" size={18} color="#FFF" />
                  <Text style={styles.createButtonText}>Ajouter le fournisseur</Text>
                </TouchableOpacity>
              </View>

              {fournisseurs.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Fournisseurs</Text>
                  {fournisseurs.map((f) => (
                    <View key={f.id} style={styles.userCard}>
                      <View style={styles.userRow}>
                        <View style={styles.userAvatar}>
                          <Ionicons name="call-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userNom}>{f.nom}</Text>
                          <Text style={styles.userRole}>
                            {f.telephone} · {f.actif ? 'Actif' : 'Désactivé'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleToggleFournisseurActif(f)}>
                          <Text style={f.actif ? styles.desactiverText : styles.activerText}>
                            {f.actif ? 'Désactiver' : 'Activer'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {secteurConfig.gestionLaveurs && (
            <>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Nouveau {secteurConfig.libelleAgent?.toLowerCase() ?? 'laveur'}</Text>
                <Text style={styles.formSubtitle}>
                  Le taux de commission s'applique automatiquement à chaque vente qui lui est
                  attribuée.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Nom du ${secteurConfig.libelleAgent?.toLowerCase() ?? 'laveur'}`}
                  value={nomLaveur}
                  onChangeText={setNomLaveur}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Taux de commission (%)"
                  value={tauxCommissionLaveur}
                  onChangeText={setTauxCommissionLaveur}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.createButton} onPress={handleCreerLaveur}>
                  <Ionicons name="person-add-outline" size={18} color="#FFF" />
                  <Text style={styles.createButtonText}>
                    Ajouter le {secteurConfig.libelleAgent?.toLowerCase() ?? 'laveur'}
                  </Text>
                </TouchableOpacity>
              </View>

              {laveurs.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>{secteurConfig.libelleAgentPluriel ?? 'Laveurs'}</Text>
                  {laveurs.map((l) => (
                    <View key={l.id} style={styles.userCard}>
                      <View style={styles.userRow}>
                        <View style={styles.userAvatar}>
                          <Ionicons name={secteurConfig.icone} size={20} color={colors.primary} />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userNom}>{l.nom}</Text>
                          <Text style={styles.userRole}>
                            Commission {l.tauxCommission}% · {l.actif ? 'Actif' : 'Désactivé'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleToggleLaveurActif(l)}>
                          <Text style={l.actif ? styles.desactiverText : styles.activerText}>
                            {l.actif ? 'Désactiver' : 'Activer'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Comptes existants</Text>
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userNom}>{user.nom}</Text>
                  <Text style={styles.userRole}>
                    {user.role === 'gerant' ? 'Gérant' : 'Serveur'} · {user.actif ? 'Actif' : 'Désactivé'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleToggleActif(user)}>
                  <Text style={user.actif ? styles.desactiverText : styles.activerText}>
                    {user.actif ? 'Désactiver' : 'Activer'}
                  </Text>
                </TouchableOpacity>
              </View>

              {editingPinUserId === user.id ? (
                <View style={styles.pinEdit}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nouveau code PIN"
                    value={pinModifie}
                    onChangeText={(t) => setPinModifie(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    secureTextEntry
                    autoFocus
                  />
                  <View style={styles.pinEditActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingPinUserId(null);
                        setPinModifie('');
                      }}
                    >
                      <Text style={styles.annulerText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleValiderPin(user.id)}>
                      <Text style={styles.validerPinText}>Valider</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.changerPinBtn} onPress={() => setEditingPinUserId(user.id)}>
                  <Ionicons name="key-outline" size={14} color={colors.primary} />
                  <Text style={styles.changerPinText}>Changer le code PIN</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <Text style={styles.sectionTitle}>Besoin d'aide ?</Text>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Contacter le service client</Text>
            <View style={styles.supportRow}>
              <TouchableOpacity style={styles.supportBtn} onPress={handleAppeler}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
                <Text style={styles.supportBtnText}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportBtn} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
                <Text style={[styles.supportBtnText, { color: colors.success }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.supportNumero}>+225 07 48 92 66 25</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  syncCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  syncCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  syncCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  syncCardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  secteurBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  secteurBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  formSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  logoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPickerInfo: {
    flex: 1,
  },
  logoPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logoPickerSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#FFF',
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userNom: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  desactiverText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  activerText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  changerPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  changerPinText: {
    color: colors.primary,
    fontSize: 13,
  },
  pinEdit: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  pinEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  annulerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  validerPinText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  supportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  supportNumero: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
