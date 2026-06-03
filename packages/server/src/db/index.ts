import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export const DB_TOKEN = Symbol('DB');
export type AppDatabase = BetterSQLite3Database<typeof schema>;

const DB_DIR = join(homedir(), '.tauri-monorepo');
const DB_PATH = join(DB_DIR, 'settings.db');

function ensureTables(sqlite: Database.Database) {
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
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '新对话',
      provider_key TEXT,
      model_id TEXT,
      enable_thinking INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      parts TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function runMigrations(sqlite: Database.Database) {
  const migrationsDir = join(dirname(__dirname), '..', 'drizzle');
  try {
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      sqlite.exec(sql);
    }
  } catch {
    // migrations dir doesn't exist in production, tables created via ensureTables
  }
}

function createDb(): AppDatabase {
  mkdirSync(DB_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  ensureTables(sqlite);
  runMigrations(sqlite);
  return drizzle(sqlite, { schema });
}

export const db = createDb();
