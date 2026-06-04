import type { PlatformStrategy, ModelDefinition } from './types';

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
  models,

  getModelId(modelKey: string): string | undefined {
    return models.find((m) => m.id === modelKey)?.modelId;
  },

  configureThinking(enableThinking: boolean) {
    return {
      providerOptions: {
        deepseek: {
          thinking: { type: enableThinking ? 'enabled' : 'disabled' },
        },
      },
    };
  },
};
