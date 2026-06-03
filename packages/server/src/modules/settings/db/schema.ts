import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const providerConfigs = sqliteTable('provider_configs', {
  key: text('key').primaryKey(),
  apiKey: text('api_key').notNull(),
  salt: text('salt').notNull(),
  iv: text('iv').notNull(),
  tag: text('tag').notNull(),
  baseUrl: text('base_url'),
  updatedAt: text('updated_at').notNull(),
});

export const modelSettings = sqliteTable('model_settings', {
  id: text('id').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});
