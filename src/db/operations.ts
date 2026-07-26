import * as Crypto from 'expo-crypto';
import { db } from './client';
import { supabase } from '../lib/supabase';
import type { OperationCaisse, TypeOperation } from '../types';

interface OperationRow {
  id: string;
  type: string;
  categorie: string;
  montant: number;
  description: string;
  user_id: string;
  date: string;
  nom_user: string;
}

function mapOperation(row: OperationRow): OperationCaisse {
  return {
    id: row.id,
    type: row.type as TypeOperation,
    categorie: row.categorie,
    montant: row.montant,
    description: row.description,
    userId: row.user_id,
    nomUser: row.nom_user,
    date: row.date,
  };
}

export interface OperationInput {
  type: TypeOperation;
  categorie: string;
  montant: number;
  description: string;
  userId: string;
}

export async function creerOperation(etablissementId: string, input: OperationInput): Promise<void> {
  const date = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO operations_caisse (id, etablissement_id, type, categorie, montant, description, user_id, date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [Crypto.randomUUID(), etablissementId, input.type, input.categorie, input.montant, input.description, input.userId, date, date]
  );
}

export async function getOperations(limit = 100): Promise<OperationCaisse[]> {
  const rows = await db.getAllAsync<OperationRow>(
    `SELECT oc.*, u.nom as nom_user FROM operations_caisse oc
     JOIN users u ON u.id = oc.user_id
     ORDER BY oc.date DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapOperation);
}

export async function supprimerOperation(id: string): Promise<void> {
  await db.runAsync('DELETE FROM operations_caisse WHERE id = ?', [id]);
  try {
    await supabase.from('operations_caisse').delete().eq('id', id);
  } catch {
    // Best effort : si hors ligne, la suppression distante sera manquée.
  }
}

export async function getTotalParType(
  depuisISO: string,
  type: TypeOperation,
  jusquISO?: string
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(montant) as total FROM operations_caisse WHERE date >= ? AND type = ? ${jusquISO ? 'AND date < ?' : ''}`,
    jusquISO ? [depuisISO, type, jusquISO] : [depuisISO, type]
  );
  return row?.total ?? 0;
}
