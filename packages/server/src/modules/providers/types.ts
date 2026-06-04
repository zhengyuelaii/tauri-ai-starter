export interface ModelDefinition {
  id: string;
  name: string;
  modelId: string;
  supportsThinking: boolean;
}

export interface ThinkingConfig {
  transformRequestBody?: (args: Record<string, any>) => Record<string, any>;
  providerOptions?: Record<string, Record<string, unknown>>;
}

export interface ThinkingOptions {
  enabled: boolean;
  [key: string]: unknown;
}

export interface PlatformStrategy {
  readonly key: string;
  readonly name: string;
  readonly defaultBaseURL: string;
  readonly models: ModelDefinition[];
  getModelId(modelKey: string): string | undefined;
  configureThinking(options: ThinkingOptions): ThinkingConfig;
}

export interface PlatformsMetadata {
  platforms: Array<{
    key: string;
    name: string;
    models: ModelDefinition[];
  }>;
}

export function modelIdFromKey(
  models: ModelDefinition[],
): (modelKey: string) => string | undefined {
  return (modelKey: string) => models.find((m) => m.id === modelKey)?.modelId;
}
