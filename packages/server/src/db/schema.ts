import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const providerConfigs = sqliteTable('provider_configs', {
  key: text('key').primaryKey(),
  apiKey: text('api_key').notNull(),
  salt: text('salt').notNull(),
  iv: text('iv').notNull(),
  tag: text('tag').notNull(),
  baseUrl: text('base_url'),
  isCustom: integer('is_custom').notNull().default(0),
  name: text('name'),
  modelsJson: text('models_json'),
  updatedAt: text('updated_at').notNull(),
});

export const modelSettings = sqliteTable('model_settings', {
  id: text('id').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('新对话'),
  providerKey: text('provider_key'),
  modelId: text('model_id'),
  enableThinking: integer('enable_thinking', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  parts: text('parts').notNull(),
  createdAt: text('created_at').notNull(),
});
