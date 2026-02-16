/**
 * SQLite database service for IronTrack.
 * Uses @capacitor-community/sqlite; single connection, lazy init.
 * On web: requires jeep-sqlite element in DOM and initWebStore() before use.
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { Category, Photo, EntryWithItems, DashboardStats, EntryListItem } from '../models/types';
import { getItemStatus, getPendingQuantity } from '../models/types';
import { PREDEFINED_CATEGORY_NAMES, DEFAULT_CATEGORY_PRICE } from '../utils/constants';

const DB_NAME = 'irontrack.db';
const SCHEMA_VERSION = 1;

// Lazy-held DB connection (SQLiteDBConnection from plugin)
let db: Awaited<ReturnType<SQLiteConnection['createConnection']>> | null = null;

/**
 * Initialize DB: create connection, open, create tables, seed categories if empty.
 * On web: ensures jeep-sqlite element exists and initWebStore() is called first.
 * Safe to call multiple times; subsequent calls no-op if already initialized.
 */
export async function initDatabase(): Promise<void> {
  if (db) {
    console.log('[DB] Already initialized, skipping');
    return;
  }

  const platform = Capacitor.getPlatform();
  console.log('[DB] initDatabase() start, platform:', platform);

  const sqliteConn = new SQLiteConnection(CapacitorSQLite);

  if (platform === 'web') {
    console.log('[DB] Web: loading jeep-sqlite loader...');
    const { defineCustomElements } = await import('jeep-sqlite/loader');
    console.log('[DB] Web: defineCustomElements(window)...');
    await defineCustomElements(window);
    console.log('[DB] Web: adding jeep-sqlite element to DOM...');
    const jeepEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepEl);
    await customElements.whenDefined('jeep-sqlite');
    console.log('[DB] Web: initWebStore()...');
    await sqliteConn.initWebStore();
    console.log('[DB] Web: initWebStore() done');
  }

  console.log('[DB] createConnection()...');
  db = await sqliteConn.createConnection(DB_NAME, false, 'no-encryption', SCHEMA_VERSION, false);
  console.log('[DB] open()...');
  await db.open();
  console.log('[DB] open() done');

  // Enable foreign keys
  console.log('[DB] execute PRAGMA foreign_keys...');
  await db.execute('PRAGMA foreign_keys = ON;');

  // Create tables if not exist
  console.log('[DB] execute CREATE TABLEs...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      isCustom INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dateGiven TEXT NOT NULL,
      expectedReturnDate TEXT,
      notes TEXT,
      totalAmount REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entry_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId INTEGER NOT NULL,
      categoryId INTEGER NOT NULL,
      quantityGiven INTEGER NOT NULL,
      quantityReturned INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(entryId) REFERENCES entries(id) ON DELETE CASCADE,
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId INTEGER NOT NULL,
      uri TEXT NOT NULL,
      FOREIGN KEY(entryId) REFERENCES entries(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);
  console.log('[DB] CREATE TABLEs done');

  // Ensure schema_version row exists
  // Track schema version for future migrations
  const versionResult = await db.query('SELECT version FROM schema_version LIMIT 1');
  if (!versionResult.values?.length) {
    await db.run('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
  }
  console.log('[DB] schema_version ok');

  // Seed predefined categories if empty
  const catResult = await db.query('SELECT id FROM categories LIMIT 1');
  if (!catResult.values?.length) {
    console.log('[DB] Seeding predefined categories...');
    for (const name of PREDEFINED_CATEGORY_NAMES) {
      await db.run(
        'INSERT INTO categories (name, price, isCustom) VALUES (?, ?, 0)',
        [name, DEFAULT_CATEGORY_PRICE]
      );
    }
    console.log('[DB] Seed done');
  }

  console.log('[DB] initDatabase() complete');
}

function getDb(): NonNullable<typeof db> {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  const result = await getDb().query('SELECT id, name, price, isCustom FROM categories ORDER BY isCustom ASC, name ASC');
  return (result.values ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    name: row.name as string,
    price: row.price as number,
    isCustom: row.isCustom as number,
  }));
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await getDb().query('SELECT id, name, price, isCustom FROM categories WHERE id = ?', [id]);
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as number,
    name: row.name as string,
    price: row.price as number,
    isCustom: row.isCustom as number,
  };
}

export async function updateCategoryPrice(id: number, price: number): Promise<void> {
  await getDb().run('UPDATE categories SET price = ? WHERE id = ?', [price, id]);
}

export async function insertCategory(name: string, price: number, isCustom: number): Promise<number> {
  const result = await getDb().run('INSERT INTO categories (name, price, isCustom) VALUES (?, ?, ?)', [name, price, isCustom]);
  return (result as { changes?: { lastId?: number } })?.changes?.lastId ?? 0;
}

export async function deleteCategory(id: number): Promise<void> {
  // Only allow delete for custom categories; caller may check isCustom
  await getDb().run('DELETE FROM categories WHERE id = ? AND isCustom = 1', [id]);
}

// --- Entries ---
export interface InsertEntryInput {
  dateGiven: string;
  expectedReturnDate: string | null;
  notes: string | null;
  totalAmount: number;
  items: { categoryId: number; quantityGiven: number }[];
  photoUris: string[];
}

export async function insertEntry(input: InsertEntryInput): Promise<number> {
  const conn = getDb();
  // No explicit transaction: web (jeep-sqlite) can error with "transaction within transaction"
  const insertEntryResult = await conn.run(
    'INSERT INTO entries (dateGiven, expectedReturnDate, notes, totalAmount) VALUES (?, ?, ?, ?)',
    [input.dateGiven, input.expectedReturnDate ?? null, input.notes ?? null, input.totalAmount]
  );
  const entryId = (insertEntryResult as { changes?: { lastId?: number } })?.changes?.lastId ?? 0;
  try {
    for (const item of input.items) {
      await conn.run(
        'INSERT INTO entry_items (entryId, categoryId, quantityGiven, quantityReturned) VALUES (?, ?, ?, 0)',
        [entryId, item.categoryId, item.quantityGiven]
      );
    }
    for (const uri of input.photoUris) {
      await conn.run('INSERT INTO photos (entryId, uri) VALUES (?, ?)', [entryId, uri]);
    }
    return entryId;
  } catch (e) {
    // Best-effort cleanup: remove the entry we just added so we don't leave an orphan
    try {
      await conn.run('DELETE FROM entries WHERE id = ?', [entryId]);
    } catch (_) {
      /* ignore */
    }
    throw e;
  }
}

export async function getEntries(): Promise<EntryListItem[]> {
  const conn = getDb();
  const rows = await conn.query(`
    SELECT e.id, e.dateGiven, e.expectedReturnDate, e.notes, e.totalAmount,
           SUM(ei.quantityGiven) AS totalItems,
           SUM(ei.quantityGiven - ei.quantityReturned) AS pendingItems,
           SUM((ei.quantityGiven - ei.quantityReturned) * c.price) AS pendingAmount
    FROM entries e
    LEFT JOIN entry_items ei ON ei.entryId = e.id
    LEFT JOIN categories c ON c.id = ei.categoryId
    GROUP BY e.id
    ORDER BY e.dateGiven DESC, e.id DESC
  `);
  const list: EntryListItem[] = [];
  for (const row of (rows.values ?? []) as Record<string, unknown>[]) {
    const totalItems = (row.totalItems as number) ?? 0;
    const pendingItems = Math.max(0, (row.pendingItems as number) ?? 0);
    const pendingAmount = (row.pendingAmount as number) ?? 0;
    let status: 'Pending' | 'Partial' | 'Completed' = 'Completed';
    if (pendingItems > 0) status = pendingItems < totalItems ? 'Partial' : 'Pending';
    list.push({
      id: row.id as number,
      dateGiven: row.dateGiven as string,
      expectedReturnDate: (row.expectedReturnDate as string) ?? null,
      notes: (row.notes as string) ?? null,
      totalAmount: row.totalAmount as number,
      totalItems,
      pendingItems,
      pendingAmount,
      status,
    });
  }
  return list;
}

export async function getEntryById(id: number): Promise<EntryWithItems | null> {
  const conn = getDb();
  const entryRows = await conn.query(
    'SELECT id, dateGiven, expectedReturnDate, notes, totalAmount FROM entries WHERE id = ?',
    [id]
  );
  const er = (entryRows.values ?? [])[0] as Record<string, unknown> | undefined;
  if (!er) return null;

  const itemRows = await conn.query(
    `SELECT ei.id, ei.entryId, ei.categoryId, ei.quantityGiven, ei.quantityReturned, c.name AS categoryName, c.price AS pricePerItem
     FROM entry_items ei JOIN categories c ON c.id = ei.categoryId WHERE ei.entryId = ?`,
    [id]
  );
  const items = ((itemRows.values ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as number,
    entryId: row.entryId as number,
    categoryId: row.categoryId as number,
    quantityGiven: row.quantityGiven as number,
    quantityReturned: row.quantityReturned as number,
    categoryName: row.categoryName as string,
    pricePerItem: row.pricePerItem as number,
  }));

  const photoRows = await conn.query('SELECT id, entryId, uri FROM photos WHERE entryId = ?', [id]);
  const photos = ((photoRows.values ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as number,
    entryId: row.entryId as number,
    uri: row.uri as string,
  }));

  return {
    id: er.id as number,
    dateGiven: er.dateGiven as string,
    expectedReturnDate: (er.expectedReturnDate as string) ?? null,
    notes: (er.notes as string) ?? null,
    totalAmount: er.totalAmount as number,
    items,
    photos,
  };
}

export async function updateEntryItemReturned(id: number, quantityReturned: number): Promise<void> {
  await getDb().run('UPDATE entry_items SET quantityReturned = ? WHERE id = ?', [quantityReturned, id]);
}

export async function getPhotosByEntryId(entryId: number): Promise<Photo[]> {
  const result = await getDb().query('SELECT id, entryId, uri FROM photos WHERE entryId = ?', [entryId]);
  return ((result.values ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as number,
    entryId: row.entryId as number,
    uri: row.uri as string,
  }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const conn = getDb();
  const rows = await conn.query(`
    SELECT
      COUNT(DISTINCT e.id) AS activeEntries,
      COALESCE(SUM(ei.quantityGiven - ei.quantityReturned), 0) AS pendingClothes,
      COALESCE(SUM((ei.quantityGiven - ei.quantityReturned) * c.price), 0) AS pendingAmount
    FROM entries e
    LEFT JOIN entry_items ei ON ei.entryId = e.id
    LEFT JOIN categories c ON c.id = ei.categoryId
    WHERE (ei.quantityGiven - ei.quantityReturned) > 0
  `);
  const row = (rows.values ?? [])[0] as Record<string, unknown> | undefined;
  return {
    totalActiveEntries: Math.max(0, (row?.activeEntries as number) ?? 0),
    totalPendingClothes: Math.max(0, (row?.pendingClothes as number) ?? 0),
    totalPendingAmount: Math.max(0, (row?.pendingAmount as number) ?? 0),
  };
}

// Re-export helpers for UI
export { getItemStatus, getPendingQuantity };
