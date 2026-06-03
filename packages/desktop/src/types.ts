export interface ModelDef {
  id: string;
  name: string;
  modelId: string;
  supportsThinking: boolean;
  enabled: boolean;
}

export interface PlatformMeta {
  key: string;
  name: string;
  connected: boolean;
  models: ModelDef[];
}
