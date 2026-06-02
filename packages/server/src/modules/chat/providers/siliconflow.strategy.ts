import type { PlatformStrategy, ModelDefinition } from './types';

const models: ModelDefinition[] = [
  {
    id: 'v4-flash',
    name: 'DeepSeek V4 Flash',
    modelId: 'deepseek-ai/DeepSeek-V4-Flash',
    supportsThinking: true,
  },
  {
    id: 'r1',
    name: 'DeepSeek R1',
    modelId: 'deepseek-ai/DeepSeek-R1',
    supportsThinking: true,
  },
];

export const siliconflowStrategy: PlatformStrategy = {
  key: 'siliconflow',
  name: 'SiliconFlow',
  models,

  getModelId(modelKey: string): string | undefined {
    return models.find((m) => m.id === modelKey)?.modelId;
  },

  configureThinking(enableThinking: boolean) {
    return {
      transformRequestBody: (body: any) => ({
        ...body,
        enable_thinking: enableThinking,
      }),
    };
  },
};
