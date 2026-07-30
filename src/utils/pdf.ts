import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getModePaiementInfo } from '../data/modesPaiement';
import type { ProduitVendu, RepartitionModePaiement, VenteAvecLignes } from '../types';

interface Etablissement {
  nom: string;
  logoUri: string | null;
}

export interface FichierPdf {
  uri: string;
  nomFichier: string;
}

function formatMontant(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} F`;
}

function enteteHtml(etablissement: Etablissement, titre: string): string {
  const logo = etablissement.logoUri
    ? `<img src="${etablissement.logoUri}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;" />`
    : '';
  return `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
      ${logo}
      <div>
        <div style="font-size:22px;font-weight:700;color:#1C1917;">${etablissement.nom}</div>
        <div style="font-size:14px;color:#78716C;">${titre}</div>
      </div>
    </div>
  `;
}

const STYLE_BASE = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1C1917; padding: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 8px 4px; font-size: 13px; }
  th { color: #78716C; border-bottom: 2px solid #E7E2D8; font-weight: 600; }
  td { border-bottom: 1px solid #E7E2D8; }
  .total-row td { font-weight: 700; font-size: 15px; border-bottom: none; border-top: 2px solid #1C1917; padding-top: 12px; }
  .meta { color: #78716C; font-size: 13px; margin-bottom: 4px; }
`;

export async function genererRecuVente(
  vente: VenteAvecLignes,
  etablissement: Etablissement
): Promise<FichierPdf> {
  const lignesHtml = vente.lignes
    .map(
      (l) => `
      <tr>
        <td>${l.nomProduit}</td>
        <td>${l.quantite}</td>
        <td>${formatMontant(l.prixUnitaireVente)}</td>
        <td>${formatMontant(l.quantite * l.prixUnitaireVente)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <html>
      <head><meta charset="utf-8" /><style>${STYLE_BASE}</style></head>
      <body>
        ${enteteHtml(etablissement, 'Reçu de vente')}
        <div class="meta">Date : ${format(new Date(vente.date), 'dd MMMM yyyy, HH:mm', { locale: fr })}</div>
        <div class="meta">Vendeur : ${vente.nomUser}</div>
        <div class="meta">Mode de paiement : ${getModePaiementInfo(vente.modePaiement).label}</div>
        <div class="meta">Vente n° ${vente.id}</div>
        <table>
          <thead>
            <tr><th>Produit</th><th>Qté</th><th>Prix unitaire</th><th>Sous-total</th></tr>
          </thead>
          <tbody>
            ${lignesHtml}
            <tr class="total-row"><td colspan="3">Total</td><td>${formatMontant(vente.total)}</td></tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return { uri, nomFichier: `recu-vente-${vente.id}.pdf` };
}

interface RapportExportParams {
  periodeLabel: string;
  nombreVentes: number;
  chiffreAffaires: number;
  marge: number;
  recettesDiverses: number;
  depenses: number;
  resultatNet: number;
  topProduits: ProduitVendu[];
  repartitionPaiement: RepartitionModePaiement[];
  etablissement: Etablissement;
}

export async function genererRapportPdf(params: RapportExportParams): Promise<FichierPdf> {
  const {
    periodeLabel,
    nombreVentes,
    chiffreAffaires,
    marge,
    recettesDiverses,
    depenses,
    resultatNet,
    topProduits,
    repartitionPaiement,
    etablissement,
  } = params;

  const lignesHtml = topProduits
    .map(
      (p, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${p.nom}</td>
        <td>${p.quantiteVendue}</td>
        <td>${formatMontant(p.chiffreAffaires)}</td>
      </tr>
    `
    )
    .join('');

  const paiementHtml = repartitionPaiement
    .map(
      (r) => `
      <tr>
        <td>${getModePaiementInfo(r.modePaiement).label}</td>
        <td>${r.nombreVentes}</td>
        <td>${formatMontant(r.total)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <html>
      <head><meta charset="utf-8" /><style>${STYLE_BASE}</style></head>
      <body>
        ${enteteHtml(etablissement, `Rapport — ${periodeLabel}`)}
        <div class="meta">Généré le ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: fr })}</div>
        <table>
          <tbody>
            <tr><td style="font-weight:600;">Nombre de ventes</td><td>${nombreVentes}</td></tr>
            <tr><td style="font-weight:600;">Chiffre d'affaires</td><td>${formatMontant(chiffreAffaires)}</td></tr>
            <tr><td style="font-weight:600;">Marge sur ventes</td><td>${formatMontant(marge)}</td></tr>
            <tr><td style="font-weight:600;">Recettes diverses</td><td>+${formatMontant(recettesDiverses)}</td></tr>
            <tr><td style="font-weight:600;">Dépenses (salaires, loyer...)</td><td>-${formatMontant(depenses)}</td></tr>
            <tr class="total-row"><td>Résultat net</td><td>${formatMontant(resultatNet)}</td></tr>
          </tbody>
        </table>
        <h3 style="margin-top:24px;">Répartition par mode de paiement</h3>
        <table>
          <thead>
            <tr><th>Mode</th><th>Ventes</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${paiementHtml || '<tr><td colspan="3">Aucune vente sur cette période</td></tr>'}
          </tbody>
        </table>
        <h3 style="margin-top:24px;">Produits les plus vendus</h3>
        <table>
          <thead>
            <tr><th>#</th><th>Produit</th><th>Qté vendue</th><th>Chiffre d'affaires</th></tr>
          </thead>
          <tbody>
            ${lignesHtml || '<tr><td colspan="4">Aucune vente sur cette période</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return { uri, nomFichier: `rapport-${periodeLabel}.pdf` };
}

export async function partagerPdf(fichier: FichierPdf): Promise<void> {
  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(fichier.uri, { mimeType: 'application/pdf', dialogTitle: fichier.nomFichier });
  }
}

const CLE_DOSSIER_TELECHARGEMENT = 'gestipro_dossier_telechargement_uri';

export async function telechargerPdf(fichier: FichierPdf): Promise<'telecharge' | 'partage' | 'annule'> {
  if (Platform.OS === 'web') {
    const lien = document.createElement('a');
    lien.href = fichier.uri;
    lien.download = fichier.nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    return 'telecharge';
  }
  if (Platform.OS !== 'android') {
    await partagerPdf(fichier);
    return 'partage';
  }

  const { StorageAccessFramework } = FileSystem;
  let dossierUri = await AsyncStorage.getItem(CLE_DOSSIER_TELECHARGEMENT);

  if (!dossierUri) {
    const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) return 'annule';
    dossierUri = permission.directoryUri;
    await AsyncStorage.setItem(CLE_DOSSIER_TELECHARGEMENT, dossierUri);
  }

  const base64 = await FileSystem.readAsStringAsync(fichier.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    const nouveauFichierUri = await StorageAccessFramework.createFileAsync(
      dossierUri,
      fichier.nomFichier,
      'application/pdf'
    );
    await FileSystem.writeAsStringAsync(nouveauFichierUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return 'telecharge';
  } catch (e) {
    // Le dossier précédemment choisi n'est peut-être plus accessible : on redemande la prochaine fois.
    await AsyncStorage.removeItem(CLE_DOSSIER_TELECHARGEMENT);
    throw e;
  }
}
