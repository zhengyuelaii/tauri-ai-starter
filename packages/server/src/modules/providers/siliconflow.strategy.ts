import type { PlatformStrategy, ModelDefinition, ThinkingOptions } from './types';
import { modelIdFromKey } from './types';

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
  defaultBaseURL: 'https://api.siliconflow.cn/v1',
  models,
  getModelId: modelIdFromKey(models),

  configureThinking({ enabled }: ThinkingOptions) {
    return {
      transformRequestBody: (body: any) => ({
        ...body,
        enable_thinking: enabled,
      }),
    };
  },
};
