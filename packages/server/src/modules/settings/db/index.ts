import { DB_TOKEN, type AppDatabase } from '../../../db';

export const SETTINGS_DB = DB_TOKEN;
export type SettingsDatabase = AppDatabase;

export { db } from '../../../db';
export { providerConfigs, modelSettings } from '../../../db/schema';
