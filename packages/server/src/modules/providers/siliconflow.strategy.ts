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
    id: 'v4-pro',
    name: 'DeepSeek V4 Pro',
    modelId: 'deepseek-ai/DeepSeek-V4-Pro',
    supportsThinking: true,
  },
  {
    id: 'kimi-k2.6',
    name: 'Kimi K2.6',
    modelId: 'Pro/moonshotai/Kimi-K2.6',
    supportsThinking: true,
  },
  {
    id: 'glm-5.1',
    name: 'GLM 5.1',
    modelId: 'Pro/zai-org/GLM-5.1',
    supportsThinking: true,
  },
  {
    id: 'minimax-m2.5',
    name: 'MiniMax M2.5',
    modelId: 'MiniMaxAI/MiniMax-M2.5',
    supportsThinking: true,
  },
  {
    id: 'qwen3.5-397b',
    name: 'Qwen3.5 397B A17B',
    modelId: 'Qwen/Qwen3.5-397B-A17B',
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
