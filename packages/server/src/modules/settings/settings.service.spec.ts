import { Test, TestingModule } from '@nestjs/testing';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { SettingsService } from './settings.service';
import { SETTINGS_DB, type SettingsDatabase } from './db';
import * as schema from '../../db/schema';

function createTestDb(): SettingsDatabase {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS provider_configs (
      key TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      salt TEXT NOT NULL,
      iv TEXT NOT NULL,
      tag TEXT NOT NULL,
      base_url TEXT,
      is_custom INTEGER NOT NULL DEFAULT 0,
      name TEXT,
      models_json TEXT,
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
  return drizzle(sqlite, { schema }) as unknown as SettingsDatabase;
}

describe('SettingsService', () => {
  let service: SettingsService;
  let testDb: SettingsDatabase;

  beforeEach(async () => {
    testDb = createTestDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: SETTINGS_DB, useValue: testDb },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  // Crypto round-trip
  describe('encrypt/decrypt', () => {
    it('should round-trip an API key', async () => {
      await service.connectProvider('siliconflow', 'sk-test-key-123');
      const key = await service.getApiKey('siliconflow');
      expect(key).toBe('sk-test-key-123');
    });

    it('should return null for unknown provider', async () => {
      const key = await service.getApiKey('nonexistent');
      expect(key).toBeNull();
    });
  });

  // Provider connection
  describe('connectProvider', () => {
    it('should connect a provider and populate model_settings', async () => {
      await service.connectProvider('siliconflow', 'sk-test');

      const providers = await service.getProviders();
      const sf = providers.providers.find((p) => p.key === 'siliconflow');
      expect(sf?.connected).toBe(true);
      expect(sf?.hasApiKey).toBe(true);
    });

    it('should set all models as enabled on connect', async () => {
      await service.connectProvider('siliconflow', 'sk-test');

      const platforms = await service.getPlatformsMetadata();
      const sf = platforms.platforms.find((p) => p.key === 'siliconflow');
      expect(sf?.models.every((m) => m.enabled)).toBe(true);
      expect(sf?.models.length).toBeGreaterThan(0);
    });

    it('should throw for unknown platform', async () => {
      await expect(
        service.connectProvider('unknown', 'key'),
      ).rejects.toThrow('errors.unknownPlatform');
    });

    it('should re-enable models on re-connect after disconnect', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      await service.disconnectProvider('siliconflow');
      await service.connectProvider('siliconflow', 'sk-test');

      const platforms = await service.getPlatformsMetadata();
      const sf = platforms.platforms.find((p) => p.key === 'siliconflow');
      expect(sf?.models.every((m) => m.enabled)).toBe(true);
    });
  });

  // Provider disconnection
  describe('disconnectProvider', () => {
    it('should mark provider as disconnected', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      await service.disconnectProvider('siliconflow');

      const providers = await service.getProviders();
      const sf = providers.providers.find((p) => p.key === 'siliconflow');
      expect(sf?.connected).toBe(false);
    });

    it('should remove provider from platforms after disconnect', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      await service.disconnectProvider('siliconflow');

      const platforms = await service.getPlatformsMetadata();
      expect(platforms.platforms.length).toBe(0);
    });

    it('should clear API key on disconnect', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      await service.disconnectProvider('siliconflow');

      const key = await service.getApiKey('siliconflow');
      expect(key).toBeNull();
    });
  });

  // Model enable/disable
  describe('setModelEnabled', () => {
    it('should disable a model', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      await service.setModelEnabled('siliconflow', 'v4-flash', false);

      const platforms = await service.getPlatformsMetadata();
      const sf = platforms.platforms.find((p) => p.key === 'siliconflow');
      const model = sf?.models.find((m) => m.id === 'v4-flash');
      expect(model?.enabled).toBe(false);
    });

    it('should re-enable a disabled model', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      await service.setModelEnabled('siliconflow', 'v4-flash', false);
      await service.setModelEnabled('siliconflow', 'v4-flash', true);

      const platforms = await service.getPlatformsMetadata();
      const sf = platforms.platforms.find((p) => p.key === 'siliconflow');
      const model = sf?.models.find((m) => m.id === 'v4-flash');
      expect(model?.enabled).toBe(true);
    });

    it('should default to enabled for models not in settings', async () => {
      await service.connectProvider('deepseek', 'sk-test');

      const platforms = await service.getPlatformsMetadata();
      const ds = platforms.platforms.find((p) => p.key === 'deepseek');
      expect(ds?.models.every((m) => m.enabled)).toBe(true);
    });
  });

  // getPlatformsMetadata
  describe('getPlatformsMetadata', () => {
    it('should return only connected platforms', async () => {
      await service.connectProvider('siliconflow', 'sk-test');

      const result = await service.getPlatformsMetadata();
      expect(result.platforms.length).toBe(1);

      const sf = result.platforms[0];
      expect(sf?.key).toBe('siliconflow');
      expect(sf?.connected).toBe(true);
    });

    it('should return empty when no providers are connected', async () => {
      const result = await service.getPlatformsMetadata();
      expect(result.platforms.length).toBe(0);
    });
  });

  // getProviders
  describe('getProviders', () => {
    it('should list all providers with connection info', async () => {
      const result = await service.getProviders();
      expect(result.providers.length).toBe(2);
      expect(result.providers[0].key).toBeDefined();
      expect(result.providers[0].name).toBeDefined();
    });

    it('should show custom baseUrl when provided', async () => {
      await service.connectProvider(
        'siliconflow',
        'sk-test',
        'https://custom.api.com/v1',
      );
      const result = await service.getProviders();
      const sf = result.providers.find((p) => p.key === 'siliconflow');
      expect(sf?.baseUrl).toBe('https://custom.api.com/v1');
    });

    it('should show default baseUrl when not provided', async () => {
      await service.connectProvider('siliconflow', 'sk-test');
      const result = await service.getProviders();
      const sf = result.providers.find((p) => p.key === 'siliconflow');
      expect(sf?.baseUrl).toBe('https://api.siliconflow.cn/v1');
    });
  });

  describe('getProviderConfig', () => {
    it('should return both apiKey and baseUrl in one query', async () => {
      await service.connectProvider('siliconflow', 'sk-test', 'https://custom.api.com/v1');
      const config = await service.getProviderConfig('siliconflow');
      expect(config.apiKey).toBe('sk-test');
      expect(config.baseUrl).toBe('https://custom.api.com/v1');
    });

    it('should return nulls for unknown provider', async () => {
      const config = await service.getProviderConfig('nonexistent');
      expect(config.apiKey).toBeNull();
      expect(config.baseUrl).toBeNull();
    });
  });
});
