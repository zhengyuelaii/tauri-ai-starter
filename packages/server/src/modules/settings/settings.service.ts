import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { eq, like } from 'drizzle-orm';
import { db, SETTINGS_DB, type SettingsDatabase } from './db';
import { providerConfigs, modelSettings } from '../../db/schema';
import { encrypt, decrypt, generateSalt } from './crypto';
import { randomUUID } from 'node:crypto';
import {
  getAllStrategies,
  clearProviderCache,
  registerCustomStrategy,
  unregisterCustomStrategy,
  isBuiltinProvider,
  modelIdFromKey,
} from '../providers';
import type { ModelDefinition, PlatformStrategy } from '../providers/types';
import { I18nException } from '../../common/i18n/i18n.exception';

export interface ProviderInfo {
  key: string;
  name: string;
  connected: boolean;
  hasApiKey: boolean;
  baseUrl: string | null;
  isCustom: boolean;
}

export interface ProvidersResponse {
  providers: ProviderInfo[];
}

export interface PlatformModelMeta {
  id: string;
  name: string;
  modelId: string;
  supportsThinking: boolean;
  enabled: boolean;
}

export interface PlatformMeta {
  key: string;
  name: string;
  connected: boolean;
  models: PlatformModelMeta[];
}

export interface PlatformsResponse {
  platforms: PlatformMeta[];
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly db: SettingsDatabase;

  constructor(@Inject(SETTINGS_DB) dbInstance?: SettingsDatabase) {
    this.db = dbInstance ?? db;
  }

  onModuleInit() {
    this.loadCustomStrategies();
  }

  private loadCustomStrategies() {
    const rows = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.isCustom, 1))
      .all();
    for (const row of rows) {
      registerCustomStrategy(this.buildCustomStrategy(row));
    }
  }

  private buildCustomStrategy(row: {
    key: string;
    name: string | null;
    baseUrl: string | null;
    modelsJson: string | null;
  }): PlatformStrategy {
    const models: ModelDefinition[] = row.modelsJson
      ? JSON.parse(row.modelsJson)
      : [];
    return {
      key: row.key,
      name: row.name ?? row.key,
      defaultBaseURL: row.baseUrl ?? '',
      models,
      getModelId: modelIdFromKey(models),
      configureThinking: () => ({}),
    };
  }

  async getProviders(): Promise<ProvidersResponse> {
    const strategies = getAllStrategies();
    const rows = this.db.select().from(providerConfigs).all();
    const rowMap = new Map(rows.map((r) => [r.key, r]));

    const providers = strategies.map((s) => {
      const cfg = rowMap.get(s.key);
      const defaultBaseUrl = s.defaultBaseURL ?? null;

      return {
        key: s.key,
        name: s.name,
        connected: !!cfg,
        hasApiKey: !!cfg,
        baseUrl: cfg?.baseUrl ?? defaultBaseUrl,
        isCustom: cfg ? cfg.isCustom === 1 : false,
      };
    });

    return { providers };
  }

  async connectProvider(
    key: string,
    apiKey: string,
    baseUrl?: string,
  ): Promise<void> {
    const strategy = getAllStrategies().find((s) => s.key === key);
    if (!strategy) {
      throw new I18nException(400, 'errors.unknownPlatform', { key });
    }

    const salt = generateSalt();
    const { encrypted, iv, tag } = encrypt(apiKey, salt);
    const now = new Date().toISOString();

    this.db.insert(providerConfigs)
      .values({
        key,
        apiKey: encrypted,
        salt,
        iv,
        tag,
        baseUrl: baseUrl ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: providerConfigs.key,
        set: {
          apiKey: encrypted,
          salt,
          iv,
          tag,
          baseUrl: baseUrl ?? null,
          updatedAt: now,
        },
      })
      .run();

    for (const model of strategy.models) {
      const id = `${key}:${model.id}`;
      this.db.insert(modelSettings)
        .values({ id, enabled: true, updatedAt: now })
        .onConflictDoUpdate({
          target: modelSettings.id,
          set: { enabled: true, updatedAt: now },
        })
        .run();
    }

    clearProviderCache(key);
  }

  async disconnectProvider(key: string): Promise<void> {
    this.db.delete(providerConfigs).where(eq(providerConfigs.key, key)).run();
    this.db.delete(modelSettings).where(like(modelSettings.id, `${key}:%`)).run();
    clearProviderCache(key);
  }

  async removeProvider(key: string): Promise<void> {
    if (isBuiltinProvider(key)) {
      await this.disconnectProvider(key);
    } else {
      await this.deleteCustomProvider(key);
    }
  }

  async createCustomProvider(dto: {
    name: string;
    baseUrl: string;
    apiKey: string;
    models: ModelDefinition[];
  }): Promise<{ key: string }> {
    const key = `custom_${randomUUID()}`;
    const salt = generateSalt();
    const { encrypted, iv, tag } = encrypt(dto.apiKey, salt);
    const now = new Date().toISOString();

    this.db.insert(providerConfigs)
      .values({
        key,
        apiKey: encrypted,
        salt,
        iv,
        tag,
        baseUrl: dto.baseUrl,
        isCustom: 1,
        name: dto.name,
        modelsJson: JSON.stringify(dto.models),
        updatedAt: now,
      })
      .run();

    for (const model of dto.models) {
      this.db.insert(modelSettings)
        .values({ id: `${key}:${model.id}`, enabled: true, updatedAt: now })
        .run();
    }

    const strategy = this.buildCustomStrategy({
      key,
      name: dto.name,
      baseUrl: dto.baseUrl,
      modelsJson: JSON.stringify(dto.models),
    });
    registerCustomStrategy(strategy);

    return { key };
  }

  async updateCustomProvider(
    key: string,
    dto: {
      name?: string;
      baseUrl?: string;
      apiKey?: string;
      models?: ModelDefinition[];
    },
  ): Promise<void> {
    const existing = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.key, key))
      .get();
    if (!existing) throw new I18nException(404, 'errors.providerNotFound', { key });
    if (!existing.isCustom) throw new I18nException(400, 'errors.cannotUpdateBuiltin', { key });

    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (dto.name !== undefined) set.name = dto.name;
    if (dto.baseUrl !== undefined) set.baseUrl = dto.baseUrl;
    if (dto.models !== undefined) {
      set.modelsJson = JSON.stringify(dto.models);
      // Add new model_settings entries for new models
      const now = new Date().toISOString();
      for (const model of dto.models) {
        this.db.insert(modelSettings)
          .values({ id: `${key}:${model.id}`, enabled: true, updatedAt: now })
          .onConflictDoUpdate({
            target: modelSettings.id,
            set: { enabled: true, updatedAt: now },
          })
          .run();
      }
    }

    if (dto.apiKey !== undefined) {
      const salt = generateSalt();
      const { encrypted, iv, tag } = encrypt(dto.apiKey, salt);
      set.salt = salt;
      set.iv = iv;
      set.tag = tag;
      set.apiKey = encrypted;
    }

    this.db.update(providerConfigs)
      .set(set)
      .where(eq(providerConfigs.key, key))
      .run();

    // Rebuild and re-register strategy
    unregisterCustomStrategy(key);
    const updated = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.key, key))
      .get()!;
    registerCustomStrategy(this.buildCustomStrategy(updated));
  }

  async deleteCustomProvider(key: string): Promise<void> {
    const existing = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.key, key))
      .get();
    if (!existing) throw new I18nException(404, 'errors.providerNotFound', { key });
    if (!existing.isCustom) throw new I18nException(400, 'errors.cannotDeleteBuiltin', { key });

    unregisterCustomStrategy(key);
    this.db.delete(providerConfigs).where(eq(providerConfigs.key, key)).run();
    this.db.delete(modelSettings).where(like(modelSettings.id, `${key}:%`)).run();
  }

  async setModelEnabled(
    providerKey: string,
    modelId: string,
    enabled: boolean,
  ): Promise<void> {
    const id = `${providerKey}:${modelId}`;
    const now = new Date().toISOString();
    this.db.insert(modelSettings)
      .values({ id, enabled, updatedAt: now })
      .onConflictDoUpdate({
        target: modelSettings.id,
        set: { enabled, updatedAt: now },
      })
      .run();
  }

  async getProviderConfig(providerKey: string): Promise<{
    apiKey: string | null;
    baseUrl: string | null;
  }> {
    const row = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.key, providerKey))
      .get();

    if (!row) return { apiKey: null, baseUrl: null };
    const apiKey = decrypt(row.apiKey, row.iv, row.salt, row.tag);
    return { apiKey, baseUrl: row.baseUrl ?? null };
  }

  async getApiKey(providerKey: string): Promise<string | null> {
    return (await this.getProviderConfig(providerKey)).apiKey;
  }

  async getBaseUrl(providerKey: string): Promise<string | null> {
    return (await this.getProviderConfig(providerKey)).baseUrl;
  }

  async getPlatformsMetadata(): Promise<PlatformsResponse> {
    const strategies = getAllStrategies();
    const providerRows = this.db.select().from(providerConfigs).all();
    const modelRows = this.db.select().from(modelSettings).all();

    const connectedSet = new Set(providerRows.map((r) => r.key));
    const enabledMap = new Map(modelRows.map((r) => [r.id, r.enabled]));

    const platforms = strategies
      .filter((s) => connectedSet.has(s.key))
      .map((s) => ({
        key: s.key,
        name: s.name,
        connected: true,
        models: s.models.map((m) => ({
          id: m.id,
          name: m.name,
          modelId: m.modelId,
          supportsThinking: m.supportsThinking,
          enabled: enabledMap.get(`${s.key}:${m.id}`) ?? true,
        })),
      }));

    return { platforms };
  }
}
