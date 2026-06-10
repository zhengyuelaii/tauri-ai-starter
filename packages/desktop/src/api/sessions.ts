import type { SessionData, MessageData } from '@/types';
import { fetchWithTimeout } from './utils';
import { i18n } from '@/composables/useLocale';

export async function fetchSessions(): Promise<SessionData[]> {
  const res = await fetchWithTimeout(`/api/sessions`);
  const data = (await res.json()) as { sessions: SessionData[] };
  return data.sessions;
}

export async function createSession(body?: {
  title?: string;
  providerKey?: string;
  modelId?: string;
  enableThinking?: boolean;
}): Promise<{ id: string; title: string; createdAt: string; updatedAt: string }> {
  const res = await fetchWithTimeout(`/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('api.createSessionFailed'));
  }
  return (await res.json()) as { id: string; title: string; createdAt: string; updatedAt: string };
}

export async function updateSession(
  id: string,
  body: { title?: string; providerKey?: string; modelId?: string; enableThinking?: boolean; titleGenerated?: boolean },
) {
  await fetchWithTimeout(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteSession(id: string) {
  const res = await fetchWithTimeout(`/api/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('api.deleteSessionFailed'));
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
  const url = `/api/sessions/${sessionId}/messages${qs ? `?${qs}` : ''}`;
  const res = await fetchWithTimeout(url);
  const data = (await res.json()) as { messages: MessageData[] };
  return data.messages;
}

export async function addMessage(
  sessionId: string,
  message: { id: string; role: string; parts: unknown[]; createdAt: string },
) {
  await fetchWithTimeout(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}
