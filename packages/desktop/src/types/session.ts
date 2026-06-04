export interface SessionData {
  id: string;
  title: string;
  providerKey: string | null;
  modelId: string | null;
  enableThinking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  id: string;
  role: string;
  parts: unknown[];
  createdAt: string;
}
