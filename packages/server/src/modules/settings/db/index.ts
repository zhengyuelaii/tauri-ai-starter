import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export const SETTINGS_DB = Symbol('SETTINGS_DB');
export type SettingsDatabase = BetterSQLite3Database<typeof schema>;

function createDb(dbPath?: string): SettingsDatabase {
  const path = dbPath ?? join(homedir(), '.tauri-monorepo', 'settings.db');
  if (!dbPath) {
    mkdirSync(join(homedir(), '.tauri-monorepo'), { recursive: true });
  }
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS provider_configs (
      key TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      salt TEXT NOT NULL,
      iv TEXT NOT NULL,
      tag TEXT NOT NULL,
      base_url TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS model_settings (
      id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);
  return drizzle(sqlite, { schema });
}

export const db = createDb();
