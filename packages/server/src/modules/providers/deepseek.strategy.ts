import type { PlatformStrategy, ModelDefinition, ThinkingOptions } from './types';
import { modelIdFromKey } from './types';

const models: ModelDefinition[] = [
  {
    id: 'v4-flash',
    name: 'DeepSeek V4 Flash',
    modelId: 'deepseek-v4-flash',
    supportsThinking: true,
  },
  {
    id: 'v4-pro',
    name: 'DeepSeek V4 Pro',
    modelId: 'deepseek-v4-pro',
    supportsThinking: true,
  },
];

export const deepseekStrategy: PlatformStrategy = {
  key: 'deepseek',
  name: 'DeepSeek',
  defaultBaseURL: 'https://api.deepseek.com/v1',
  models,
  getModelId: modelIdFromKey(models),

  configureThinking({ enabled }: ThinkingOptions) {
    return {
      providerOptions: {
        deepseek: {
          thinking: { type: enabled ? 'enabled' : 'disabled' },
        },
      },
    };
  },
};
