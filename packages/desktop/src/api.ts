import type { PlatformMeta } from './types';

const BASE_URL = import.meta.env.DEV
  ? ''
  : `http://localhost:${__SERVER_PORT__}`;

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

export async function fetchPlatforms(): Promise<PlatformMeta[]> {
  const res = await fetch(`${BASE_URL}/api/platforms`);
  const data = (await res.json()) as { platforms: PlatformMeta[] };
  return data.platforms;
}

export async function fetchSettingsProviders() {
  const res = await fetch(`${BASE_URL}/api/settings/providers`);
  return (await res.json()) as {
    providers: Array<{
      key: string;
      name: string;
      connected: boolean;
      hasApiKey: boolean;
      baseUrl: string | null;
    }>;
  };
}

export async function connectProvider(
  key: string,
  apiKey: string,
  baseUrl?: string,
) {
  const res = await fetch(`${BASE_URL}/api/settings/providers/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, baseUrl }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? '连接失败');
  }
}

export async function disconnectProvider(key: string) {
  const res = await fetch(`${BASE_URL}/api/settings/providers/${key}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? '断开连接失败');
  }
}

export async function setModelEnabled(
  providerKey: string,
  modelId: string,
  enabled: boolean,
) {
  const res = await fetch(
    `${BASE_URL}/api/settings/models/${providerKey}/${modelId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    },
  );
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? '设置失败');
  }
}

// Session APIs

export async function fetchSessions(): Promise<SessionData[]> {
  const res = await fetch(`${BASE_URL}/api/sessions`);
  const data = (await res.json()) as { sessions: SessionData[] };
  return data.sessions;
}

export async function createSession(body?: {
  title?: string;
  providerKey?: string;
  modelId?: string;
  enableThinking?: boolean;
}): Promise<{ id: string; title: string; createdAt: string; updatedAt: string }> {
  const res = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? '创建会话失败');
  }
  return (await res.json()) as { id: string; title: string; createdAt: string; updatedAt: string };
}

export async function updateSession(
  id: string,
  body: { title?: string; providerKey?: string; modelId?: string; enableThinking?: boolean },
) {
  await fetch(`${BASE_URL}/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteSession(id: string) {
  const res = await fetch(`${BASE_URL}/api/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? '删除会话失败');
  }
}

export async function fetchMessages(
  sessionId: string,
  limit?: number,
  offset?: number,
): Promise<MessageData[]> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set('limit', String(limit));
  if (offset !== undefined) params.set('offset', String(offset));
  const qs = params.toString();
  const url = `${BASE_URL}/api/sessions/${sessionId}/messages${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  const data = (await res.json()) as { messages: MessageData[] };
  return data.messages;
}

export async function generateTitle(
  provider: string,
  model: string,
  message: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat/generate-title`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, message }),
  });
  if (!res.ok) {
    throw new Error('生成标题失败');
  }
  const data = (await res.json()) as { title: string };
  return data.title;
}

export async function addMessage(
  sessionId: string,
  message: { id: string; role: string; parts: unknown[]; createdAt: string },
) {
  await fetch(`${BASE_URL}/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}
