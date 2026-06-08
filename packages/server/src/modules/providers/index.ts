import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import type {
  PlatformStrategy,
  PlatformsMetadata,
  ThinkingConfig,
  ThinkingOptions,
} from './types';

export type { ThinkingOptions };
export { modelIdFromKey } from './types';
import { siliconflowStrategy } from './siliconflow.strategy';
import { deepseekStrategy } from './deepseek.strategy';

const builtinStrategies: PlatformStrategy[] = [siliconflowStrategy, deepseekStrategy];
const customStrategies = new Map<string, PlatformStrategy>();

function allStrategies(): PlatformStrategy[] {
  return [...builtinStrategies, ...customStrategies.values()];
}

const providerCache = new Map<string, OpenAICompatibleProvider>();

export function clearProviderCache(key?: string): void {
  if (key) {
    providerCache.delete(key);
  } else {
    providerCache.clear();
  }
}

export function getStrategy(key: string): PlatformStrategy | undefined {
  return allStrategies().find((s) => s.key === key);
}

export function getAllStrategies(): PlatformStrategy[] {
  return allStrategies();
}

export function registerCustomStrategy(strategy: PlatformStrategy): void {
  customStrategies.set(strategy.key, strategy);
  clearProviderCache(strategy.key);
}

export function unregisterCustomStrategy(key: string): void {
  customStrategies.delete(key);
  clearProviderCache(key);
}

export function isBuiltinProvider(key: string): boolean {
  return builtinStrategies.some((s) => s.key === key);
}

export function requireProvider(
  platformKey: string,
  apiKey: string,
  customBaseURL?: string,
): OpenAICompatibleProvider {
  const cached = providerCache.get(platformKey);
  if (cached) return cached;

  const strategy = getStrategy(platformKey);
  const baseURL = customBaseURL ?? strategy?.defaultBaseURL;
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
  options: ThinkingOptions,
): ThinkingConfig {
  const strategy = getStrategy(platformKey);
  if (!strategy) return {};
  return strategy.configureThinking(options);
}

export function getPlatformsMetadata(): PlatformsMetadata {
  return {
    platforms: allStrategies().map((s) => ({
      key: s.key,
      name: s.name,
      models: s.models,
    })),
  };
}
