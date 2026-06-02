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

export interface PlatformStrategy {
  readonly key: string;
  readonly name: string;
  readonly models: ModelDefinition[];
  getModelId(modelKey: string): string | undefined;
  configureThinking(enableThinking: boolean): ThinkingConfig;
}

export interface PlatformsMetadata {
  platforms: Array<{
    key: string;
    name: string;
    models: ModelDefinition[];
  }>;
}
