import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import type {
  PlatformStrategy,
  PlatformsMetadata,
  ThinkingConfig,
} from './types';
import { siliconflowStrategy } from './siliconflow.strategy';
import { deepseekStrategy } from './deepseek.strategy';

const strategies: PlatformStrategy[] = [siliconflowStrategy, deepseekStrategy];

const baseURLs: Record<string, string> = {
  siliconflow: 'https://api.siliconflow.cn/v1',
  deepseek: 'https://api.deepseek.com/v1',
};

const providerCache = new Map<string, OpenAICompatibleProvider>();

export function getStrategy(key: string): PlatformStrategy | undefined {
  return strategies.find((s) => s.key === key);
}

export function getAllStrategies(): PlatformStrategy[] {
  return strategies;
}

export function requireProvider(
  platformKey: string,
  apiKey: string,
): OpenAICompatibleProvider {
  const cached = providerCache.get(platformKey);
  if (cached) return cached;

  const baseURL = baseURLs[platformKey];
  if (!baseURL) {
    throw new Error(`Unknown platform: ${platformKey}`);
  }

  const provider = createOpenAICompatible({
    name: platformKey,
    baseURL,
    apiKey,
  });
  providerCache.set(platformKey, provider);
  return provider;
}

export function resolveModelId(
  platformKey: string,
  modelKey: string,
): string | undefined {
  return getStrategy(platformKey)?.getModelId(modelKey);
}

export function getThinkingConfig(
  platformKey: string,
  enableThinking: boolean,
): ThinkingConfig {
  const strategy = getStrategy(platformKey);
  if (!strategy) return {};
  return strategy.configureThinking(enableThinking);
}

export function getPlatformsMetadata(): PlatformsMetadata {
  return {
    platforms: strategies.map((s) => ({
      key: s.key,
      name: s.name,
      models: s.models,
    })),
  };
}
