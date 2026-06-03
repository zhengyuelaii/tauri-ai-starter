import type { PlatformMeta } from './types';

const BASE_URL = import.meta.env.DEV
  ? ''
  : `http://localhost:${__SERVER_PORT__}`;

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
