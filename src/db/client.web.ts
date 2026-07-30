import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

// Variante web de client.ts (résolue automatiquement par Metro à la place de client.ts
// quand la cible est "web") : même schéma, mêmes fonctions exportées, mais le moteur
// SQLite tourne en WASM dans le navigateur (sql.js, stable, sans en-têtes serveur
// particuliers) au lieu du module natif expo-sqlite. Persisté dans IndexedDB pour
// survivre aux rechargements de page.

const NOM_INDEXEDDB = 'gestipro-web';
const STORE_INDEXEDDB = 'sqlite';
const CLE_INDEXEDDB = 'db';

let sqlJsDb: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

// Connexion IndexedDB unique, ouverte une seule fois et réutilisée pour toutes les
// lectures/écritures : en ouvrir une nouvelle à chaque appel (comme dans une version
// précédente) laissait des dizaines de connexions actives sans jamais les fermer, ce qui
// pouvait faire "geler" silencieusement les écritures suivantes sur certains navigateurs
// (observé : la validation d'une vente qui ne faisait plus rien sur Safari iOS).
let idbPromise: Promise<IDBDatabase> | null = null;

function ouvrirIndexedDB(): Promise<IDBDatabase> {
  if (!idbPromise) {
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(NOM_INDEXEDDB, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_INDEXEDDB);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return idbPromise;
}

async function chargerBytesPersistes(): Promise<Uint8Array | null> {
  const idb = await ouvrirIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_INDEXEDDB, 'readonly');
    const req = tx.objectStore(STORE_INDEXEDDB).get(CLE_INDEXEDDB);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function persister(): Promise<void> {
  // Ne jamais appeler sqlJsDb.export() au milieu d'une transaction ouverte (BEGIN sans
  // COMMIT/ROLLBACK) : ça perturbe l'état interne de sql.js et corrompt la transaction
  // en cours (observé : "cannot rollback - no transaction is active", vente qui ne
  // s'enregistrait jamais). withTransactionAsync se charge de persister une seule fois,
  // une fois la transaction bien terminée.
  if (!sqlJsDb || dansTransaction) return;
  const bytes = sqlJsDb.export();
  const idb = await ouvrirIndexedDB();
  await new Promise<void>((resolve, reject) => {
    const tx = idb.transaction(STORE_INDEXEDDB, 'readwrite');
    tx.objectStore(STORE_INDEXEDDB).put(bytes, CLE_INDEXEDDB);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function ensureDb(): Promise<SqlJsDatabase> {
  if (sqlJsDb) return sqlJsDb;
  if (!initPromise) {
    initPromise = (async () => {
      const SQL = await initSqlJs({ locateFile: (file) => new URL(file, document.baseURI).href });
      const bytesExistants = await chargerBytesPersistes().catch(() => null);
      sqlJsDb = bytesExistants ? new SQL.Database(bytesExistants) : new SQL.Database();
      return sqlJsDb;
    })();
  }
  return initPromise;
}

async function runBrut(sql: string, params: unknown[] = []): Promise<void> {
  const database = await ensureDb();
  database.run(sql, params as never);
}

async function getFirstBrut<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const database = await ensureDb();
  const stmt = database.prepare(sql);
  stmt.bind(params as never);
  const trouve = stmt.step();
  const resultat = trouve ? ((stmt.getAsObject() as unknown) as T) : null;
  stmt.free();
  return resultat;
}

async function getAllBrut<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const database = await ensureDb();
  const stmt = database.prepare(sql);
  stmt.bind(params as never);
  const lignes: T[] = [];
  while (stmt.step()) {
    lignes.push((stmt.getAsObject() as unknown) as T);
  }
  stmt.free();
  return lignes;
}

// File d'attente qui sérialise toutes les opérations sur la base : sql.js n'a qu'une
// seule connexion partagée, donc deux appels concurrents (ex: une vente en cours et la
// synchro en tâche de fond qui se déclenche au même moment) pouvaient entremêler leurs
// BEGIN/COMMIT/ROLLBACK et corrompre l'état de la transaction — observé en conditions
// réelles : "cannot rollback - no transaction is active" et la vente qui ne s'enregistrait
// jamais. `dansTransaction` évite l'interblocage : les appels imbriqués depuis le callback
// de withTransactionAsync s'exécutent directement au lieu de rejoindre la file (qui,
// elle, attend justement la fin de cette même transaction).
let cola: Promise<void> = Promise.resolve();
let dansTransaction = false;

function enqueue<T>(tache: () => Promise<T>): Promise<T> {
  if (dansTransaction) return tache();
  const resultat = cola.then(tache, tache);
  cola = resultat.then(
    () => undefined,
    () => undefined
  );
  return resultat;
}

export const db = {
  execAsync: (sql: string): Promise<void> =>
    enqueue(async () => {
      const database = await ensureDb();
      database.run(sql);
      await persister();
    }),

  runAsync: (sql: string, params: unknown[] = []): Promise<void> =>
    enqueue(async () => {
      await runBrut(sql, params);
      await persister();
    }),

  getFirstAsync: <T>(sql: string, params: unknown[] = []): Promise<T | null> =>
    enqueue(() => getFirstBrut<T>(sql, params)),

  getAllAsync: <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
    enqueue(() => getAllBrut<T>(sql, params)),

  withTransactionAsync: (callback: () => Promise<void>): Promise<void> =>
    enqueue(async () => {
      const database = await ensureDb();
      dansTransaction = true;
      try {
        database.run('BEGIN TRANSACTION;');
        try {
          await callback();
          database.run('COMMIT;');
        } catch (e) {
          database.run('ROLLBACK;');
          throw e;
        }
      } finally {
        dansTransaction = false;
      }
      await persister();
    }),
};

const SCHEMA_VERSION = 2;

export async function migrate(): Promise<void> {
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

  const colonnesEtablissement = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(etablissement)'
  );
  if (!colonnesEtablissement.some((c) => c.name === 'secteur')) {
    await db.execAsync(`ALTER TABLE etablissement ADD COLUMN secteur TEXT NOT NULL DEFAULT 'maquis';`);
  }
  if (!colonnesEtablissement.some((c) => c.name === 'essai_fin')) {
    await db.execAsync(`ALTER TABLE etablissement ADD COLUMN essai_fin TEXT;`);
  }
  if (!colonnesEtablissement.some((c) => c.name === 'abonnement_actif')) {
    await db.execAsync(`ALTER TABLE etablissement ADD COLUMN abonnement_actif INTEGER NOT NULL DEFAULT 0;`);
  }

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

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS laveurs (
      id TEXT PRIMARY KEY,
      etablissement_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      taux_commission REAL NOT NULL DEFAULT 0,
      actif INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);

  const colonnesVentes = await db.getAllAsync<{ name: string }>('PRAGMA table_info(ventes)');
  if (!colonnesVentes.some((c) => c.name === 'laveur_id')) {
    await db.execAsync(`ALTER TABLE ventes ADD COLUMN laveur_id TEXT;`);
  }
  if (!colonnesVentes.some((c) => c.name === 'commission_montant')) {
    await db.execAsync(`ALTER TABLE ventes ADD COLUMN commission_montant REAL;`);
  }
}

export async function viderDonneesEtablissement(): Promise<void> {
  await db.execAsync(`
    DELETE FROM vente_lignes;
    DELETE FROM ventes;
    DELETE FROM mouvements_stock;
    DELETE FROM operations_caisse;
    DELETE FROM clotures;
    DELETE FROM fournisseurs;
    DELETE FROM laveurs;
    DELETE FROM produits;
    DELETE FROM users;
    DELETE FROM etablissement;
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
