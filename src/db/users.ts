import * as Crypto from 'expo-crypto';
import { db } from './client';
import type { Role, User } from '../types';

interface UserRow {
  id: string;
  nom: string;
  pin_hash: string;
  role: string;
  actif: number;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    nom: row.nom,
    pinHash: row.pin_hash,
    role: row.role as Role,
    actif: row.actif === 1,
  };
}

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function getActiveUsers(): Promise<User[]> {
  const rows = await db.getAllAsync<UserRow>(
    'SELECT * FROM users WHERE actif = 1 ORDER BY role DESC, nom ASC'
  );
  return rows.map(mapUser);
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await db.getAllAsync<UserRow>('SELECT * FROM users ORDER BY role DESC, nom ASC');
  return rows.map(mapUser);
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!row) return false;
  const pinHash = await hashPin(pin);
  return pinHash === row.pin_hash;
}

export async function createUser(etablissementId: string, nom: string, pin: string, role: Role): Promise<void> {
  const pinHash = await hashPin(pin);
  await db.runAsync(
    'INSERT INTO users (id, etablissement_id, nom, pin_hash, role, actif, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [Crypto.randomUUID(), etablissementId, nom, pinHash, role, new Date().toISOString()]
  );
}

export async function setUserActive(userId: string, actif: boolean): Promise<void> {
  await db.runAsync('UPDATE users SET actif = ?, updated_at = ? WHERE id = ?', [
    actif ? 1 : 0,
    new Date().toISOString(),
    userId,
  ]);
}

export async function updateUserPin(userId: string, pin: string): Promise<void> {
  const pinHash = await hashPin(pin);
  await db.runAsync('UPDATE users SET pin_hash = ?, updated_at = ? WHERE id = ?', [
    pinHash,
    new Date().toISOString(),
    userId,
  ]);
}
