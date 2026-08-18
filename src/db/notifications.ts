import * as Crypto from 'expo-crypto';
import { db } from './client';
import type { Notification, TypeNotification } from '../types';

interface NotificationRow {
  id: string;
  type: string;
  titre: string;
  message: string;
  user_id: string;
  lue: number;
  date: string;
  nom_user: string;
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type as TypeNotification,
    titre: row.titre,
    message: row.message,
    userId: row.user_id,
    nomUser: row.nom_user,
    lue: row.lue === 1,
    date: row.date,
  };
}

export interface NotificationInput {
  type: TypeNotification;
  titre: string;
  message: string;
  userId: string;
}

export async function creerNotification(
  etablissementId: string,
  input: NotificationInput
): Promise<void> {
  const date = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO notifications (id, etablissement_id, type, titre, message, user_id, lue, date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [Crypto.randomUUID(), etablissementId, input.type, input.titre, input.message, input.userId, date, date]
  );
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const rows = await db.getAllAsync<NotificationRow>(
    `SELECT n.*, u.nom as nom_user FROM notifications n
     JOIN users u ON u.id = n.user_id
     ORDER BY n.date DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapNotification);
}

export async function getNombreNotificationsNonLues(): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) as total FROM notifications WHERE lue = 0'
  );
  return row?.total ?? 0;
}

export async function marquerNotificationsLues(): Promise<void> {
  const date = new Date().toISOString();
  await db.runAsync('UPDATE notifications SET lue = 1, updated_at = ? WHERE lue = 0', [date]);
}
