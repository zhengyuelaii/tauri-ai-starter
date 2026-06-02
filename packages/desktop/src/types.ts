export interface ModelDef {
  id: string;
  name: string;
  modelId: string;
  supportsThinking: boolean;
}

export interface PlatformMeta {
  key: string;
  name: string;
  models: ModelDef[];
}
