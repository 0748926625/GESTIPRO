import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const db: SQLiteDatabase = openDatabaseSync('gestipro.db');

const SCHEMA_VERSION = 2;

export async function migrate(): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      cle TEXT PRIMARY KEY,
      valeur TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ valeur: string }>(
    "SELECT valeur FROM app_meta WHERE cle = 'schema_version'"
  );
  const versionActuelle = row ? Number(row.valeur) : 0;

  if (versionActuelle < SCHEMA_VERSION) {
    await reinitialiserSchema();
    await db.runAsync(
      `INSERT INTO app_meta (cle, valeur) VALUES ('schema_version', ?)
       ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur`,
      [String(SCHEMA_VERSION)]
    );
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clotures (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      periode_debut TEXT NOT NULL,
      periode_fin TEXT NOT NULL,
      chiffre_affaires REAL NOT NULL DEFAULT 0,
      nombre_ventes INTEGER NOT NULL DEFAULT 0,
      marge REAL NOT NULL DEFAULT 0,
      recettes_diverses REAL NOT NULL DEFAULT 0,
      depenses REAL NOT NULL DEFAULT 0,
      resultat_net REAL NOT NULL DEFAULT 0,
      top_produits TEXT NOT NULL DEFAULT '[]',
      repartition_paiement TEXT NOT NULL DEFAULT '[]',
      user_id TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clotures_periode_fin ON clotures(periode_fin);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS fournisseurs (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      telephone TEXT NOT NULL DEFAULT '',
      actif INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function getMeta(cle: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ valeur: string }>(
    'SELECT valeur FROM app_meta WHERE cle = ?',
    [cle]
  );
  return row?.valeur ?? null;
}

export async function setMeta(cle: string, valeur: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_meta (cle, valeur) VALUES (?, ?)
     ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur`,
    [cle, valeur]
  );
}

async function reinitialiserSchema(): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS vente_lignes;
    DROP TABLE IF EXISTS ventes;
    DROP TABLE IF EXISTS mouvements_stock;
    DROP TABLE IF EXISTS operations_caisse;
    DROP TABLE IF EXISTS produits;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS etablissement;

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('gerant','serveur')),
      actif INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE produits (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      categorie TEXT NOT NULL DEFAULT '',
      unite TEXT NOT NULL DEFAULT '',
      quantite_stock REAL NOT NULL DEFAULT 0,
      seuil_alerte REAL NOT NULL DEFAULT 0,
      prix_achat REAL NOT NULL DEFAULT 0,
      prix_vente REAL NOT NULL DEFAULT 0,
      actif INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE mouvements_stock (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      produit_id TEXT NOT NULL REFERENCES produits(id),
      type TEXT NOT NULL CHECK (type IN ('entree','sortie','ajustement')),
      quantite REAL NOT NULL,
      motif TEXT NOT NULL DEFAULT '',
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE ventes (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      total REAL NOT NULL,
      mode_paiement TEXT NOT NULL DEFAULT 'especes',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE vente_lignes (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      vente_id TEXT NOT NULL REFERENCES ventes(id),
      produit_id TEXT NOT NULL REFERENCES produits(id),
      quantite REAL NOT NULL,
      prix_unitaire_vente REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE operations_caisse (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('recette','depense')),
      categorie TEXT NOT NULL,
      montant REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE etablissement (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL DEFAULT 'GestiPro',
      logo_uri TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX idx_mouvements_produit ON mouvements_stock(produit_id);
    CREATE INDEX idx_ventes_date ON ventes(date);
    CREATE INDEX idx_vente_lignes_vente ON vente_lignes(vente_id);
    CREATE INDEX idx_vente_lignes_produit ON vente_lignes(produit_id);
    CREATE INDEX idx_operations_date ON operations_caisse(date);
  `);
}
