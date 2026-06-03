import { Injectable, Inject } from '@nestjs/common';
import { eq, like } from 'drizzle-orm';
import { db, SETTINGS_DB, type SettingsDatabase } from './db';
import { providerConfigs, modelSettings } from './db/schema';
import { encrypt, decrypt, generateSalt } from './crypto';
import { getAllStrategies, clearProviderCache } from '../chat/providers';

export interface ProviderInfo {
  key: string;
  name: string;
  connected: boolean;
  hasApiKey: boolean;
  baseUrl: string | null;
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
export class SettingsService {
  private readonly db: SettingsDatabase;

  constructor(@Inject(SETTINGS_DB) dbInstance?: SettingsDatabase) {
    this.db = dbInstance ?? db;
  }

  async getProviders(): Promise<ProvidersResponse> {
    const strategies = getAllStrategies();
    const rows = this.db.select().from(providerConfigs).all();
    const connectedMap = new Map(rows.map((r) => [r.key, r]));

    const providers = strategies.map((s) => {
      const cfg = connectedMap.get(s.key);
      const defaultBaseUrl =
        s.key === 'siliconflow'
          ? 'https://api.siliconflow.cn/v1'
          : s.key === 'deepseek'
            ? 'https://api.deepseek.com/v1'
            : null;

      return {
        key: s.key,
        name: s.name,
        connected: !!cfg,
        hasApiKey: !!cfg,
        baseUrl: cfg?.baseUrl ?? defaultBaseUrl,
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
      throw new Error(`Unknown platform: ${key}`);
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

  async getApiKey(providerKey: string): Promise<string | null> {
    const row = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.key, providerKey))
      .get();

    if (!row) return null;
    return decrypt(row.apiKey, row.iv, row.salt, row.tag);
  }

  async getBaseUrl(providerKey: string): Promise<string | null> {
    const row = this.db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.key, providerKey))
      .get();

    return row?.baseUrl ?? null;
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
